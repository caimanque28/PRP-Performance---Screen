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
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users." ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users." ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (true); -- Allow insert, we'll rely on the trigger or app logic for security

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'evaluator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Evaluations policies
DROP POLICY IF EXISTS "Evaluations are viewable by authenticated users." ON evaluations;
CREATE POLICY "Evaluations are viewable by authenticated users." ON evaluations
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Evaluators can insert evaluations." ON evaluations;
CREATE POLICY "Evaluators can insert evaluations." ON evaluations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own evaluations." ON evaluations;
CREATE POLICY "Users can update their own evaluations." ON evaluations
  FOR UPDATE USING (evaluator_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own evaluations." ON evaluations;
CREATE POLICY "Users can delete their own evaluations." ON evaluations
  FOR DELETE USING (evaluator_id = auth.uid());
