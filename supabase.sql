-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  kid_mode BOOLEAN DEFAULT true,
  streak_days INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_captures INTEGER DEFAULT 0,
  unique_species_count INTEGER DEFAULT 0,
  experience_points INTEGER DEFAULT 0
);

-- Create captures table
CREATE TABLE IF NOT EXISTS captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  canonical_name TEXT NOT NULL,
  common_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('flower', 'bug', 'animal')),
  confidence DECIMAL(3,2) NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('plantid', 'gcv')),
  thumb_url TEXT,
  location_hint TEXT,
  gbif_key INTEGER,
  summary TEXT,
  fun_facts TEXT[],
  color_chips TEXT[],
  coins_earned INTEGER DEFAULT 0,
  is_new_species BOOLEAN DEFAULT false
);

-- Create active learning queue table
CREATE TABLE IF NOT EXISTS active_learning_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  thumb_url TEXT NOT NULL,
  provider_suggestion TEXT CHECK (provider_suggestion IN ('gcv', 'plantid', 'local')),
  vision_labels JSONB,
  local_model JSONB,
  hint TEXT CHECK (hint IN ('auto', 'flower', 'bug', 'animal')),
  location_hint TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'skipped')),
  final_label_id TEXT,
  notes TEXT
);

-- Create model registry table
CREATE TABLE IF NOT EXISTS model_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tflite_url TEXT NOT NULL,
  labels_sha256 TEXT NOT NULL,
  tau DECIMAL(3,2) DEFAULT 0.62,
  margin DECIMAL(3,2) DEFAULT 0.08,
  metrics JSONB
);

-- Insert default model registry entry
INSERT INTO model_registry (version, tflite_url, labels_sha256, metrics) 
VALUES (
  'v001', 
  '/models/local_model_v001.tflite',
  'placeholder-sha256-hash',
  '{"top1": 0.85, "top3": 0.92, "ece": 0.08}'
) ON CONFLICT (version) DO NOTHING;

-- Create badges table for gamification
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subtype TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  count INTEGER DEFAULT 0,
  next_goal INTEGER NOT NULL,
  UNIQUE(user_id, category, subtype)
);

-- Create achievements table for coin rewards
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  coins_rewarded INTEGER DEFAULT 0,
  icon TEXT,
  UNIQUE(user_id, type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_captures_user_id ON captures(user_id);
CREATE INDEX IF NOT EXISTS idx_captures_category ON captures(category);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_al_queue_status ON active_learning_queue(status);
CREATE INDEX IF NOT EXISTS idx_al_queue_user_id ON active_learning_queue(user_id);
