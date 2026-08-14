# Plan vs Actual Tracker (Full-Stack Application)

A full-stack web application built with **Node.js + Express (TypeScript)**, **React.js + Vite (TypeScript)**, **Supabase (PostgreSQL)**, and configured for **Vercel** serverless deployment.

This application allows users to set monthly spending targets per category, log actual expenditures, import batch CSV spending data, view date-filtered report comparisons with variance calculations and visual analytics, and enforce server-side period locking.

---

## 🚀 Live Demo & Deployment
- **Deployed Application URL**: `https://budget-tracker-ui-theta.vercel.app` *(or your Vercel deployment link)*
- **Repository Structure**: Monorepo with `/backend` (Express API) and `/frontend` (React Vite Web App).

![Plan vs Actual Tracker Report Preview](assets/reports_screenshot.png)


---

## 🛠️ Prerequisites & Step-by-Step Local Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Supabase Account**: A free Supabase PostgreSQL database project.

---

### Step 1: Backend Setup & Environment Configuration (`/backend`)

```bash
cd backend

# 1. Install backend dependencies
npm install

# 2. Copy environment variables template
cp .env.example .env

# 3. Open .env and configure your Supabase credentials & Database URL:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# SUPABASE_SECRET_KEY=your-secret-key
# FRONTEND_URL=https://budget-tracker-ui-theta.vercel.app

# DATABASE_URL: Use Supabase IPv4 Pooler URL if db.[ref].supabase.co gives DNS ENOTFOUND error!
# Example (IPv4 Pooler): postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

### Step 2: Database Setup & Seeding Scripts

Once `.env` is configured with your `DATABASE_URL`, execute the database scripts:

```bash
# 1. Run database schema migration (executes 01_schema.sql)
npm run db:setup

# 2. Register your user account via the Web App at http://localhost:3000/signup

# 3. Run database data seeding for your account email:
npm run db:seed -- --email=user@example.com
```

#### What Each Script Does:
- **`npm run db:setup` ([`01_schema.sql`](budget-tracker/supabase/migrations/01_schema.sql))**: Creates `categories`, `plans`, `actuals`, `period_locks` tables, RLS security policies, and performance indexes.
- **`npm run db:seed -- --email=<user-email>` ([`seed.sql`](budget-tracker/supabase/seed.sql))**: Looks up `user_id` from `auth.users` by email and populates sample categories (`Marketing`, `Payroll`, `Tools`), spending targets (Plans), and logged actual expenditures for that specific user account. *(If `--email` is omitted, it seeds data for the first registered user in the database).*

*(Alternatively, you can copy/paste [`01_schema.sql`](budget-tracker/supabase/migrations/01_schema.sql) directly into your Supabase SQL Editor).*



#### Start Backend Server & Run Tests:
```bash
# Start backend Express server (http://localhost:5001)
npm run dev

# Run automated Vitest unit tests
npm test
```

---

### Step 3: Frontend Setup (`/frontend`)

```bash
cd ../frontend

# 1. Install frontend dependencies
npm install

# 2. Copy environment variables template
cp .env.example .env

# 3. Open .env and configure:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# VITE_API_BASE_URL=http://localhost:5001/api

