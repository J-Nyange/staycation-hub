CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-pending-bookings',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://aermicluavoxxxhkajah.supabase.co/functions/v1/expire-pending-bookings',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlcm1pY2x1YXZveHh4aGthamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTE1MTIsImV4cCI6MjA3OTM3MTUxMn0.UFVXpEPhSaM13tXOMTLf5z1bM0cWvrR5O8rIkWAe8CQ"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);