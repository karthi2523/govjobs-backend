-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  post_name TEXT NOT NULL,
  vacancies TEXT NOT NULL,
  qualification TEXT NOT NULL,
  last_date DATE NOT NULL,
  full_details_url TEXT,
  notification_url TEXT,
  apply_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default categories (safe, idempotent)
INSERT INTO public.categories (name, slug) VALUES
  ('Admit Cards', 'admit-cards'),
  ('Results', 'results'),
  ('Syllabus', 'syllabus'),
  ('Previous Papers', 'previous-papers'),
  ('Materials', 'materials'),
  ('10th Jobs', '10th-jobs'),
  ('12th Jobs', '12th-jobs'),
  ('ITI Jobs', 'iti-jobs'),
  ('Diploma Jobs', 'diploma-jobs'),
  ('Degree Jobs', 'degree-jobs'),
  ('Engineering Jobs', 'engineering-jobs'),
  ('Railways', 'railways'),
  ('Bank Jobs', 'bank-jobs'),
  ('Defence Jobs', 'defence-jobs'),
  ('Teaching Jobs', 'teaching-jobs')
ON CONFLICT DO NOTHING;
