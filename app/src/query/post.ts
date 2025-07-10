import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Post = {
  id: string;
  title: string;
  body: string;
};

export async function getPost(id: string): Promise<Post | null> {
  const { env } = getCloudflareContext();
  const got = await env.KV_POST.get<JSON>(id);
  return got && (got as unknown as Post);
}
