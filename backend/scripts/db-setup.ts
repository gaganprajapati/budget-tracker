import fs from 'fs';
import path from 'path';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function runDatabaseSetup(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error(`❌ [ERROR] Missing DATABASE_URL environment variable in backend/.env.`);
    console.error(`   Example IPv4 Pooler URL: postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres\n`);
    process.exit(1);
  }

  console.log(`🔌 Connection Target: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }, // Required for Supabase cloud PostgreSQL
  });

  try {
    console.log(`🔌 Connecting to Supabase PostgreSQL database...`);
    await client.connect();
    console.log(`✅ Connected successfully!`);

    // Run Schema Migration Script (01_schema.sql)
    const migrationPath = path.resolve(process.cwd(), '../supabase/migrations/01_schema.sql');
    if (fs.existsSync(migrationPath)) {
      console.log(`\n🚀 Executing Database Schema Migration (01_schema.sql)...`);
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      await client.query(migrationSql);
      console.log(`✅ Migration executed successfully! Tables, indexes, and RLS policies created.`);
    } else {
      console.warn(`⚠️ Warning: Migration file not found at ${migrationPath}`);
    }

    console.log(`\n🎉 Database schema migration completed 100%!`);
  } catch (err: unknown) {
    const errorObj = err as any;
    console.error(`\n❌ [ERROR] Database setup failed:`, errorObj?.message || err);

    if (errorObj?.code === 'ENOTFOUND') {
      console.error(`\n💡 [SUPABASE TROUBLESHOOTING TIP]:`);
      console.error(`   The direct host 'db.[ref].supabase.co' uses IPv6, which is not supported on all networks.`);
      console.error(`   Please use Supabase's IPv4 Connection Pooler URL instead from your Supabase Dashboard.`);
    }

    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {
      // Ignore disconnect errors
    }
  }
}

runDatabaseSetup();
