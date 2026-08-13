# Coding Standards & Architecture Rules (Clean Code & SOLID Principles)

This rule file defines mandatory architectural patterns, coding guidelines, and quality standards for this repository. Every agent and developer must strictly adhere to these practices when modifying or adding code.

---

## 1. Core Principles & SOLID Compliance

### S - Single Responsibility Principle (SRP)
- **Backend**: Divide logic strictly across layers:
  - **Controllers/Handlers**: Parse requests, validate input format, invoke use cases/services, format HTTP responses. No direct DB calls or domain logic.
  - **Services / Use-Cases**: Pure business logic (e.g., variance calculations, lock verification). No HTTP/Express `req`/`res` objects.
  - **Repositories / Data Access**: Encapsulate all database queries (Supabase client calls). Services call repositories via interfaces/abstractions.
  - **Validators**: Schema definitions (e.g., Zod) for request payloads and imports.
- **Frontend**: Separate UI rendering from business logic & state:
  - **Presentational Components**: Focus purely on rendering UI given props.
  - **Container / Custom Hooks**: Encapsulate data fetching, state management, and side effects (`usePlans`, `useActuals`, `useReport`).
  - **API Services**: Pure utility functions for network requests (Axios / Fetch wrapper).

### O - Open/Closed Principle (OCP)
- Systems should be open for extension, closed for modification.
- Use strategy or provider patterns for customizable logic (e.g., export formatting: CSV vs JSON export providers, locking strategies, date grouping utilities).

### L - Liskov Substitution Principle (LSP)
- Derived types/classes or implementation modules must be substitutable for their interfaces/contracts without altering correctness.
- Maintain consistent interface signatures for Repository methods and Service methods.

### I - Interface Segregation Principle (ISP)
- Avoid fat interfaces or monolithic helper classes.
- Break down utility modules and services into small, cohesive contracts (e.g., `ILockValidator`, `IVarianceCalculator`, `ICsvParser`).

### D - Dependency Inversion Principle (DIP)
- High-level modules (Services) must not depend directly on low-level implementation details (specific DB client or HTTP framework details).
- Inject dependencies (e.g. passing repository instances or DB client abstractions into services/controllers).

---

## 2. Type Safety & ESM Module Rules (TypeScript Standards)

Every JavaScript/TypeScript module must strictly follow these rules:
1. **No `any` or Raw `unknown` Casts**: NEVER use `any` or unchecked type assertions (`as unknown as T`). Define explicit interfaces or Zod schemas to infer types safely.
2. **Type Predicates & Narrowing**: Use type predicates (`error is CustomError`) or `instanceof` checks for runtime type narrowing in try/catch blocks and guard statements.
3. **Explicit Return Types**: Explicitly declare return types on all class methods, exported functions, and API handlers (e.g., `export function calculateVariance(...): VarianceResult`).
4. **Strict `NodeNext` ESM Imports**: Always include the `.js` file extension on relative local module imports (e.g., `import { config } from '../config/env.config.js'`) to adhere to strict NodeNext / ES Modules resolution rules in TypeScript.
5. **Strict Null Checks**: Always handle optional or nullable fields (`null` / `undefined`) explicitly.

---

## 3. Technology Stack & Best Libraries

### Backend Stack
- **Runtime & Framework**: Node.js with Express.js written in **TypeScript** (`tsx`, `tsc`).
- **Validation**: `zod` for request payload validation and CSV import data parsing.
- **Database Client**: `@supabase/supabase-js` (PostgreSQL with Supabase RLS and SQL migrations).
- **CSV Parsing**: `csv-parse` or `papaparse` for fast, streaming CSV validation and parsing.
- **Testing**: `vitest` for unit & integration testing (testing variance math, locking enforcement, CSV validation).
- **Security & Middleware**: `cors`, `helmet`, `dotenv`, standard Express error middleware.

### Frontend Stack
- **Framework & Build**: React.js with Vite (`create-vite` with **TypeScript** template).
- **Styling**: Vanilla CSS / Modern CSS Variables + CSS Modules, incorporating dark/light themes, glassmorphism, responsive grids, and micro-animations.
- **State & Data Fetching**: TanStack Query (`@tanstack/react-query`) for cached async server state management, automated refetching, and optimistic updates.
- **Charts**: Recharts (`recharts`) for responsive financial variance & target visualizations.
- **Icons**: `lucide-react` for clean modern iconography.
- **Routing**: `react-router-dom` v6 for seamless view navigation.


---

## 3. Clean Code Rules & Formatting

1. **Explicit Function & Parameter Typing**: Use clear JSDoc or TypeScript annotations for all services, controllers, and data contracts.
2. **Predictable Error Handling**:
   - Centralized Express error handler middleware.
   - Standardized API error responses: `{ "success": false, "error": { "code": "PERIOD_LOCKED", "message": "Cannot modify locked period 2026-01." } }`.
   - Never swallow errors silently or return generic 500 status for domain validation errors (use 400 for bad input, 403/422 for locked periods, 401 for unauthorized).
3. **No Magic Values**:
   - Define status constants and configuration defaults in dedicated `constants.js`/`types.js` files.
4. **Immutability & Pure Functions**:
   - Financial calculation logic (Variance calculation, % Variance, aggregation) MUST be pure functions with 100% unit test coverage.
5. **DRY (Don't Repeat Yourself)**:
   - Extract common validation rules (YYYY-MM regex, category name formatting) into shared utility functions.

---

## 4. Specific Business Rules for Plan vs Actual Tracker

1. **Locking Rules**:
   - Monthly or Quarterly lock support (stored in `period_locks` table).
   - Server-side enforcement in backend service layer before executing target edits or actual entries edits/imports.
   - API must reject edits to locked periods with a clear error payload.
2. **Variance Calculation Formula**:
   - `Variance = Actual - Plan` (Negative = under plan, Positive = over plan).
   - `Variance % = ((Actual - Plan) / Plan) * 100` when `Plan > 0`.
   - Edge cases:
     - `Plan = 0`: Display `—` or `N/A` (never `NaN` or `Infinity`).
     - `Missing Actual`: Treat as `0` spend (Variance = `-Plan`, Variance % = `-100%`) or show `—` consistently (selectable setting / consistent handling).
3. **Data Isolation**:
   - Multi-tenant security strictly enforced via Supabase Auth `user_id` on all queries and RLS policies.
