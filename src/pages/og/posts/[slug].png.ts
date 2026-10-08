import type { APIRoute } from "astro";

import { renderPostOgPng } from "../../../lib/og/render";
import { publishedPosts } from "../../../lib/posts";

export async function getStaticPaths() {
  const posts = await publishedPosts();
  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { title: post.data.title },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderPostOgPng({ title: props.title });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
