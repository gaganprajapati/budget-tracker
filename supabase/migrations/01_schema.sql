-- PostgreSQL Database Migration: Plan vs Actual Tracker Schema

BEGIN;

-- 1. Enable pgcrypto extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#4F46E5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_category_name UNIQUE(user_id, name)
);

-- 3. Plans (Monthly Spending Targets) Table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_category_month UNIQUE(user_id, category_id, month),
  CONSTRAINT valid_month_format CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

-- 4. Actuals (Logged Spend Entries) Table
CREATE TABLE IF NOT EXISTS public.actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_actual_month_format CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

-- 5. Period Locks Table
CREATE TABLE IF NOT EXISTS public.period_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_user_locked_month UNIQUE(user_id, month),
  CONSTRAINT valid_lock_month_format CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

-- 6. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_month ON public.plans(user_id, month);
CREATE INDEX IF NOT EXISTS idx_plans_category_id ON public.plans(category_id);
CREATE INDEX IF NOT EXISTS idx_actuals_user_month ON public.actuals(user_id, month);
CREATE INDEX IF NOT EXISTS idx_actuals_category_id ON public.actuals(category_id);
CREATE INDEX IF NOT EXISTS idx_period_locks_user_month ON public.period_locks(user_id, month);

-- 7. Supabase Row Level Security (RLS) Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_locks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running to avoid duplicate policy errors
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own plans" ON public.plans;
DROP POLICY IF EXISTS "Users can manage their own actuals" ON public.actuals;
DROP POLICY IF EXISTS "Users can manage their own period locks" ON public.period_locks;

-- Categories RLS Policies
CREATE POLICY "Users can manage their own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Plans RLS Policies
CREATE POLICY "Users can manage their own plans"
  ON public.plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Actuals RLS Policies
CREATE POLICY "Users can manage their own actuals"
  ON public.actuals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Period Locks RLS Policies
CREATE POLICY "Users can manage their own period locks"
  ON public.period_locks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
