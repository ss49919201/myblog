package di

import (
	"database/sql"
	"fmt"
	"sync"

	_ "github.com/go-sql-driver/mysql"
	"github.com/ss49919201/myblog/api/internal/post/rdb"
	"github.com/ss49919201/myblog/api/internal/post/repository"
	"github.com/ss49919201/myblog/api/internal/post/usecase"
)

var containerOnceValue = sync.OnceValue(func() *Container {
	return &Container{}
})

type Container struct {
	db                 *sql.DB
	postRepo           repository.PostRepository
	createPostUsecase  *usecase.CreatePostUsecase
	updatePostUsecase  *usecase.UpdatePostUsecase
	deletePostUsecase  *usecase.DeletePostUsecase
	analyzePostUsecase *usecase.AnalyzePostUsecase
}

func NewContainer() *Container {
	return containerOnceValue()
}

func (c *Container) DB() (*sql.DB, error) {
	if c.db == nil {
		dsn := "user:password@tcp(localhost:3306)/rdb?parseTime=true"
		db, err := sql.Open("mysql", dsn)
		if err != nil {
			return nil, fmt.Errorf("failed to open database: %w", err)
		}
		
		if err := db.Ping(); err != nil {
			return nil, fmt.Errorf("failed to ping database: %w", err)
		}
		
		c.db = db
	}
	
	return c.db, nil
}

func (c *Container) PostRepository() (repository.PostRepository, error) {
	if c.postRepo == nil {
		db, err := c.DB()
		if err != nil {
			return nil, err
		}
		c.postRepo = rdb.NewPostRepository(db)
	}
	return c.postRepo, nil
}

func (c *Container) CreatePostUsecase() (*usecase.CreatePostUsecase, error) {
	if c.createPostUsecase == nil {
		repo, err := c.PostRepository()
		if err != nil {
			return nil, err
		}
		c.createPostUsecase = usecase.NewCreatePostUsecase(repo)
	}
	return c.createPostUsecase, nil
}

func (c *Container) UpdatePostUsecase() (*usecase.UpdatePostUsecase, error) {
	if c.updatePostUsecase == nil {
		repo, err := c.PostRepository()
		if err != nil {
			return nil, err
		}
		c.updatePostUsecase = usecase.NewUpdatePostUsecase(repo)
	}
	return c.updatePostUsecase, nil
}

func (c *Container) DeletePostUsecase() (*usecase.DeletePostUsecase, error) {
	if c.deletePostUsecase == nil {
		repo, err := c.PostRepository()
		if err != nil {
			return nil, err
		}
		c.deletePostUsecase = usecase.NewDeletePostUsecase(repo)
	}
	return c.deletePostUsecase, nil
}

func (c *Container) AnalyzePostUsecase() (*usecase.AnalyzePostUsecase, error) {
	if c.analyzePostUsecase == nil {
		c.analyzePostUsecase = usecase.NewAnalyzePostUsecase()
	}
	return c.analyzePostUsecase, nil
}
