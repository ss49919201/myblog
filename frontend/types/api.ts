export interface Post {
  id: string;
  title: string;
  body: string;
  publishdAt: string | null;
}

export interface PostList {
  items: Post[];
}

export interface PostMergePatchUpdate {
  id?: string;
  title?: string;
  body?: string;
  publishdAt?: string | null;
}

export interface AnalyzeResult {
  id: string;
  analysis: string;
}

export interface ApiError {
  code: number;
  message: string;
}