import { createApp } from "./app.ts";
import { d1Read, type D1Like } from "./sql-read.ts";
import { siteConfig } from "./site.ts";

type AssetFetcher = {
  fetch(input: Request): Promise<Response>;
};

type Env = {
  DB: D1Like;
  ASSETS: AssetFetcher;
  SITE?: string;
};

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const app = createApp({
      sql: d1Read(env.DB),
      site: siteConfig(env.SITE),
      now: () => new Date(),
      asset: (pathname) => fetchAsset(env.ASSETS, request, pathname),
    });
    return Promise.resolve(app.fetch(request));
  },
};

async function fetchAsset(assets: AssetFetcher, request: Request, pathname: string): Promise<Response | undefined> {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  const response = await assets.fetch(new Request(url));
  if (response.status === 404) return undefined;
  return response;
}
