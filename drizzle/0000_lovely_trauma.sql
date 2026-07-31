CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`client` text NOT NULL,
	`payload` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`maturity` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
