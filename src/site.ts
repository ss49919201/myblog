import type { Site } from "./types.ts";

const siteName = "myblog";

const siteDescription = "個人のブログ";

export function siteConfig(origin: string | undefined): Site {
  return {
    name: siteName,
    description: siteDescription,
    origin: parseOrigin(origin),
  };
}

function parseOrigin(value: string | undefined): string {
  const raw = value && value.length > 0 ? value : "https://example.com";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`SITE ${JSON.stringify(raw)} はオリジンではありません`);
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`SITE ${JSON.stringify(raw)} はオリジンではありません`);
  }
  return url.origin;
}
