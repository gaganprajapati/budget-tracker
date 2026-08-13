import { getDbClient } from '../context/requestContext.js';
import { PeriodLock } from '../types/index.js';

export interface ILockRepository {
  getUserLocks(userId: string): Promise<PeriodLock[]>;
  isMonthLocked(userId: string, month: string): Promise<boolean>;
  lockMonth(userId: string, month: string): Promise<PeriodLock>;
  unlockMonth(userId: string, month: string): Promise<void>;
  lockQuarter(userId: string, year: number, quarter: number): Promise<PeriodLock[]>;
}

export class LockRepository implements ILockRepository {
  public async getUserLocks(userId: string): Promise<PeriodLock[]> {
    const db = getDbClient();
    const { data, error } = await db
      .from('period_locks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch period locks: ${error.message}`);
    }

    return (data || []) as PeriodLock[];
  }

  public async isMonthLocked(userId: string, month: string): Promise<boolean> {
    const db = getDbClient();
    const { data, error } = await db
      .from('period_locks')
      .select('id')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check month lock status: ${error.message}`);
    }

    return data !== null;
  }

  public async lockMonth(userId: string, month: string): Promise<PeriodLock> {
    const db = getDbClient();
    const { data, error } = await db
      .from('period_locks')
      .upsert({ user_id: userId, month, locked_at: new Date().toISOString() }, { onConflict: 'user_id,month' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to lock period ${month}: ${error.message}`);
    }

    return data as PeriodLock;
  }

  public async unlockMonth(userId: string, month: string): Promise<void> {
    const db = getDbClient();
    const { error } = await db
      .from('period_locks')
      .delete()
      .eq('user_id', userId)
      .eq('month', month);

    if (error) {
      throw new Error(`Failed to unlock period ${month}: ${error.message}`);
    }
  }

  public async lockQuarter(userId: string, year: number, quarter: number): Promise<PeriodLock[]> {
    const db = getDbClient();
    const startMonthNum = (quarter - 1) * 3 + 1;
    const monthsToLock: string[] = [];

    for (let i = 0; i < 3; i++) {
      const monthInt = startMonthNum + i;
      const formattedMonth = `${year}-${monthInt < 10 ? '0' : ''}${monthInt}`;
      monthsToLock.push(formattedMonth);
    }

    const locksToUpsert = monthsToLock.map((m) => ({
      user_id: userId,
      month: m,
      locked_at: new Date().toISOString(),
    }));

    const { data, error } = await db
      .from('period_locks')
      .upsert(locksToUpsert, { onConflict: 'user_id,month' })
      .select();

    if (error) {
      throw new Error(`Failed to lock quarter Q${quarter} ${year}: ${error.message}`);
    }

    return (data || []) as PeriodLock[];
  }
}

export const lockRepository = new LockRepository();
