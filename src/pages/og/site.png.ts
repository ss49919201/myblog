import type { APIRoute } from "astro";

import { renderSiteOgPng } from "../../lib/og/render";

export const GET: APIRoute = async () => {
  const png = await renderSiteOgPng();
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
