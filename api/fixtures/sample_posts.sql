-- Sample data with rich content for development and testing
DELETE FROM posts;

INSERT INTO posts (id, title, body, status, scheduled_at, category, tags, featured_image_url, meta_description, slug, sns_auto_post, external_notification, emergency_flag, created_at, published_at) VALUES 

-- Published posts with Markdown content
(UUID_TO_BIN('01234567-89ab-cdef-0123-456789abcdef'), 
 'Getting Started with Go and MySQL', 
 '# Welcome to Go Development\n\nThis is a comprehensive guide to **building web applications** with Go and MySQL.\n\n## What You''ll Learn\n\n- Setting up a Go project\n- Connecting to MySQL database\n- Creating REST APIs\n- Writing tests\n\n### Prerequisites\n\nBefore we start, make sure you have:\n\n1. Go 1.21+ installed\n2. MySQL 8.0+ running\n3. Basic understanding of web development\n\n```go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}\n```\n\n> **Pro Tip**: Always write tests first when developing new features!\n\nFor more information, visit [Go official documentation](https://golang.org/doc/).\n\n---\n\nHappy coding! 🚀', 
 'published', NULL, 'programming', 
 '["go", "mysql", "tutorial", "beginner"]', 
 'https://example.com/images/go-mysql.jpg', 
 'Learn how to build web applications with Go and MySQL in this comprehensive tutorial', 
 'getting-started-go-mysql', 
 TRUE, FALSE, FALSE, 
 '2024-01-15 09:00:00', '2024-01-15 09:00:00'),

(UUID_TO_BIN('12345678-9abc-def0-1234-56789abcdef0'), 
 'Advanced Database Patterns in Go', 
 '# Advanced Database Patterns\n\nExploring sophisticated database patterns for **Go applications**.\n\n## Repository Pattern\n\nThe repository pattern provides a consistent interface for data access:\n\n```go\ntype PostRepository interface {\n    Create(post *Post) error\n    FindByID(id string) (*Post, error)\n    Update(post *Post) error\n    Delete(id string) error\n}\n```\n\n## Benefits\n\n- **Testability**: Easy to mock for unit tests\n- **Maintainability**: Centralized data access logic\n- **Flexibility**: Easy to switch database implementations\n\n### Implementation Example\n\n```go\ntype mysqlPostRepository struct {\n    db *sql.DB\n}\n\nfunc (r *mysqlPostRepository) Create(post *Post) error {\n    query := `INSERT INTO posts (title, body) VALUES (?, ?)`\n    _, err := r.db.Exec(query, post.Title, post.Body)\n    return err\n}\n```\n\n> Remember to handle errors gracefully and use transactions when necessary.', 
 'published', NULL, 'programming', 
 '["go", "database", "patterns", "advanced"]', 
 NULL, 
 'Deep dive into advanced database patterns for Go applications', 
 'advanced-database-patterns-go', 
 FALSE, TRUE, FALSE, 
 '2024-01-20 14:30:00', '2024-01-20 14:30:00'),

(UUID_TO_BIN('23456789-abcd-ef01-2345-6789abcdef01'), 
 'Building REST APIs with Gin Framework', 
 '# REST API Development with Gin\n\nGin is a **high-performance HTTP web framework** written in Go.\n\n## Why Choose Gin?\n\n- ⚡ **Fast**: 40x faster than Martini\n- 🛡️ **Middleware support**: Built-in and custom middleware\n- 📝 **JSON validation**: Automatic JSON binding and validation\n- 🎯 **Error management**: Convenient error collection\n\n## Basic Setup\n\n```go\npackage main\n\nimport (\n    "github.com/gin-gonic/gin"\n    "net/http"\n)\n\nfunc main() {\n    r := gin.Default()\n    \n    r.GET("/ping", func(c *gin.Context) {\n        c.JSON(http.StatusOK, gin.H{\n            "message": "pong",\n        })\n    })\n    \n    r.Run(":8080")\n}\n```\n\n### Route Parameters\n\n```go\nr.GET("/users/:id", func(c *gin.Context) {\n    id := c.Param("id")\n    c.JSON(200, gin.H{"user_id": id})\n})\n```\n\n### Query Parameters\n\n```go\nr.GET("/users", func(c *gin.Context) {\n    name := c.DefaultQuery("name", "Guest")\n    c.String(200, "Hello %s", name)\n})\n```\n\nStart building amazing APIs! 🚀', 
 'published', NULL, 'programming', 
 '["go", "gin", "rest", "api", "web"]', 
 'https://example.com/images/gin-framework.jpg', 
 'Complete guide to building REST APIs with the Gin framework in Go', 
 'building-rest-apis-gin-framework', 
 TRUE, TRUE, FALSE, 
 '2024-01-25 11:15:00', '2024-01-25 11:15:00'),

