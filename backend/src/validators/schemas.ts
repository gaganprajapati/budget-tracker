import { z } from 'zod';

export const MonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const AuthSignupSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const AuthLoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name cannot be empty').max(100, 'Name is too long'),
  color: z.string().optional().default('#4F46E5'),
});

export const UpsertPlanSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  month: z.string().regex(MonthRegex, 'Month must be in YYYY-MM format'),
  target_amount: z.number().min(0, 'Target amount must be a positive number'),
});

export const CreateActualSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  month: z.string().regex(MonthRegex, 'Month must be in YYYY-MM format'),
  amount: z.number().min(0, 'Amount must be a positive number'),
  note: z.string().optional().nullable(),
});

export const LockPeriodSchema = z.object({
  month: z.string().regex(MonthRegex, 'Month must be in YYYY-MM format'),
});

export const LockQuarterSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  quarter: z.number().int().min(1).max(4),
});

export const CsvRowSchema = z.object({
  month: z.string().regex(MonthRegex, 'Month must be in YYYY-MM format (e.g. 2026-01)'),
  category: z.string().trim().min(1, 'Category name is required'),
  amount: z.coerce.number().min(0, 'Amount must be a non-negative number'),
  note: z.string().optional(),
});
