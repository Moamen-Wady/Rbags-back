CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total" integer NOT NULL,
	"unit" text NOT NULL,
	"available" integer NOT NULL
);
