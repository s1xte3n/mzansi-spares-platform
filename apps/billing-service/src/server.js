import express from "express";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

function parseAuthContext(req) {
  try {
    return JSON.parse(req.header("x-auth-context") || "{}");
  } catch {
    return {};
  }
}

function hasTenantAdmin(authContext, tenantId) {
  return (
    authContext?.scopes?.isPlatformStaff ||
    (authContext?.tenants ?? []).some(
      (membership) => membership.tenantId === tenantId && membership.role === "tenant_admin"
    )
  );
}

function createRetryQueue({ handler, maxAttempts = 4, retryDelayMs = 30 }) {
  const jobs = [];

  async function run(job) {
    if (job.status === "completed") {
      return job;
    }

    job.attempts += 1;
    job.status = "processing";

    try {
      await handler(job.payload);
      job.status = "completed";
      return job;
    } catch (error) {
      job.error = error.message;
      if (job.attempts >= maxAttempts) {
        job.status = "failed";
        return job;
      }

      job.status = "retrying";
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      return run(job);
    }
  }

  return {
    jobs,
    enqueue(payload) {
      const job = {
        id: `bill-job-${crypto.randomUUID()}`,
        payload,
        status: "queued",
        attempts: 0
      };
      jobs.push(job);
      return job;
    },
    async processPending() {
      const pending = jobs.filter((job) => ["queued", "retrying"].includes(job.status));
      for (const job of pending) {
        await run(job);
      }
      return pending;
    }
  };
}

function createCheckoutProvider() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      mode: "stub",
      async createCheckoutSession({ tenantId, planCode }) {
        return {
          id: `cs_test_${tenantId}`,
          url: `https://example.test/stripe-checkout/${tenantId}?plan=${planCode}`,
          mode: "subscription"
        };
      }
    };
  }

  const stripe = new Stripe(secret);
  return {
    mode: "stripe",
    async createCheckoutSession({ tenantId, planCode, successUrl, cancelUrl, customerEmail }) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: planCode, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: { tenantId }
      });

      return {
        id: session.id,
        url: session.url,
        mode: session.mode
      };
    }
  };
}

async function defaultTenantSync({ tenantId, state }) {
  const baseUrl = process.env.TENANT_SERVICE_URL || "http://localhost:4002";
  const token = process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token";

  const response = await fetch(`${baseUrl}/tenants/${tenantId}/billing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": token
    },
    body: JSON.stringify(state)
  });

  if (!response.ok) {
    throw new Error(`tenant_sync_failed:${response.status}`);
  }
}

export function createApp(
  serviceName = process.env.SERVICE_NAME || "billing-service",
  options = {}
) {
  const app = express();
  const checkout = options.checkoutProvider || createCheckoutProvider();
  const processedWebhookEvents = options.processedWebhookEvents || new Set();
  const tenantSync = options.tenantSync || defaultTenantSync;
  const queue =
    options.queue ||
    createRetryQueue({
      handler: async (payload) => tenantSync(payload)
    });

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: serviceName,
      checkoutProvider: checkout.mode,
      timestamp: new Date().toISOString()
    });
  });

  app.post("/billing/checkout-session", async (req, res) => {
    const authContext = parseAuthContext(req);
    const { tenantId, planCode, successUrl, cancelUrl, customerEmail } = req.body;

    if (!tenantId || !planCode) {
      return res.status(400).json({ error: "tenantId and planCode are required" });
    }

    if (!hasTenantAdmin(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant admin scope denied" });
    }

    const session = await checkout.createCheckoutSession({
      tenantId,
      planCode,
      successUrl: successUrl || "http://localhost:5173/billing?status=success",
      cancelUrl: cancelUrl || "http://localhost:5173/billing?status=cancel",
      customerEmail
    });

    return res.status(201).json(session);
  });

  app.post("/billing/webhooks/stripe", async (req, res) => {
    const event = req.body;

    if (!event?.id || !event?.type) {
      return res.status(400).json({ error: "Invalid webhook event" });
    }

    if (processedWebhookEvents.has(event.id)) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const payload = event.data?.object || {};
    const tenantId = payload.metadata?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: "tenantId metadata missing" });
    }

    if (event.type.startsWith("customer.subscription.")) {
      queue.enqueue({
        tenantId,
        state: {
          subscriptionStatus: payload.status,
          stripeCustomerId: payload.customer,
          stripeSubscriptionId: payload.id,
          subscriptionPlan: payload.items?.data?.[0]?.price?.id ?? "unknown"
        }
      });

      await queue.processPending();
    }

    processedWebhookEvents.add(event.id);
    return res.status(200).json({ received: true });
  });

  app.get("/billing/events", (_req, res) => {
    return res.json({ processed: Array.from(processedWebhookEvents) });
  });

  app.get("/billing/jobs", (_req, res) => {
    return res.json(queue.jobs);
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const app = createApp();
  return app.listen(port, () => {
    console.log(`billing-service listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export { createRetryQueue };
