package post

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/ss49919201/myblog/api/internal/post/entity/event"
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

type PostEventType int

const (
	PostEventTypeCreatePost PostEventType = iota + 1
	PostEventTypeUpdatePost
)

type PostEvent struct {
	ID   event.ID
	Type PostEventType
}

type Post struct {
	ID                   PostID     `json:"id"`
	Title                string     `json:"title"`
	Body                 string     `json:"body"`
	Status               string     `json:"status"`
	ScheduledAt          *time.Time `json:"scheduledAt"`
	Category             string     `json:"category"`
	Tags                 []string   `json:"tags"`
	FeaturedImageURL     *string    `json:"featuredImageURL"`
	MetaDescription      *string    `json:"metaDescription"`
	Slug                 *string    `json:"slug"`
	SNSAutoPost          bool       `json:"snsAutoPost"`
	ExternalNotification bool       `json:"externalNotification"`
	EmergencyFlag        bool       `json:"emergencyFlag"`
	CreatedAt            time.Time  `json:"createdAt"`
	PublishedAt          *time.Time `json:"publishedAt"`

	Events []PostEvent
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

	p.Events = append(p.Events, PostEvent{
		ID:   event.GenerateID(),
		Type: PostEventTypeUpdatePost,
	})

	return nil
}

func ValidateTitle(title string) error {
	validTitle := len(title) > 1 && len(title) <= 100
	if !validTitle {
		return errors.New("title must be between 1 and 100 characters")
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

// Construct creates a new Post with all parameters explicitly specified
func Construct(
	title,
	body,
	status string,
	scheduledAt *time.Time,
	category string,
	tags []string,
	featuredImageURL *string,
	metaDescription *string,
	slug *string,
	snsAutoPost,
	externalNotification,
	emergencyFlag bool,
) (*Post, error) {
	if err := ValidateForConstruct(title, body); err != nil {
		return nil, err
	}

	now := time.Now()
	post := &Post{
		ID:                   NewPostID(),
		Title:                title,
		Body:                 body,
		Status:               status,
		ScheduledAt:          scheduledAt,
		Category:             category,
		Tags:                 tags,
		FeaturedImageURL:     featuredImageURL,
		MetaDescription:      metaDescription,
		Slug:                 slug,
		SNSAutoPost:          snsAutoPost,
		ExternalNotification: externalNotification,
		EmergencyFlag:        emergencyFlag,
		CreatedAt:            now,
		Events:               []PostEvent{},
	}

	// Set PublishedAt based on status
	if status == "published" {
		post.PublishedAt = &now
	} else if status == "scheduled" && scheduledAt != nil {
		post.PublishedAt = scheduledAt
	}

	post.Events = append(post.Events, PostEvent{
		ID:   event.GenerateID(),
		Type: PostEventTypeCreatePost,
	})

	return post, nil
}

func Reconstruct(
	id PostID,
	title string,
	body string,
	status string,
	scheduledAt *time.Time,
	category string,
	tags []string,
	featuredImageURL *string,
	metaDescription *string,
	slug *string,
	snsAutoPost bool,
	externalNotification bool,
	emergencyFlag bool,
	createdAt time.Time,
	publishedAt *time.Time,
) (*Post, error) {
	if err := ValidateForConstruct(title, body); err != nil {
		return nil, err
	}

	return &Post{
		ID:                   id,
		Title:                title,
		Body:                 body,
		Status:               status,
		ScheduledAt:          scheduledAt,
		Category:             category,
		Tags:                 tags,
		FeaturedImageURL:     featuredImageURL,
		MetaDescription:      metaDescription,
		Slug:                 slug,
		SNSAutoPost:          snsAutoPost,
		ExternalNotification: externalNotification,
		EmergencyFlag:        emergencyFlag,
		CreatedAt:            createdAt,
		PublishedAt:          publishedAt,
	}, nil
}

func (p *Post) ToJSON() string {
	b, err := json.Marshal(p)
	if err != nil {
		return ""
	}

	return string(b)
}
