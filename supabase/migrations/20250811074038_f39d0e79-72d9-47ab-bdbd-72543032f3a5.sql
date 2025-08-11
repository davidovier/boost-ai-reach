-- Enable required extensions
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Schedule monthly report generation on the 1st at 03:00 UTC
select cron.schedule(
  'generate-monthly-reports',
  '0 3 1 * *',
  $$
  select
    net.http_post(
      url := 'https://xngfyktcvkxbsvrkmpjc.supabase.co/functions/v1/reports',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZ2Z5a3Rjdmt4YnN2cmttcGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODUzMTMsImV4cCI6MjA2OTk2MTMxM30.EKuWcTzHVKZJbZVhaXW0LEGAuzD_1XT0rVLH6qgLsqg","x-cron":"1"}'::jsonb,
      body := '{"action":"cron"}'::jsonb
    ) as request_id;
  $$
);