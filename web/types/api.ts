export interface Post {
  id: string;
  title: string;
  body: string;
  publishdAt: string | null;
}

export interface PostList {
  items: Post[];
}

export interface AnalyzeResult {
  id: string;
  analysis: string;
}

export interface ApiError {
  code: number;
  message: string;
}