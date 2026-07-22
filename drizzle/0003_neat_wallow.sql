CREATE TABLE "network_risk_checks" (
	"client_key" varchar(64) PRIMARY KEY NOT NULL,
	"anonymous_network" boolean NOT NULL,
	"risk_type" varchar(24) NOT NULL,
	"fraud_score" integer,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "network_risk_checks_expires_idx" ON "network_risk_checks" USING btree ("expires_at");