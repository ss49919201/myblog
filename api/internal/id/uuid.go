package id

import "github.com/google/uuid"

type UUID struct {
	value uuid.UUID
}

func (u UUID) String() string {
	return u.value.String()
}

func GenerateUUID() UUID {
	return UUID{
		value: uuid.New(),
	}
}

func ParseUUID(s string) (UUID, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return UUID{}, err
	}
	return UUID{value: parsed}, nil
}
