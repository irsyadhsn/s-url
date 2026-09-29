CREATE TABLE "click_daily" (
	"url_id" uuid NOT NULL,
	"day" date NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "click_daily_url_id_day_pk" PRIMARY KEY("url_id","day")
);
--> statement-breakpoint
ALTER TABLE "click_daily" ADD CONSTRAINT "click_daily_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "click_daily_day_idx" ON "click_daily" USING btree ("day");