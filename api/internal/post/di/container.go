package di

import (
	"database/sql"
	"fmt"
	"sync"

	_ "github.com/go-sql-driver/mysql"
)

var containerOnceValue = sync.OnceValue(func() *Container {
	return &Container{}
})

type Container struct {
	db *sql.DB
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
