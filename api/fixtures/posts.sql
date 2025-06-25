-- Test data for integration tests
DELETE FROM posts;

INSERT INTO posts (id, title, body, status, scheduled_at, category, tags, featured_image_url, meta_description, slug, sns_auto_post, external_notification, emergency_flag, created_at, published_at) VALUES 
(UUID_TO_BIN('01234567-89ab-cdef-0123-456789abcdef'), 'Test Post Title', 'This is a test post body content for integration testing. It has enough content to pass the 100 character minimum requirement for validation.', 'published', NULL, 'general', '["test", "integration"]', NULL, 'Test post for integration testing', 'test-post-title', FALSE, FALSE, FALSE, '2024-01-01 10:00:00', '2024-01-01 10:00:00');