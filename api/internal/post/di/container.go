package di

import (
	"database/sql"
	"fmt"
	"sync"

	_ "github.com/go-sql-driver/mysql"
	"github.com/ss49919201/myblog/api/internal/post/event"
	"github.com/ss49919201/myblog/api/internal/post/rdb"
	"github.com/ss49919201/myblog/api/internal/post/repository"
	"github.com/ss49919201/myblog/api/internal/post/usecase"
)

var containerOnceValue = sync.OnceValue(func() *Container {
	return &Container{}
})

type Container struct {
	dbOnce                 func() (*sql.DB, error)
	postRepoOnce           func() (repository.PostRepository, error)
	eventDispatcherOnce    func() (event.EventDispatcher, error)
	createPostUsecaseOnce  func() (*usecase.CreatePostUsecase, error)
	updatePostUsecaseOnce  func() (*usecase.UpdatePostUsecase, error)
	deletePostUsecaseOnce  func() (*usecase.DeletePostUsecase, error)
	analyzePostUsecaseOnce func() (*usecase.AnalyzePostUsecase, error)
}

func NewContainer() *Container {
	container := containerOnceValue()
	container.initOnceValues()
	return container
}

func (c *Container) initOnceValues() {
	c.dbOnce = sync.OnceValues(func() (*sql.DB, error) {
		dsn := "user:password@tcp(localhost:3306)/rdb?parseTime=true"
		db, err := sql.Open("mysql", dsn)
		if err != nil {
			return nil, fmt.Errorf("failed to open database: %w", err)
		}

		if err := db.Ping(); err != nil {
			return nil, fmt.Errorf("failed to ping database: %w", err)
		}

		return db, nil
	})

	c.postRepoOnce = sync.OnceValues(func() (repository.PostRepository, error) {
		db, err := c.DB()
		if err != nil {
			return nil, err
		}
		return rdb.NewPostRepository(db), nil
	})

	c.eventDispatcherOnce = sync.OnceValues(func() (event.EventDispatcher, error) {
		return event.NewNoopEventDispatcher(), nil
	})

	c.createPostUsecaseOnce = sync.OnceValues(func() (*usecase.CreatePostUsecase, error) {
		repo, err := c.PostRepository()
		if err != nil {
			return nil, err
		}
		dispatcher, err := c.EventDispatcher()
		if err != nil {
			return nil, err
		}
		return usecase.NewCreatePostUsecase(repo, dispatcher), nil
	})

	c.updatePostUsecaseOnce = sync.OnceValues(func() (*usecase.UpdatePostUsecase, error) {
		repo, err := c.PostRepository()
		if err != nil {
			return nil, err
		}
		dispatcher, err := c.EventDispatcher()
		if err != nil {
			return nil, err
		}
		return usecase.NewUpdatePostUsecase(repo, dispatcher), nil
	})

	c.deletePostUsecaseOnce = sync.OnceValues(func() (*usecase.DeletePostUsecase, error) {
		repo, err := c.PostRepository()
		if err != nil {
			return nil, err
		}
		return usecase.NewDeletePostUsecase(repo), nil
	})

	c.analyzePostUsecaseOnce = sync.OnceValues(func() (*usecase.AnalyzePostUsecase, error) {
		return usecase.NewAnalyzePostUsecase(), nil
	})
}

func (c *Container) DB() (*sql.DB, error) {
	return c.dbOnce()
}

func (c *Container) PostRepository() (repository.PostRepository, error) {
	return c.postRepoOnce()
}

func (c *Container) EventDispatcher() (event.EventDispatcher, error) {
	return c.eventDispatcherOnce()
}

func (c *Container) CreatePostUsecase() (*usecase.CreatePostUsecase, error) {
	return c.createPostUsecaseOnce()
}

func (c *Container) UpdatePostUsecase() (*usecase.UpdatePostUsecase, error) {
	return c.updatePostUsecaseOnce()
}

func (c *Container) DeletePostUsecase() (*usecase.DeletePostUsecase, error) {
	return c.deletePostUsecaseOnce()
}

func (c *Container) AnalyzePostUsecase() (*usecase.AnalyzePostUsecase, error) {
	return c.analyzePostUsecaseOnce()
}
