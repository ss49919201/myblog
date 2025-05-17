package post

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type PostID string

func ParsePostID(id string) (PostID, error) {
	return PostID(id), nil
}

func NewPostID() PostID {
	return PostID(uuid.New().String())
}

type Post struct {
	ID          PostID
	Title       string
	Body        string
	CreatedAt   time.Time
	PublishedAt time.Time
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
) (*Post, error) {
	if err := ValidateForConstruct(title, body); err != nil {
		return nil, err
	}

	return &Post{
		ID:          id,
		Title:       title,
		Body:        body,
		CreatedAt:   createdAt,
		PublishedAt: time.Now(),
	}, nil
}
