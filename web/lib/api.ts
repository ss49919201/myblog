import { Post, PostList, ApiError } from '@/types/api';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : '/api';
const SERVER_API_BASE_URL = 'http://localhost:8080/api';

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

async function serverApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${SERVER_API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store', // Disable caching for fresh data
    ...options,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('NOT_FOUND');
    }
    
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error: ApiError = await response.json();
      errorMessage = error.message;
    } catch {
      // Fallback if response is not JSON
    }
    
    throw new Error(`API Error: ${errorMessage}`);
  }

  return response.json();
}

// Client-side API (for use in 'use client' components)
export const api = {
  // Get all posts
  getPosts: (): Promise<PostList> => {
    return apiRequest<PostList>('/posts');
  },

  // Get a single post by ID
  getPost: (id: string): Promise<Post> => {
    return apiRequest<Post>(`/posts/${id}`);
  },
};

// Server-side API (for use in server components)
export const serverApi = {
  // Get all posts
  getPosts: (): Promise<PostList> => {
    return serverApiRequest<PostList>('/posts');
  },

  // Get a single post by ID
  getPost: (id: string): Promise<Post> => {
    return serverApiRequest<Post>(`/posts/${id}`);
  },
};