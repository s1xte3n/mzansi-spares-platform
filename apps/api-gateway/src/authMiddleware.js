import { requireAuth } from "@clerk/express";

function runRequireAuth(req, res) {
  return new Promise((resolve, reject) => {
    const middleware = requireAuth();

    middleware(req, res, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function authenticateRequest(req, res, next) {
  try {
    if (process.env.NODE_ENV === "development") {
      const devUserId = req.header("x-dev-clerk-user-id");

      if (devUserId) {
        req.clerkUserId = devUserId;
        return next();
      }
    }

    await runRequireAuth(req, res);
    req.clerkUserId = req.auth.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export async function resolveAuthContext(req, res, next) {
  const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || "http://identity-service:3000";

  let response;
  try {
    response = await fetch(`${identityServiceUrl}/internal/auth-context`, {
      headers: {
        "x-clerk-user-id": req.clerkUserId,
        "x-tenant-id": req.header("x-tenant-id") || "",
        "x-vendor-id": req.header("x-vendor-id") || "",
        "x-correlation-id": req.correlationId || ""
      }
    });
  } catch {
    return res.status(503).json({ error: "Identity service unavailable" });
  }

  if (!response.ok) {
    return res.status(403).json({ error: "Authorization context denied" });
  }

  req.authContext = await response.json();
  return next();
}
