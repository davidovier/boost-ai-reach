-- Add status enum and column to reports table
CREATE TYPE report_status AS ENUM ('queued', 'running', 'success', 'failed');

ALTER TABLE reports ADD COLUMN status report_status NOT NULL DEFAULT 'queued';
ALTER TABLE reports ADD COLUMN error_message text;
ALTER TABLE reports ADD COLUMN retry_count integer NOT NULL DEFAULT 0;
ALTER TABLE reports ADD COLUMN last_attempted_at timestamp with time zone;