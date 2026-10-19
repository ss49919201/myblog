CREATE TABLE IF NOT EXISTS `posts` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`published_at` text NOT NULL,
	`body_html` text NOT NULL,
	`body_md` text DEFAULT '' NOT NULL
);
