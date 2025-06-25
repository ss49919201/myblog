package event

import "github.com/ss49919201/myblog/api/internal/post/id"

type ID id.UUID

func GenerateID() ID {
	return ID(id.GenerateUUID())
}
