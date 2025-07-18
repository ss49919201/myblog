import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createLogger } from "@/logger";

export type Post = {
  id: string;
  title: string;
  body: string;
  tags: string[];
};

export async function getPost(id: string): Promise<Post | null> {
  const logger = createLogger({ component: 'post.getPost' });
  
  try {
    logger.info(`Fetching post with ID: ${id}`);
    const kv = await kvPost();
    const got = await kv.get(id, "json");
    
    if (got) {
      logger.info(`Post found: ${id}`);
      return got as Post;
    } else {
      logger.warn(`Post not found: ${id}`);
      return null;
    }
  } catch (error) {
    logger.error(`Failed to fetch post: ${id}`, { postId: id }, error as Error);
    return null;
  }
}

export async function searchPosts(): Promise<Post[]> {
  const logger = createLogger({ component: 'post.searchPosts' });
  
  try {
    logger.info('Searching for posts');
    const kv = await kvPost();
    const { keys } = await kv.list();
    
    logger.info(`Found ${keys.length} post keys`);

    const listed = (
      await Promise.all(
        keys.map(async (key) => {
          return await getPost(key.name);
        })
      )
    ).filter((v) => !!v);

    logger.info(`Successfully loaded ${listed.length} posts`);
    return listed as unknown as Post[];
  } catch (error) {
    logger.error('Failed to search posts', {}, error as Error);
    return [];
  }
}

export async function searchPostsByTag(tag: string): Promise<Post[]> {
  const logger = createLogger({ component: 'post.searchPostsByTag' });
  
  try {
    logger.info(`Searching for posts with tag: ${tag}`);
    const allPosts = await searchPosts();
    const filteredPosts = allPosts.filter(post => 
      post.tags && post.tags.includes(tag)
    );
    
    logger.info(`Found ${filteredPosts.length} posts with tag: ${tag}`);
    return filteredPosts;
  } catch (error) {
    logger.error(`Failed to search posts by tag: ${tag}`, { tag }, error as Error);
    return [];
  }
}

export async function getAllTags(): Promise<string[]> {
  const logger = createLogger({ component: 'post.getAllTags' });
  
  try {
    logger.info('Getting all tags');
    const allPosts = await searchPosts();
    const allTags = allPosts.flatMap(post => post.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();
    
    logger.info(`Found ${uniqueTags.length} unique tags`);
    return uniqueTags;
  } catch (error) {
    logger.error('Failed to get all tags', {}, error as Error);
    return [];
  }
}

async function kvPost(): Promise<CloudflareEnv["KV_POST"]> {
  const context = await getCloudflareContext({ async: true });
  return context.env.KV_POST;
}
