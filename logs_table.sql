-- Create logs table for persistent logging
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level INTEGER NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  error TEXT,
  user_id TEXT,
  session_id TEXT,
  request_id TEXT,
  api TEXT,
  duration INTEGER,
  environment TEXT,
  deployment TEXT,
  recognition_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_recognition_id ON logs(recognition_id);
CREATE INDEX IF NOT EXISTS idx_logs_api ON logs(api);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- Create a policy to allow service role to insert logs
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage logs" ON logs
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read logs (for debugging)
CREATE POLICY "Authenticated users can read logs" ON logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add a function to clean old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean old logs (optional)
-- SELECT cron.schedule('clean-logs', '0 2 * * *', 'SELECT clean_old_logs();');
