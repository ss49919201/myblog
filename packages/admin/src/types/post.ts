export type PostStatus = "published" | "draft";

export type Post = {
  id: string;
  title: string;
  status: PostStatus;
  updatedAt: string;
};
