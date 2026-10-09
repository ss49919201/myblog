function requireSite(site: URL | string | undefined): URL | string {
  if (!site) {
    throw new Error(
      "site is not set. Configure `site` in astro.config.ts or the SITE environment variable.",
    );
  }
  return site;
}

export function postOgImageUrl(slug: string, site: URL | string | undefined): URL {
  return new URL(`/og/posts/${slug}.png`, requireSite(site));
}

export function siteOgImageUrl(site: URL | string | undefined): URL {
  return new URL("/og/site.png", requireSite(site));
}
