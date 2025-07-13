import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Post = {
  id: string;
  title: string;
  body: string;
};

export async function getPost(id: string): Promise<Post | null> {
  const kv = await kvPost();
  const got = await kv.get(id, "json");
  return got as Post;
}

export async function searchPosts(): Promise<Post[]> {
  const kv = await kvPost();
  const { keys } = await kv.list();

  const listed = (
    await Promise.all(
      keys.map(async (key) => {
        return await getPost(key.name);
      })
    )
  ).filter((v) => !!v);

  return listed as unknown as Post[];
}

async function kvPost(): Promise<CloudflareEnv["KV_POST"]> {
  const context = await getCloudflareContext({ async: true });
  return context.env.KV_POST;
}
