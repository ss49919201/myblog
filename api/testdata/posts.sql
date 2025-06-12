-- Test data for integration tests
DELETE FROM posts;

INSERT INTO posts (id, title, body, created_at, published_at) VALUES 
(UUID_TO_BIN('01234567-89ab-cdef-0123-456789abcdef'), 'Test Post Title', 'This is a test post body content for integration testing.', '2024-01-01 10:00:00', '2024-01-01 10:00:00');