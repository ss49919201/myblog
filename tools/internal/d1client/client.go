package d1client

import (
	"context"
	"fmt"

	"github.com/cloudflare/cloudflare-go/v3"
	"github.com/cloudflare/cloudflare-go/v3/d1"
	"github.com/cloudflare/cloudflare-go/v3/option"
)

const UpsertSQL = `INSERT INTO posts (slug, title, published_at, body_html) VALUES (?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET title = excluded.title, published_at = excluded.published_at, body_html = excluded.body_html`

type PostRow struct {
	Slug        string
	Title       string
	PublishedAt string
	BodyHTML    string
}

type Client struct {
	api        *cloudflare.Client
	accountID  string
	databaseID string
}

func New(apiToken, accountID, databaseID string, opts ...option.RequestOption) *Client {
	all := append([]option.RequestOption{option.WithAPIToken(apiToken)}, opts...)
	return &Client{
		api:        cloudflare.NewClient(all...),
		accountID:  accountID,
		databaseID: databaseID,
	}
}

func UpsertParams(row PostRow) []string {
	return []string{row.Slug, row.Title, row.PublishedAt, row.BodyHTML}
}

func (c *Client) UpsertPost(ctx context.Context, row PostRow) error {
	results, err := c.api.D1.Database.Query(ctx, c.databaseID, d1.DatabaseQueryParams{
		AccountID: cloudflare.F(c.accountID),
		Sql:       cloudflare.F(UpsertSQL),
		Params:    cloudflare.F(UpsertParams(row)),
	})
	if err != nil {
		return err
	}
	if results == nil || len(*results) == 0 {
		return fmt.Errorf("d1 query returned no result")
	}
	if !(*results)[0].Success {
		return fmt.Errorf("d1 query failed")
	}
	return nil
}
