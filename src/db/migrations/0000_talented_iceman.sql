CREATE TABLE `admissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`admitted_by` integer NOT NULL,
	`reason` text NOT NULL,
	`department` text NOT NULL,
	`bed` text,
	`status` text DEFAULT 'activa' NOT NULL,
	`admission_date` integer NOT NULL,
	`discharge_date` integer,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clinical_histories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`admission_id` integer NOT NULL,
	`doctor_id` integer NOT NULL,
	`diagnosis` text NOT NULL,
	`symptoms` text NOT NULL,
	`treatment` text NOT NULL,
	`notes` text,
	`vital_signs` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admission_id`) REFERENCES `admissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`document_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`birth_date` text NOT NULL,
	`gender` text NOT NULL,
	`phone` text,
	`address` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_document_id_unique` ON `patients` (`document_id`);--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admission_id` integer NOT NULL,
	`patient_id` integer NOT NULL,
	`from_department` text NOT NULL,
	`to_department` text NOT NULL,
	`reason` text NOT NULL,
	`transferred_by` integer NOT NULL,
	`transfer_date` integer NOT NULL,
	FOREIGN KEY (`admission_id`) REFERENCES `admissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transferred_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);