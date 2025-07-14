# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Cloudflare Deployment
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run preview` - Build and preview deployment locally
- `npm run cf-typegen` - Generate TypeScript types for Cloudflare environment

### Data Management
- `npm run seed:kv` - Populate KV storage with dummy blog posts
- `npm run seed:kv:list` - List all stored KV data

## Architecture Overview

This is a **Next.js 15 blog application** deployed on **Cloudflare Workers** using the OpenNext.js Cloudflare adapter. The architecture combines React Server Components with edge computing for optimal performance.

### Key Technologies
- **Next.js 15** with App Router (stable)
- **OpenNext.js Cloudflare** for deployment to Cloudflare Workers
- **Cloudflare KV** for persistent blog post storage
- **React Markdown** for post content rendering
- **TypeScript** throughout the codebase

### Application Structure

#### Data Layer (`src/query/post.ts`)
- Uses `getCloudflareContext()` to access KV storage in both development and production
- `getPost(id)` - Retrieve single blog post by ID
- `searchPosts()` - Retrieve all blog posts for listing
- Posts are stored as JSON objects with `id`, `title`, and `body` properties

#### Routing Structure
- `/` - Homepage displaying all blog posts with previews
- `/post/[id]` - Individual post page with full content

#### Components
- Homepage (`src/app/page.tsx`) - Lists all posts with React Markdown previews
- Post page (`src/app/post/[id]/page.tsx`) - Full post display with complete Markdown rendering
- Layout (`src/app/layout.tsx`) - Root layout with Geist fonts

### Cloudflare Integration

#### KV Storage Configuration
- Binding name: `KV_POST`
- Used for storing blog posts as JSON
- Configured in `wrangler.jsonc` with preview placeholder ID

#### Development vs Production
- Development: Uses local KV storage via wrangler dev
- Production: Uses actual Cloudflare KV namespace
- The `initOpenNextCloudflareForDev()` call in `next.config.ts` enables KV access during development

### Data Management Workflow

The `scripts/seed-kv-data.js` script provides comprehensive KV data management:
- Creates dummy blog posts in Japanese with technical content
- Uses `wrangler kv key put` commands with `--local` flag for development
- Supports listing existing data with `--list` flag
- Must be run while `wrangler dev` is active in another terminal

### Development Workflow

1. Start development server: `npm run dev` (automatically initializes Cloudflare context)
2. In separate terminal, seed data: `npm run seed:kv` (requires wrangler dev to be running)
3. Access application at http://localhost:3000
4. For deployment: `npm run deploy`

### Important Implementation Details

- All pages use React Server Components by default
- Markdown content is rendered using `react-markdown` with custom component styling
- Error handling includes `notFound()` for missing posts
- Styling is done with inline styles throughout the application
- Japanese language content is used for blog posts and UI text