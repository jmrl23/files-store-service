CREATE TABLE "File" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"path" text DEFAULT '' NOT NULL,
	"mimetype" text NOT NULL,
	"size" integer NOT NULL,
	"store" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "File_key_key" ON "File" USING btree ("key" text_ops);