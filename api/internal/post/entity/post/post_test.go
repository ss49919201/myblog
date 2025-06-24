package post

import (
	"testing"
	"time"
)

// TestConstruct_WithBasicFields_ReturnsPostWithDefaults tests basic Construct functionality
func TestConstruct_WithBasicFields_ReturnsPostWithDefaults(t *testing.T) {
	title := "Test Post Title"
	body := "This is a test post body with enough content to pass the 100 character minimum requirement for validation."

	post, err := Construct(
		title,
		body,
		"draft",     // status
		nil,         // scheduledAt
		"",          // category
		[]string{},  // tags
		nil,         // featuredImageURL
		nil,         // metaDescription
		nil,         // slug
		false,       // snsAutoPost
		false,       // externalNotification
		false,       // emergencyFlag
	)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if post.Title != title {
		t.Errorf("Expected title %q, got %q", title, post.Title)
	}

	if post.Body != body {
		t.Errorf("Expected body %q, got %q", body, post.Body)
	}

	// Verify default values
	if post.Status != "draft" {
		t.Errorf("Expected default status 'draft', got %q", post.Status)
	}

	if post.Category != "" {
		t.Errorf("Expected default category to be empty, got %q", post.Category)
	}

	if len(post.Tags) != 0 {
		t.Errorf("Expected default tags to be empty, got %v", post.Tags)
	}

	if post.SNSAutoPost != false {
		t.Errorf("Expected default SNSAutoPost to be false, got %v", post.SNSAutoPost)
	}

	if post.ExternalNotification != false {
		t.Errorf("Expected default ExternalNotification to be false, got %v", post.ExternalNotification)
	}

	if post.EmergencyFlag != false {
		t.Errorf("Expected default EmergencyFlag to be false, got %v", post.EmergencyFlag)
	}

	// Verify events
	if len(post.Events) != 1 {
		t.Errorf("Expected 1 event, got %d", len(post.Events))
	}

	if post.Events[0].Type != PostEventTypeCreatePost {
		t.Errorf("Expected CreatePost event, got %v", post.Events[0].Type)
	}
}

// TestConstruct_WithAllFields_ReturnsPostWithSpecifiedValues tests Construct with all parameters
func TestConstruct_WithAllFields_ReturnsPostWithSpecifiedValues(t *testing.T) {
	title := "Enhanced Test Post"
	body := "This is an enhanced test post body with enough content to pass the validation requirements for testing purposes."
	
	scheduledTime := time.Now().Add(2 * time.Hour)
	featuredURL := "https://example.com/image.jpg"
	metaDesc := "Test meta description"
	slug := "enhanced-test-post"
	tags := []string{"test", "go", "enhanced"}

	post, err := Construct(
		title,
		body,
		"scheduled",
		&scheduledTime,
		"技術",
		tags,
		&featuredURL,
		&metaDesc,
		&slug,
		true,  // SNSAutoPost
		true,  // ExternalNotification
		true,  // EmergencyFlag
	)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify all fields
	if post.Title != title {
		t.Errorf("Expected title %q, got %q", title, post.Title)
	}

	if post.Body != body {
		t.Errorf("Expected body %q, got %q", body, post.Body)
	}

	if post.Status != "scheduled" {
		t.Errorf("Expected status 'scheduled', got %q", post.Status)
	}

	if post.Category != "技術" {
		t.Errorf("Expected category '技術', got %q", post.Category)
	}

	if len(post.Tags) != len(tags) {
		t.Errorf("Expected %d tags, got %d", len(tags), len(post.Tags))
	}

	if post.SNSAutoPost != true {
		t.Errorf("Expected SNSAutoPost to be true, got %v", post.SNSAutoPost)
	}

	if post.ExternalNotification != true {
		t.Errorf("Expected ExternalNotification to be true, got %v", post.ExternalNotification)
	}

	if post.EmergencyFlag != true {
		t.Errorf("Expected EmergencyFlag to be true, got %v", post.EmergencyFlag)
	}

	// Verify PublishedAt is set to ScheduledAt for scheduled posts
	if post.PublishedAt == nil {
		t.Error("Expected PublishedAt to be set for scheduled posts")
	} else if !post.PublishedAt.Equal(scheduledTime) {
		t.Errorf("Expected PublishedAt to equal ScheduledAt %v, got %v", scheduledTime, *post.PublishedAt)
	}
}

