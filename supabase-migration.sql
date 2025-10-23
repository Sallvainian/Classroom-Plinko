-- Classroom-Plinko Database Schema
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/eerwfmjdalzxxjbaajlc/sql

-- Classes table (represents Period 1-6)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
  chips_remaining INTEGER DEFAULT 5 CHECK (chips_remaining >= 0),
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop history table (tracks individual point-earning events)
CREATE TABLE IF NOT EXISTS drop_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  slot_index INTEGER CHECK (slot_index BETWEEN 0 AND 8),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_total_points ON classes(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_drop_records_class ON drop_records(class_id);
CREATE INDEX IF NOT EXISTS idx_drop_records_timestamp ON drop_records(timestamp DESC);

-- Seed six classes (Period 1, 3, 4, 6, 7, 9)
INSERT INTO classes (name, total_points, chips_remaining) VALUES
  ('Period 1', 0, 5),
  ('Period 3', 0, 5),
  ('Period 4', 0, 5),
  ('Period 6', 0, 5),
  ('Period 7', 0, 5),
  ('Period 9', 0, 5)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS) - required for Supabase
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for now (single-teacher, client-side only app)
-- In production with multiple teachers, you'd restrict by auth.uid()
CREATE POLICY "Allow all operations on classes" ON classes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on drop_records" ON drop_records
  FOR ALL USING (true) WITH CHECK (true);
