import express from "express";
import { fileURLToPath } from "node:url";

const templates = {
  tenant_invite: ({ recipientName, inviterName, tenantName, inviteUrl }) => ({
    subject: `You're invited to ${tenantName}`,
    html: `<p>Hello ${recipientName},</p><p>${inviterName} invited you to join ${tenantName}.</p><p><a href="${inviteUrl}">Accept invite</a></p>`
  }),
  vendor_invite: ({ recipientName, vendorName, tenantName, inviteUrl }) => ({
    subject: `You're invited to vendor ${vendorName}`,
    html: `<p>Hello ${recipientName},</p><p>You were invited to ${vendorName} on ${tenantName}.</p><p><a href="${inviteUrl}">Accept invite</a></p>`
  }),
  order_update: ({ recipientName, orderNumber, status, detailsUrl }) => ({
    subject: `Order ${orderNumber} is now ${status}`,
    html: `<p>Hello ${recipientName},</p><p>Your order <strong>${orderNumber}</strong> changed to <strong>${status}</strong>.</p><p><a href="${detailsUrl}">View order</a></p>`
  })
};

function createAdapter() {
  const provider = process.env.EMAIL_PROVIDER || "local";

  if (provider === "resend") {
    return {
      name: "resend",
      async send(email) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          throw new Error("RESEND_API_KEY missing");
        }

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "noreply@mzansi-spares.test",
            to: email.to,
            subject: email.subject,
            html: email.html
          })
        });

        if (!response.ok) {
          throw new Error(`resend_failed:${response.status}`);
        }

        return response.json();
      }
    };
  }

  return {
    name: "local-mail-sink",
    async send(email) {
      if (!process.env.MAIL_SINK_URL) {
        return { delivered: false, sink: "memory" };
      }

      const response = await fetch(process.env.MAIL_SINK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email)
      });

      if (!response.ok) {
        throw new Error(`mail_sink_failed:${response.status}`);
      }

      return response.json();
    }
  };
}

function createJobQueue({ handler, maxAttempts = 4, retryDelayMs = 25 }) {
  const jobs = [];

  async function processJob(job) {
    if (job.status === "completed") {
      return job;
    }

    job.attempts += 1;
    job.status = "processing";

    try {
      job.result = await handler(job.payload, job.attempts);
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
      return processJob(job);
    }
  }

  return {
    jobs,
    enqueue(payload) {
      const job = {
        id: `job-${crypto.randomUUID()}`,
        payload,
        attempts: 0,
        status: "queued",
        createdAt: new Date().toISOString()
      };

      jobs.push(job);
      return job;
    },
    async processPending() {
      const pending = jobs.filter((job) => ["queued", "retrying"].includes(job.status));
      const processed = [];
      for (const job of pending) {
        processed.push(await processJob(job));
      }
      return processed;
    }
  };
}

export function createApp(
  serviceName = process.env.SERVICE_NAME || "notification-service",
  options = {}
) {
  const app = express();
  const delivered = [];
  const adapter = options.adapter || createAdapter();

  const queue =
    options.queue ||
    createJobQueue({
      handler: async (payload) => {
        const template = templates[payload.type];
        if (!template) {
          throw new Error("template_not_supported");
        }

        const rendered = template(payload.data || {});
        const email = { to: payload.to, ...rendered };
        const providerResult = await adapter.send(email);
        delivered.push({ ...email, providerResult });
        return providerResult;
      }
    });

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: serviceName,
      adapter: adapter.name,
      timestamp: new Date().toISOString()
    });
  });

  app.post("/notifications/jobs", async (req, res) => {
    const { type, to, data, autoProcess = true } = req.body;
    if (!type || !to) {
      return res.status(400).json({ error: "type and to are required" });
    }

    const job = queue.enqueue({ type, to, data });
    if (autoProcess) {
      await queue.processPending();
    }

    return res.status(202).json(job);
  });

  app.post("/notifications/process", async (_req, res) => {
    const jobs = await queue.processPending();
    return res.json(jobs);
  });

  app.get("/notifications/jobs/:jobId", (req, res) => {
    const job = queue.jobs.find((item) => item.id === req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "job not found" });
    }

    return res.json(job);
  });

  app.get("/notifications/outbox", (_req, res) => {
    return res.json(delivered);
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const app = createApp();
  return app.listen(port, () => {
    console.log(`notification-service listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export { createJobQueue };