# 4. Start Vite development server (http://localhost:3000)
npm run dev
```


---

## 📐 Business Logic & Technical Rules

### 1. Variance & Variance % Calculations
- **Variance Formula**: `Variance = Actual - Plan` (Negative = under budget, Positive = over budget).
- **Variance % Formula**: `Variance % = ((Actual - Plan) / Plan) * 100` when `Plan > 0`.
- **Zero Target Handling (`Plan = $0`)**:
  - When target plan is `$0` and actual spend exists, percentage variance cannot be mathematically evaluated (`NaN` / `Infinity`).
  - The application returns `variance_percentage = null` and renders `—` with an informative tooltip explanation: *"Target plan is zero; percentage variance cannot be calculated"*.

### 2. Missing Actual Spend Handling
- If a spending target (Plan) exists for a category in a given month, but no actual expenditure entry has been logged:
  - Missing actual spend is evaluated as `$0` (Variance = `-Plan`, Variance % = `-100%`).
  - The UI displays a clear badge tag indicating `$0 evaluated (no entry logged)`.

### 3. Locking Behavior & Granularity
- **Granularity**: Month-level locking (`YYYY-MM`) with bulk quarter locking support (e.g. locking Q1 2026 locks `2026-01`, `2026-02`, and `2026-03`).
- **Server-Side Enforcement**: Period locking is strictly enforced at the API layer via Express `lockGuard` middleware. Any attempt to POST, PUT, or DELETE plans/actuals in a locked period is rejected with **HTTP 423 Locked** and a structured JSON error response.
- **Unlocking Support**: Users can unlock any previously locked period via the Period Locking Management interface (`DELETE /api/locks/month/:month`), which restores edit capabilities for target plans and actual spend entries in that month.


---

## ⚡ Scale & Performance Query Strategy

Even though the current dataset is small, the database schema is optimized for large-scale time-series financial aggregation:
1. **Composite Indexes**:
   - `idx_plans_user_month` on `plans(user_id, month)`: Accelerates date-range reporting aggregations (`WHERE user_id = $1 AND month >= $2 AND month <= $3`).
   - `idx_actuals_user_month` on `actuals(user_id, month)`: Enables fast lookup of logged spend entries during reporting queries.
   - `idx_period_locks_user_month` on `period_locks(user_id, month)`: Rapidly evaluates lock status in middleware before write operations.
2. **Row-Level Security (RLS)**:
   - Built-in PostgreSQL RLS policies (`auth.uid() = user_id`) enforce strict multi-tenant isolation at the database engine level.
3. **Stateless Serverless Auto-Scaling**:
   - The Express backend is completely stateless and deployed on Vercel Serverless Functions, automatically scaling execution instances up or down based on traffic spikes without server memory bottlenecks.
4. **Database Connection Pooling & Partitioning at Scale**:
   - **Connection Pooling**: Ephemeral serverless connections are managed via Supabase PgBouncer IPv4 Connection Pooler (`port 6543`), preventing database connection exhaustion.
   - **Table Partitioning**: As financial data grows into millions of rows, `plans` and `actuals` tables can be PostgreSQL range-partitioned by `month` (`YYYY-MM`) or hash-partitioned by `user_id` for instant query pruning.


---

## 🏗️ Architecture & SOLID Principles

- **Single Responsibility Principle (SRP)**: Controllers handle HTTP requests, Repositories handle database interactions, and `VarianceService` contains pure calculation rules.
- **Dependency Inversion Principle (DIP)**: Controllers and services depend on repository interfaces (`ICategoryRepository`, `IPlanRepository`, `IActualRepository`, `ILockRepository`).
- **TypeScript Type Safety**: 100% strict TypeScript with zero `any` usage, type predicates for error handling, explicit function return types, and strict `NodeNext` ESM imports.

---

## Assumptions & Tradeoffs

1. **Monthly Time-Series Granularity (`YYYY-MM`)**: Spending plans and actual expenditure logs are structured on a monthly basis (`YYYY-MM`). Daily spending receipts are aggregated into monthly category totals for variance calculation.
2. **Native PostgreSQL Row-Level Security (RLS)**: The backend uses Node.js `AsyncLocalStorage` to instantiate per-request Supabase clients passing the user's JWT Bearer token, enforcing `auth.uid() = user_id` policies directly inside PostgreSQL.
3. **CSV Batch Processing & Date Normalization**: CSV imports validate required headers (`month`, `category`, `amount`), reject rows targeting locked periods, automatically provision missing categories under the user's account, and intelligently normalize full dates/datetimes (e.g. `2026-01-15` or `2026-01-15T10:30:00Z`) into standard `YYYY-MM` month strings (`2026-01`).

4. **Instant Signup Session (Email Verification Optional)**: Email confirmation requirement on signup is disabled in Supabase Auth configuration to prevent hitting free-tier transactional email quotas (30 emails/hour limit), providing instant account registration and active session creation for frictionless testing.


---

## 🔮 What Would Be Improved Before Production

1. **Structured Logging & Sentry APM Error Monitoring**: Replace standard console logs with high-performance JSON loggers (e.g., `Pino` or `Winston`) carrying correlation IDs (`request_id`, `trace_id`), HTTP response latency metrics (p50, p95, p99 request duration timings via OpenTelemetry/Prometheus), and Sentry real-time exception tracking.
2. **API Rate Limiting & Stricter Bulk Input Protection**: Implement distributed per-user and per-IP rate limiting middleware (e.g., `express-rate-limit` with Upstash/Redis) on authentication and bulk CSV import endpoints to prevent brute-force attacks and abuse.
3. **Optimistic Concurrency Control**: Add a `version` column or `updated_at` check on `plans` and `actuals` write operations to detect conflicting edits and prevent last-write-wins data overwrites across concurrent browser tabs.
4. **Partial-Success CSV Imports & Downloadable Error Reports**: Upgrade CSV import to support partial-success execution—committing valid rows while generating a downloadable CSV report of just the rejected rows for fast correction and resubmission.
5. **Soft-Delete for Historical Reproducibility**: Implement `deleted_at` soft-deletes for categories, plans, and actuals so historical financial reports stay 100% reproducible even if a category is removed.
6. **Cursor-Based Pagination for Drill-Downs & Bulk Data**: Implement cursor-based pagination on report drill-down detail modals and CSV validation feedback lists to maintain high performance with tens of thousands of transaction entries.
7. **Distributed Redis Auth Cache**: Upgrade the short-lived in-memory token verification cache to a distributed Redis / ElastiCache layer for multi-instance serverless scaling.
8. **Asynchronous Job Queues for Heavy CSVs**: Offload massive CSV file processing (100,000+ rows) to asynchronous worker queues (e.g., BullMQ) with real-time progress status updates via WebSockets.
9. **Immutable Audit Logging & History**: Maintain immutable audit trail tables tracking period locking and unlocking events, including user IDs, IP addresses, user-agent headers, and timestamps.
10. **Expanded Integration & End-to-End (E2E) Test Suite**: Expand test coverage beyond unit tests to include Supertest API integration tests against a test PostgreSQL instance, plus Playwright/Cypress E2E tests for reporting and drill-down flows.
11. **Production Infrastructure Upgrades (Supabase Pro & Vercel Pro)**: Upgrade from free-tier infrastructure to paid production tiers (Supabase Pro/Enterprise & Vercel Pro) to eliminate automatic database pausing, unlock dedicated compute resources, remove serverless execution timeouts (10s Hobby limit), enable daily automated backups with Point-in-Time Recovery (PITR), and configure dedicated SMTP email delivery.
12. **Global CDN & Web Application Firewall (Cloudflare / AWS CloudFront)**: Place a global CDN and WAF layer (e.g., Cloudflare Enterprise) in front of application domains for worldwide edge asset caching, automated DDoS attack absorption, HTTP/3 protocol optimization, and Web Application Firewall (WAF) bot protection.
13. **Granular Transaction Timestamps for Actuals**: Upgrade `actuals` to store exact `transaction_date DATE` or `spend_timestamp TIMESTAMPTZ` for individual transaction receipts, using PostgreSQL generated columns (`to_char(transaction_date, 'YYYY-MM')`) to derive monthly report aggregations while enabling daily/weekly spending velocity analytics.
14. **Publicly Shareable Read-Only Report Links**: Allow users to generate secure, tokenized read-only public URLs (with optional expiration dates and password protection) so external stakeholders and auditors can view financial variance reports without requiring an account.
15. **Multi-Currency Support & Exchange Rate Conversion**: Allow users to log actual spending in international currencies (e.g., EUR, GBP, INR) with automatic real-time exchange rate conversion into a primary base reporting currency.
16. **Role-Based Access Control (RBAC) & Team Workspaces**: Expand from single-user accounts to multi-tenant organization team workspaces with granular permissions (`Admin`, `Finance Manager`, `Editor`, `Read-Only Viewer`).
