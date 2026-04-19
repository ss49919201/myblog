import { Hono } from "hono";
import { serve } from "@hono/node-server";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";
const PORT = Number(process.env.PORT ?? 3000);

const app = new Hono();

app.all("/api/*", async (c) => {
  const url = new URL(c.req.url);
  const target = `${API_ORIGIN}${url.pathname}${url.search}`;

  const req = new Request(target, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: ["GET", "HEAD"].includes(c.req.method) ? undefined : c.req.raw.body,
  });

  const res = await fetch(req);
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Proxy server running on http://localhost:${info.port}`);
  console.log(`Forwarding /api/* → ${API_ORIGIN}`);
});
