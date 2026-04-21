import express from "express";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SERVICE = process.env.SERVICE_NAME || "order-service";

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: SERVICE,
    timestamp: new Date().toISOString()
  });
});

app.get("/", (_req, res) => {
  res.json({ message: `${SERVICE} running` });
});

app.listen(PORT, () => {
  console.log(`${SERVICE} listening on port ${PORT}`);
});
