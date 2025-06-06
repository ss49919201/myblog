import { Post, PostList, PostMergePatchUpdate, AnalyzeResult, ApiError } from '@/types/api';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : '/api';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(`API Error: ${error.message}`);
  }

  return response.json();
}

export const api = {
  // Get all posts
  getPosts: (): Promise<PostList> => {
    return apiRequest<PostList>('/posts');
  },

  // Get a single post by ID
  getPost: (id: string): Promise<Post> => {
    return apiRequest<Post>(`/posts/${id}`);
  },

  // Create a new post
  createPost: (post: Omit<Post, 'id'>): Promise<Post> => {
    return apiRequest<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },

  // Update a post
  updatePost: (id: string, updates: PostMergePatchUpdate): Promise<Post> => {
    return apiRequest<Post>(`/posts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(updates),
    });
  },

  // Delete a post
  deletePost: (id: string): Promise<void> => {
    return apiRequest<void>(`/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // Analyze a post
  analyzePost: (id: string): Promise<AnalyzeResult> => {
    return apiRequest<AnalyzeResult>(`/posts/${id}/analyze`, {
      method: 'POST',
    });
  },
};