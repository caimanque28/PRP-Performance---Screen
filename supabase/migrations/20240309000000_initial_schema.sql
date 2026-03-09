CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'evaluator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_birth_date DATE,
  patient_age INTEGER,
  patient_weight NUMERIC,
  patient_height NUMERIC,
  patient_bmi NUMERIC,
  patient_bmi_status TEXT,
  patient_sport TEXT,
  patient_level TEXT,
  patient_volume TEXT,
  patient_dominance TEXT,
  patient_complaint TEXT,
  patient_history TEXT,
  patient_meds TEXT,
  eva_score INTEGER,
  
  eval_type TEXT NOT NULL CHECK (eval_type IN ('FMS', 'PRP')),
  scores JSONB NOT NULL,
  observations JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users." ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Evaluations policies
CREATE POLICY "Evaluations are viewable by authenticated users." ON evaluations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Evaluators can insert evaluations." ON evaluations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own evaluations." ON evaluations
  FOR UPDATE USING (evaluator_id = auth.uid());

CREATE POLICY "Users can delete their own evaluations." ON evaluations
  FOR DELETE USING (evaluator_id = auth.uid());
