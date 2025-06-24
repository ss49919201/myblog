package post

type UserRole string

const (
	RoleGeneral UserRole = "general"
	RoleEditor  UserRole = "editor"
	RoleAdmin   UserRole = "admin"
)

func (r UserRole) String() string {
	return string(r)
}