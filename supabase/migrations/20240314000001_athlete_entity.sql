-- Create athletes table to store persistent athlete data
CREATE TABLE IF NOT EXISTS athletes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  sport TEXT,
  level TEXT,
  dominance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(evaluator_id, name) -- Simple unique constraint per evaluator
);

-- Add athlete_id to evaluations and result columns
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS total_score INTEGER;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS percentage NUMERIC;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS risk_status TEXT;

-- Enable RLS on athletes
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Athletes policies
DROP POLICY IF EXISTS "Athletes are viewable by authenticated users." ON athletes;
CREATE POLICY "Athletes are viewable by authenticated users." ON athletes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Evaluators can insert athletes." ON athletes;
CREATE POLICY "Evaluators can insert athletes." ON athletes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own athletes." ON athletes;
CREATE POLICY "Users can update their own athletes." ON athletes
  FOR UPDATE USING (evaluator_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own athletes." ON athletes;
CREATE POLICY "Users can delete their own athletes." ON athletes
  FOR DELETE USING (evaluator_id = auth.uid());