// TestConstruct_WithDifferentDefaults_SetsCorrectly tests different default combinations
func TestConstruct_WithDifferentDefaults_SetsCorrectly(t *testing.T) {
	title := "Test Post"
	body := "This is a test post body with enough content to pass the 100 character minimum requirement for validation."

	post, err := Construct(
		title,
		body,
		"published", // status - different from draft
		nil,         // scheduledAt
		"general",   // category - not empty
		[]string{"test", "example"}, // tags - not empty
		nil,         // featuredImageURL
		nil,         // metaDescription
		nil,         // slug
		true,        // snsAutoPost - true
		false,       // externalNotification
		false,       // emergencyFlag
	)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if post.Status != "published" {
		t.Errorf("Expected status 'published', got %q", post.Status)
	}

	if post.Category != "general" {
		t.Errorf("Expected category 'general', got %q", post.Category)
	}

	if len(post.Tags) != 2 {
		t.Errorf("Expected 2 tags, got %d", len(post.Tags))
	}

	if post.SNSAutoPost != true {
		t.Errorf("Expected SNSAutoPost to be true, got %v", post.SNSAutoPost)
	}
}

// TestConstruct_PublishedStatus_SetsPublishedAtToNow tests published post behavior
func TestConstruct_PublishedStatus_SetsPublishedAtToNow(t *testing.T) {
	title := "Published Post"
	body := "This is a published post body with enough content to pass the validation requirements for testing purposes."

	before := time.Now()
	post, err := Construct(
		title,
		body,
		"published", // status
		nil,         // scheduledAt
		"",          // category
		[]string{},  // tags
		nil,         // featuredImageURL
		nil,         // metaDescription
		nil,         // slug
		false,       // snsAutoPost
		false,       // externalNotification
		false,       // emergencyFlag
	)
	after := time.Now()

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if post.Status != "published" {
		t.Errorf("Expected status 'published', got %q", post.Status)
	}

	if post.PublishedAt == nil {
		t.Error("Expected PublishedAt to be set for published posts")
	} else {
		// PublishedAt should be between before and after
		if post.PublishedAt.Before(before) || post.PublishedAt.After(after) {
			t.Errorf("Expected PublishedAt to be between %v and %v, got %v", before, after, *post.PublishedAt)
		}
	}
}

// TestConstruct_InvalidTitle_ReturnsValidationError tests validation error handling
func TestConstruct_InvalidTitle_ReturnsValidationError(t *testing.T) {
	invalidTitle := "" // Empty title should fail validation
	body := "This is a test post body with enough content to pass the 100 character minimum requirement for validation."

	_, err := Construct(
		invalidTitle,
		body,
		"draft",     // status
		nil,         // scheduledAt
		"",          // category
		[]string{},  // tags
		nil,         // featuredImageURL
		nil,         // metaDescription
		nil,         // slug
		false,       // snsAutoPost
		false,       // externalNotification
		false,       // emergencyFlag
	)

	if err == nil {
		t.Fatal("Expected validation error, got nil")
	}

	expected := "title must be between 1 and 100 characters"
	if err.Error() != expected {
		t.Errorf("Expected error %q, got %q", expected, err.Error())
	}
}

// TestConstruct_InvalidBody_ReturnsValidationError tests body validation
func TestConstruct_InvalidBody_ReturnsValidationError(t *testing.T) {
	title := "Valid Title"
	invalidBody := "" // Empty body should fail validation

	_, err := Construct(
		title,
		invalidBody,
		"draft",     // status
		nil,         // scheduledAt
		"",          // category
		[]string{},  // tags
		nil,         // featuredImageURL
		nil,         // metaDescription
		nil,         // slug
		false,       // snsAutoPost
		false,       // externalNotification
		false,       // emergencyFlag
	)

	if err == nil {
		t.Fatal("Expected validation error, got nil")
	}

	expected := "body must be between 1 and 5000 characters"
	if err.Error() != expected {
		t.Errorf("Expected error %q, got %q", expected, err.Error())
	}
}

// TestConstruct_WithPartialParameters_WorksAsExpected ensures flexibility
func TestConstruct_WithPartialParameters_WorksAsExpected(t *testing.T) {
	title := "Enhanced Post"
	body := "This is an enhanced post body with enough content to pass the validation requirements for testing purposes."
	
	post, err := Construct(
		title,
		body,
		"draft",         // status
		nil,             // scheduledAt
		"general",       // category
		[]string{"test"}, // tags
		nil,             // featuredImageURL
		nil,             // metaDescription
		nil,             // slug
		false,           // snsAutoPost
		false,           // externalNotification
		false,           // emergencyFlag
	)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if post.Title != title {
		t.Errorf("Expected title %q, got %q", title, post.Title)
	}

	if post.Body != body {
		t.Errorf("Expected body %q, got %q", body, post.Body)
	}

	if post.Category != "general" {
		t.Errorf("Expected category 'general', got %q", post.Category)
	}
}