export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // Format: YYYY-MM
  target_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Actual {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // Format: YYYY-MM
  amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PeriodLock {
  id: string;
  user_id: string;
  month: string; // Format: YYYY-MM
  locked_at: string;
  locked_by: string | null;
}

export interface ReportRow {
  category_id: string;
  category_name: string;
  category_color: string;
  month: string;
  plan_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number | null;
  is_missing_actual: boolean;
  is_locked: boolean;
}

export interface ReportSummary {
  rows: ReportRow[];
  totals: {
    total_plan: number;
    total_actual: number;
    total_variance: number;
    total_variance_percentage: number | null;
  };
}

export interface UserSession {
  id: string;
  email: string;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
