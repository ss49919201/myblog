package post

type PublicationStatus string

const (
	StatusDraft     PublicationStatus = "draft"
	StatusScheduled PublicationStatus = "scheduled"
	StatusPublished PublicationStatus = "published"
)

func (s PublicationStatus) String() string {
	return string(s)
}