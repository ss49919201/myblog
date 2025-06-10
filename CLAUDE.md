# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyBlog is a blog application with a Go backend API and Next.js frontend. The backend uses MySQL for data persistence and follows a hybrid architectural pattern: simple read operations bypass usecase layers for performance, while write operations use full layered architecture.

## Development Commands

### Backend (Go API)
- `make start` - Start the Go API server on port 8080
- `make gen-oapi` - Generate OpenAPI code from schema
- `go run ./api/internal/cmd` - Alternative way to start server
- `npm run tsp-compile` - Compile TypeSpec to generate OpenAPI schema

### Frontend (Next.js)
Navigate to `web/` directory first:
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `docker compose up mysql` - Start MySQL database container
- Database runs on localhost:3306 with credentials: user/password, database: rdb
- Schema: `database/schema.sql`

### CI/CD (GitHub Actions)
- **CI Workflow**: Runs on push/PR to main/develop branches
  - Backend: Go linting, unit/integration tests, TypeSpec compilation
  - Frontend: ESLint, TypeScript checks, Next.js build
  - Security: gosec scanning, npm audit
- **CodeQL**: Weekly security analysis for Go and JavaScript/TypeScript
- Integration tests require MySQL service (automatically configured in CI)

## Architecture Overview

### Backend Structure
The Go backend follows a domain-driven design with different patterns for read vs write operations:

**Read Operations (Performance-focused):**
```
Handler → Infrastructure (RDB) directly
```

**Write Operations (Business logic-focused):**
```
Handler → Usecase → Repository Interface → Infrastructure (RDB)
```

Key directories:
- `api/internal/cmd/` - Application entry point
- `api/internal/server/` - HTTP handlers (Gin framework)
- `api/internal/post/` - Post domain logic
  - `di/` - Dependency injection container
  - `entity/` - Domain entities with validation
  - `usecase/` - Business logic (write operations only)
  - `repository/` - Repository interfaces
  - `rdb/` - Database implementations
- `api/internal/openapi/` - Generated OpenAPI handlers

### Frontend Structure
Next.js 15 application with TypeScript and Tailwind CSS:
- `web/app/` - App router pages
- `web/lib/api.ts` - API client
- `web/types/api.ts` - TypeScript type definitions

### Database Design
- Single `posts` table with UUID primary keys
- Uses MySQL UUID functions: `UUID_TO_BIN()` and `BIN_TO_UUID()`
- Schema in `database/schema.sql`

## Key Implementation Patterns

### Entity Validation
Entities include business validation logic:
```go
func ValidateTitle(title string) error {
    if len(title) < 1 || len(title) > 50 {
        return errors.New("title must be between 1 and 50 characters")
    }
    return nil
}
```

### Dependency Injection
Uses singleton pattern with lazy initialization:
```go
container := di.NewContainer()
usecase, err := container.CreatePostUsecase()
```

### API Error Handling
- 400: Validation errors
- 404: Resource not found  
- 500: System errors

### TypeSpec/OpenAPI Workflow
1. Edit `api/main.tsp` for API definitions
2. Run `npm run tsp-compile` to generate OpenAPI schema
3. Run `make gen-oapi` to generate Go handlers

## File Naming Conventions
- Go files: snake_case
- Entity constructors: `Construct()` for new, `Reconstruct()` for DB restoration
- Test files: `*_test.go` for unit tests, `*_integration_test.go` for integration tests

## Testing Strategy
- Integration tests use Docker MySQL environment
- Unit tests mock repository interfaces
- Test files include comprehensive error scenarios

## CLAUDE.md Maintenance Rules

When committing changes, Claude Code should evaluate whether CLAUDE.md needs updates in these scenarios:

### When to Update CLAUDE.md:
1. **New development commands** - Adding scripts to package.json, Makefile, or new build/test commands
2. **Architecture changes** - Modifying the read/write operation patterns, adding new layers, or changing DI structure
3. **New domains/modules** - Adding domains beyond "post" (e.g., user, comment modules)
4. **Database schema changes** - Modifications to table structure or new tables
5. **API changes** - New endpoints, changed patterns in TypeSpec/OpenAPI workflow
6. **New file/directory conventions** - Changes to naming patterns or project structure
7. **New testing approaches** - Additional test types or testing infrastructure changes

### When NOT to Update CLAUDE.md:
- Bug fixes that don't change architecture or commands
- Refactoring within existing patterns
- Content changes (post titles, bodies, etc.)
- Minor dependency updates
- Code formatting or linting fixes

### Update Process:
Before committing, check if changes fall into the "update required" categories above. If yes, update the relevant sections in CLAUDE.md to reflect the new patterns or commands.