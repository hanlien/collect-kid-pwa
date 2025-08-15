-- Create logs table for debug dashboard
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
  recognition_id TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_api ON logs(api);
CREATE INDEX IF NOT EXISTS idx_logs_recognition_id ON logs(recognition_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- Create a function to clean old logs (keep last 1000 logs)
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs 
  WHERE id NOT IN (
    SELECT id FROM logs 
    ORDER BY timestamp DESC 
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean old logs
CREATE OR REPLACE FUNCTION trigger_clean_old_logs()
RETURNS trigger AS $$
BEGIN
  -- Clean old logs if we have more than 1000
  IF (SELECT COUNT(*) FROM logs) > 1000 THEN
    PERFORM clean_old_logs();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS clean_logs_trigger ON logs;
CREATE TRIGGER clean_logs_trigger
  AFTER INSERT ON logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_clean_old_logs();

-- Grant permissions (adjust as needed for your Supabase setup)
GRANT ALL ON logs TO authenticated;
GRANT ALL ON logs TO anon;
GRANT USAGE ON SEQUENCE logs_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE logs_id_seq TO anon;
