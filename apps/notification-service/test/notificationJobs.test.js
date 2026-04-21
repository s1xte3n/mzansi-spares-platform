import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

test("email job retries and eventually succeeds", async () => {
  let sendAttempts = 0;
  const adapter = {
    name: "test",
    async send() {
      sendAttempts += 1;
      if (sendAttempts < 3) {
        throw new Error("transient_failure");
      }

      return { id: "msg-1" };
    }
  };

  const app = createApp("notification-test", { adapter });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const createRes = await fetch(`http://127.0.0.1:${port}/notifications/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "tenant_invite",
      to: "user@example.com",
      data: {
        recipientName: "User",
        inviterName: "Admin",
        tenantName: "Demo Spares",
        inviteUrl: "https://example.com/invite"
      }
    })
  });

  const created = await createRes.json();
  const jobRes = await fetch(`http://127.0.0.1:${port}/notifications/jobs/${created.id}`);
  const job = await jobRes.json();

  server.close();

  assert.equal(createRes.status, 202);
  assert.equal(job.status, "completed");
  assert.equal(job.attempts, 3);
});
