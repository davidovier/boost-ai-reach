-- Create index on user_events for analytics performance
CREATE INDEX IF NOT EXISTS idx_user_events_analytics 
ON user_events (event_name, occurred_at DESC);

-- Additional index for user-based analytics queries
CREATE INDEX IF NOT EXISTS idx_user_events_user_date 
ON user_events (user_id, occurred_at DESC);