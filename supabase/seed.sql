-- Supabase Seed SQL File: Plan vs Actual Tracker Sample Data

DO $$
DECLARE
  target_user_id UUID;
  cat_marketing_id UUID;
  cat_payroll_id UUID;
  cat_tools_id UUID;
BEGIN
  -- 1. Find an existing user from auth.users or create a demo seed user
  SELECT id INTO target_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF target_user_id IS NULL THEN
    target_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud)
    VALUES (
      target_user_id,
      '00000000-0000-0000-0000-000000000000',
      'demo@example.com',
      '$2a$10$abcdefghijklmnopqrstuvwxyz012345',
      NOW(),
      'authenticated',
      'authenticated'
    );
  END IF;

  -- 2. Insert Categories
  INSERT INTO public.categories (id, user_id, name, color)
  VALUES 
    (gen_random_uuid(), target_user_id, 'Marketing', '#6366F1'),
    (gen_random_uuid(), target_user_id, 'Payroll', '#10B981'),
    (gen_random_uuid(), target_user_id, 'Tools', '#F59E0B')
  ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color;

  SELECT id INTO cat_marketing_id FROM public.categories WHERE user_id = target_user_id AND name = 'Marketing';
  SELECT id INTO cat_payroll_id FROM public.categories WHERE user_id = target_user_id AND name = 'Payroll';
  SELECT id INTO cat_tools_id FROM public.categories WHERE user_id = target_user_id AND name = 'Tools';

  -- 3. Insert Spending Target Plans
  -- 2026-01: Marketing = $5,000, Payroll = $20,000
  -- 2026-02: Marketing = $5,000, Payroll = $20,000
  INSERT INTO public.plans (user_id, category_id, month, target_amount)
  VALUES
    (target_user_id, cat_marketing_id, '2026-01', 5000.00),
    (target_user_id, cat_payroll_id, '2026-01', 20000.00),
    (target_user_id, cat_marketing_id, '2026-02', 5000.00),
    (target_user_id, cat_payroll_id, '2026-02', 20000.00)
  ON CONFLICT (user_id, category_id, month) DO UPDATE SET target_amount = EXCLUDED.target_amount;

  -- 4. Insert Actual Spend Entries
  -- 2026-01: Marketing = $4,800, Payroll = $20,500
  -- 2026-02: Marketing is intentionally omitted (missing actual test case), Payroll = $19,800
  INSERT INTO public.actuals (user_id, category_id, month, amount, note)
  VALUES
    (target_user_id, cat_marketing_id, '2026-01', 4800.00, 'Q1 Marketing Campaign Initial Spend'),
    (target_user_id, cat_payroll_id, '2026-01', 20500.00, 'January Monthly Salaries + Contractor Bonus'),
    (target_user_id, cat_payroll_id, '2026-02', 19800.00, 'February Monthly Salaries');

END $$;