-- Draft posts
(UUID_TO_BIN('34567890-bcde-f012-3456-789abcdef012'), 
 'Microservices Architecture with Go', 
 '# Microservices with Go\n\nThis is a **work-in-progress** article about building microservices architecture.\n\n## Planned Topics\n\n- [ ] Service discovery\n- [ ] API gateways  \n- [ ] Database per service\n- [ ] Event-driven communication\n- [ ] Monitoring and logging\n\n```go\n// TODO: Add service implementation\ntype UserService struct {\n    // Implementation pending\n}\n```\n\n> This article is still being written. Check back soon for updates!', 
 'draft', NULL, 'architecture', 
 '["microservices", "go", "architecture", "draft"]', 
 NULL, 
 'Comprehensive guide to building microservices with Go (Draft)', 
 'microservices-architecture-go', 
 FALSE, FALSE, FALSE, 
 '2024-01-28 16:45:00', NULL),

-- Scheduled post
(UUID_TO_BIN('45678901-cdef-0123-4567-89abcdef0123'), 
 'Go 1.22 New Features Overview', 
 '# Go 1.22 Release Highlights\n\nExciting **new features** coming in Go 1.22!\n\n## Key Improvements\n\n### 1. Enhanced Generics\n\nBetter type inference and improved performance:\n\n```go\nfunc Map[T, U any](slice []T, fn func(T) U) []U {\n    result := make([]U, len(slice))\n    for i, v := range slice {\n        result[i] = fn(v)\n    }\n    return result\n}\n```\n\n### 2. Improved Error Handling\n\n```go\nif err := someOperation(); err != nil {\n    return fmt.Errorf("operation failed: %w", err)\n}\n```\n\n### 3. Performance Enhancements\n\n- **20% faster** compilation\n- **15% smaller** binary sizes\n- Improved garbage collector\n\n## Migration Guide\n\nMost code should work without changes, but check:\n\n1. Deprecated functions\n2. Breaking changes in experimental packages\n3. New linting rules\n\nStay tuned for the official release! 📅', 
 'scheduled', '2024-02-15 10:00:00', 'news', 
 '["go", "release", "features", "update"]', 
 'https://example.com/images/go-1-22.jpg', 
 'Overview of new features and improvements in Go 1.22 release', 
 'go-1-22-new-features-overview', 
 TRUE, TRUE, FALSE, 
 '2024-01-30 13:20:00', NULL),

-- Emergency post
(UUID_TO_BIN('56789012-def0-1234-5678-9abcdef01234'), 
 'Critical Security Update Required', 
 '# 🚨 Security Alert\n\n**URGENT**: Critical security vulnerability discovered in Go standard library.\n\n## Affected Versions\n\n- Go 1.20.x\n- Go 1.21.0 - 1.21.5\n\n## Immediate Actions Required\n\n1. **Update immediately** to Go 1.21.6+\n2. Rebuild and redeploy all applications\n3. Review logs for suspicious activity\n\n```bash\n# Check your Go version\ngo version\n\n# Update Go\ngo install golang.org/dl/go1.21.6@latest\ngo1.21.6 download\n```\n\n## Impact\n\nThis vulnerability affects:\n\n- ⚠️ **HTTP handlers**: Potential for request smuggling\n- ⚠️ **TLS connections**: Certificate validation bypass\n- ⚠️ **File operations**: Path traversal attacks\n\n## Mitigation\n\nIf immediate update is not possible:\n\n1. Add additional input validation\n2. Use reverse proxy with security filters\n3. Monitor for unusual activity\n\n**Do not delay this update!** 🔐', 
 'published', NULL, 'security', 
 '["security", "urgent", "vulnerability", "update"]', 
 NULL, 
 'Critical security vulnerability in Go - immediate update required', 
 'critical-security-update-required', 
 TRUE, TRUE, TRUE, 
 '2024-02-01 08:00:00', '2024-02-01 08:00:00');