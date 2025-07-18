import { searchPosts, getAllTags } from "@/query/post";
import { createLogger } from "@/logger";
import HomePage from "@/components/HomePage";

export default async function Home() {
  const logger = createLogger({ component: 'HomePage' });
  
  logger.info('Rendering home page');
  const posts = await searchPosts();
  const allTags = await getAllTags();
  logger.info(`Home page rendered with ${posts.length} posts and ${allTags.length} tags`);

  return <HomePage initialPosts={posts} allTags={allTags} />;
}
