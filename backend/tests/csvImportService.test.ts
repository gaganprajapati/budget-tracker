import { describe, it, expect, vi } from 'vitest';
import { CsvImportService } from '../src/services/csvImportService.js';
import { lockRepository } from '../src/repositories/lockRepository.js';

vi.mock('../src/repositories/lockRepository.js', () => ({
  lockRepository: {
    getUserLocks: vi.fn(),
  },
}));

describe('CsvImportService Unit Tests & Date Normalization Edge Cases', () => {
  const csvImportService = new CsvImportService();

  it('should parse valid CSV rows and normalize full date/datetime strings to YYYY-MM', () => {
    const csvContent = `month,category,amount,note
2026-01,Marketing,4800,January Marketing
2026-01-15,Payroll,20500,Mid-month payroll
2026-02-20T10:30:00Z,Tools,150,Software subscription
2026/03/10,Logistics,320,Shipping costs`;

    const summary = csvImportService.parseAndValidateCsv(csvContent);

    expect(summary.totalRows).toBe(4);
    expect(summary.invalidRows).toHaveLength(0);
    expect(summary.validRows).toHaveLength(4);

    expect(summary.validRows[0].month).toBe('2026-01');
    expect(summary.validRows[1].month).toBe('2026-01');
    expect(summary.validRows[2].month).toBe('2026-02');
    expect(summary.validRows[3].month).toBe('2026-03');
  });

  it('should catch invalid rows with bad dates, missing categories, or negative amounts', () => {
    const invalidCsv = `month,category,amount
not-a-date,Marketing,1000
2026-01,,500
2026-02,Payroll,-200`;

    const summary = csvImportService.parseAndValidateCsv(invalidCsv);

    expect(summary.totalRows).toBe(3);
    expect(summary.invalidRows).toHaveLength(3);
    expect(summary.validRows).toHaveLength(0);
  });

  it('should reject committing CSV rows that belong to a locked period', async () => {
    vi.mocked(lockRepository.getUserLocks).mockResolvedValueOnce([
      {
        id: 'lock-1', user_id: 'user-1', month: '2026-02', locked_at: '2026-02-01',
        locked_by: null
      },
    ]);

    const validRows = [
      { rowNumber: 2, month: '2026-01', categoryName: 'Marketing', amount: 1000, isValid: true, errors: [] },
      { rowNumber: 3, month: '2026-02', categoryName: 'Payroll', amount: 2000, isValid: true, errors: [] },
    ];

    await expect(csvImportService.commitCsvImport('user-1', validRows)).rejects.toThrow(
      'Import rejected: Month 2026-02 in row 3 is locked.'
    );
  });
});
