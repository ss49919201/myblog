package di

import (
	"sync"
)

var containerOnceValue = sync.OnceValue(func() *Container {
	return &Container{}
})

type Container struct{}

func NewContainer() *Container {
	return containerOnceValue()
}
