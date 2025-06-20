package post

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/ss49919201/myblog/api/internal/post/id"
)

type PostID id.UUID

func (p PostID) String() string {
	return id.UUID(p).String()
}

func (p PostID) MarshalJSON() ([]byte, error) {
	return []byte(`"` + p.String() + `"`), nil
}

func emptyPostID() PostID {
	return PostID{}
}

func ParsePostID(postId string) (PostID, error) {
	parsedId, err := id.ParseUUID(postId)
	if err != nil {
		return emptyPostID(), err
	}

	return PostID(parsedId), nil
}

func NewPostID() PostID {
	return PostID(id.GenerateUUID())
}

type Post struct {
	ID          PostID    `json:"id"`
	Title       string    `json:"title"`
	Body        string    `json:"body"`
	CreatedAt   time.Time `json:"createdAt"`
	PublishedAt time.Time `json:"publishdAt"`
}

func (p *Post) Update(title string, body string) error {
	if err := ValidateTitle(title); err != nil {
		return err
	}

	if err := ValidateBody(body); err != nil {
		return err
	}

	p.Title = title
	p.Body = body

	return nil
}

func ValidateTitle(title string) error {
	validTitle := len(title) > 1 && len(title) <= 50
	if !validTitle {
		return errors.New("title must be between 1 and 50 characters")
	}

	return nil
}

func ValidateBody(body string) error {
	validBody := len(body) > 1 && len(body) <= 5000
	if !validBody {
		return errors.New("body must be between 1 and 5000 characters")
	}

	return nil
}

func ValidateForConstruct(
	title,
	body string,
) error {
	if err := ValidateTitle(title); err != nil {
		return err
	}

	if err := ValidateBody(body); err != nil {
		return err
	}

	return nil
}

func Construct(
	title,
	body string,
) (*Post, error) {
	if err := ValidateForConstruct(title, body); err != nil {
		return nil, err
	}

	return &Post{
		ID:          NewPostID(),
		Title:       title,
		Body:        body,
		CreatedAt:   time.Now(),
		PublishedAt: time.Now(),
	}, nil
}

func Reconstruct(
	id PostID,
	title string,
	body string,
	createdAt time.Time,
	publishsedAt time.Time,
) (*Post, error) {
	if err := ValidateForConstruct(title, body); err != nil {
		return nil, err
	}

	return &Post{
		ID:          id,
		Title:       title,
		Body:        body,
		CreatedAt:   createdAt,
		PublishedAt: publishsedAt,
	}, nil
}

func (p *Post) ToJSON() string {
	b, err := json.Marshal(p)
	if err != nil {
		return ""
	}

	return string(b)
}
