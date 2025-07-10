import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Post = {
  id: string;
  title: string;
  body: string;
};

export async function getPost(id: string): Promise<Post | null> {
  const got = await kvPost().get<JSON>(id);
  return got && (got as unknown as Post);
}

export async function searchPosts(): Promise<Post[]> {
  const { keys } = await kvPost().list<JSON>();

  const listed = (
    await Promise.all(
      keys.map(async (key) => {
        return await getPost(key.name);
      })
    )
  ).filter((v) => !!v);

  return listed as unknown as Post[];
}

function kvPost(): CloudflareEnv["KV_POST"] {
  return getCloudflareContext().env.KV_POST;
}
