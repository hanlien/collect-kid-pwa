-- Training Feedback Table
CREATE TABLE IF NOT EXISTS training_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  original_prediction JSONB,
  is_correct BOOLEAN NOT NULL,
  correction TEXT,
  confidence FLOAT,
  category TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  training_status TEXT DEFAULT 'pending'
);

-- Active Learning Queue Table
CREATE TABLE IF NOT EXISTS active_learning_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  thumb_url TEXT,
  provider_suggestion JSONB,
  vision_labels TEXT[],
  local_model JSONB,
  hint TEXT,
  location_hint JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  review_decision TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_feedback_created_at ON training_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_training_feedback_category ON training_feedback(category);
CREATE INDEX IF NOT EXISTS idx_training_feedback_provider ON training_feedback(provider);
CREATE INDEX IF NOT EXISTS idx_training_feedback_is_correct ON training_feedback(is_correct);

CREATE INDEX IF NOT EXISTS idx_active_learning_queue_status ON active_learning_queue(status);
CREATE INDEX IF NOT EXISTS idx_active_learning_queue_created_at ON active_learning_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_active_learning_queue_user_id ON active_learning_queue(user_id);

-- Enable Row Level Security (RLS) for training_feedback
ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on training_feedback" ON training_feedback
  FOR ALL USING (true);

-- Enable RLS for active_learning_queue
ALTER TABLE active_learning_queue ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
CREATE POLICY "Allow all operations on active_learning_queue" ON active_learning_queue
  FOR ALL USING (true);
