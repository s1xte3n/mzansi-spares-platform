import http from "node:http";
import { fileURLToPath } from "node:url";

export function createWebServer() {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>mzansi-spares-platform web (local stub)</h1>");
  });
}

export function startWebServer(port = Number(process.env.PORT || 5173)) {
  const server = createWebServer();

  server.listen(port, () => {
    console.log(`web listening on port ${port}`);
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startWebServer();
}
