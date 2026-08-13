import fs from 'fs';
import path from 'path';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

function getEmailFromArgs(): string | null {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--email=')) {
      return arg.split('=')[1].trim();
    }
    if (arg === '--email' && args[i + 1]) {
      return args[i + 1].trim();
    }
    if (arg.includes('@') && !arg.startsWith('-')) {
      return arg.trim();
    }
  }
  return null;
}

async function runDatabaseSeed(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error(`❌ [ERROR] Missing DATABASE_URL environment variable in backend/.env.`);
    console.error(`   Example IPv4 Pooler URL: postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres\n`);
    process.exit(1);
  }

  const targetEmail = getEmailFromArgs();
  console.log(`🔌 Connection Target: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(`🔌 Connecting to Supabase PostgreSQL database...`);
    await client.connect();
    console.log(`✅ Connected successfully!`);

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (targetEmail) {
      console.log(`🔍 Looking up user account by email: "${targetEmail}"...`);
      const userRes = await client.query(`SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [targetEmail]);

      if (userRes.rows.length === 0) {
        console.error(`\n❌ [ERROR] No registered user found with email "${targetEmail}".`);
        console.error(`   Please sign up first at http://localhost:3000/signup or via POST /api/auth/signup before running the seed script.\n`);
        process.exit(1);
      }

      userId = userRes.rows[0].id;
      userEmail = userRes.rows[0].email;
      console.log(`✅ User found! ID: ${userId} (${userEmail})`);
    } else {
      console.log(`ℹ️ No --email argument provided. Looking up the first registered user in auth.users...`);
      const userRes = await client.query(`SELECT id, email FROM auth.users ORDER BY created_at ASC LIMIT 1`);

      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
        userEmail = userRes.rows[0].email;
        console.log(`✅ Selected first registered user: ${userEmail} (ID: ${userId})`);
        console.log(`💡 Tip: You can target a specific account by passing --email=<email> (e.g. npm run db:seed --email=john@example.com)`);
      } else {
        console.log(`⚠️ No users found in auth.users. Creating default seed demo user...`);
        const createRes = await client.query(`
          INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud)
          VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'demo@example.com',
            '$2a$10$abcdefghijklmnopqrstuvwxyz012345',
            NOW(),
            'authenticated',
            'authenticated'
          )
          RETURNING id, email;
        `);
        userId = createRes.rows[0].id;
        userEmail = createRes.rows[0].email;
        console.log(`✅ Created demo user: ${userEmail} (ID: ${userId})`);
      }
    }

    console.log(`\n🌱 Seeding sample categories, spending targets (plans), and actuals for user: ${userEmail}...`);

    // Execute SQL Seeding using explicit userId parameter
    const seedQuery = `
      DO $$
      DECLARE
        target_uid UUID := '${userId}';
        cat_marketing_id UUID;
        cat_payroll_id UUID;
        cat_tools_id UUID;
      BEGIN
        -- 1. Insert Categories
        INSERT INTO public.categories (id, user_id, name, color)
        VALUES 
          (gen_random_uuid(), target_uid, 'Marketing', '#6366F1'),
          (gen_random_uuid(), target_uid, 'Payroll', '#10B981'),
          (gen_random_uuid(), target_uid, 'Tools', '#F59E0B')
        ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color;

        SELECT id INTO cat_marketing_id FROM public.categories WHERE user_id = target_uid AND name = 'Marketing';
        SELECT id INTO cat_payroll_id FROM public.categories WHERE user_id = target_uid AND name = 'Payroll';
        SELECT id INTO cat_tools_id FROM public.categories WHERE user_id = target_uid AND name = 'Tools';

        -- 2. Insert Plans (Spending Targets)
        INSERT INTO public.plans (user_id, category_id, month, target_amount)
        VALUES
          (target_uid, cat_marketing_id, '2026-01', 5000.00),
          (target_uid, cat_payroll_id, '2026-01', 20000.00),
          (target_uid, cat_marketing_id, '2026-02', 5000.00),
          (target_uid, cat_payroll_id, '2026-02', 20000.00)
        ON CONFLICT (user_id, category_id, month) DO UPDATE SET target_amount = EXCLUDED.target_amount;

        -- 3. Insert Actual Spend Entries
        INSERT INTO public.actuals (user_id, category_id, month, amount, note)
        VALUES
          (target_uid, cat_marketing_id, '2026-01', 4800.00, 'Q1 Marketing Campaign Initial Spend'),
          (target_uid, cat_payroll_id, '2026-01', 20500.00, 'January Monthly Salaries + Contractor Bonus'),
          (target_uid, cat_payroll_id, '2026-02', 19800.00, 'February Monthly Salaries');

      END $$;
    `;

    await client.query(seedQuery);
    console.log(`✅ Seed data successfully populated for account "${userEmail}"!`);
    console.log(`🎉 Database seeding completed 100%!`);
  } catch (err: unknown) {
    const errorObj = err as any;
    console.error(`\n❌ [ERROR] Database seed failed:`, errorObj?.message || err);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {
      // Ignore disconnect errors
    }
  }
}

runDatabaseSeed();
