import { parse } from 'csv-parse/sync';
import { CsvRowSchema } from '../validators/schemas.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { actualRepository } from '../repositories/actualRepository.js';
import { lockRepository } from '../repositories/lockRepository.js';
import { Actual } from '../types/index.js';

export interface CsvValidationRowResult {
  rowNumber: number;
  month: string;
  categoryName: string;
  amount: number;
  note?: string;
  isValid: boolean;
  errors: string[];
}

export interface CsvParseSummary {
  totalRows: number;
  validRows: CsvValidationRowResult[];
  invalidRows: CsvValidationRowResult[];
}

export class CsvImportService {
  public parseAndValidateCsv(csvContent: string): CsvParseSummary {
    const rawRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    const validRows: CsvValidationRowResult[] = [];
    const invalidRows: CsvValidationRowResult[] = [];

    rawRecords.forEach((record, index) => {
      const rowNumber = index + 2;
      const errors: string[] = [];

      const normalizedRecord: Record<string, string> = {};
      Object.keys(record).forEach((key) => {
        normalizedRecord[key.toLowerCase().trim()] = record[key];
      });

      const month = normalizedRecord['month'] || '';
      const category = normalizedRecord['category'] || '';
      const amountRaw = normalizedRecord['amount'] || '';
      const note = normalizedRecord['note'] || '';

      const parseResult = CsvRowSchema.safeParse({
        month,
        category,
        amount: amountRaw,
        note,
      });

      if (!parseResult.success) {
        parseResult.error.errors.forEach((err) => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });

        invalidRows.push({
          rowNumber,
          month,
          categoryName: category,
          amount: isNaN(Number(amountRaw)) ? 0 : Number(amountRaw),
          note,
          isValid: false,
          errors,
        });
      } else {
        validRows.push({
          rowNumber,
          month: parseResult.data.month,
          categoryName: parseResult.data.category,
          amount: parseResult.data.amount,
          note: parseResult.data.note,
          isValid: true,
          errors: [],
        });
      }
    });

    return {
      totalRows: rawRecords.length,
      validRows,
      invalidRows,
    };
  }

  public async commitCsvImport(userId: string, validRows: CsvValidationRowResult[]): Promise<Actual[]> {
    if (validRows.length === 0) {
      return [];
    }

    const locks = await lockRepository.getUserLocks(userId);
    const lockedMonthsSet = new Set<string>(locks.map((l) => l.month));

    for (const row of validRows) {
      if (lockedMonthsSet.has(row.month)) {
        throw new Error(`Import rejected: Month ${row.month} in row ${row.rowNumber} is locked.`);
      }
    }

    const categoryMap = new Map<string, string>();
    const existingCategories = await categoryRepository.getCategoriesByUser(userId);

    existingCategories.forEach((c) => {
      categoryMap.set(c.name.toLowerCase(), c.id);
    });

    const entriesToInsert: Array<{
      user_id: string;
      category_id: string;
      month: string;
      amount: number;
      note?: string;
    }> = [];

    for (const row of validRows) {
      const lowerName = row.categoryName.toLowerCase();
      let categoryId = categoryMap.get(lowerName);

      if (!categoryId) {
        const newCat = await categoryRepository.createCategory(userId, row.categoryName);
        categoryId = newCat.id;
        categoryMap.set(lowerName, categoryId);
      }

      entriesToInsert.push({
        user_id: userId,
        category_id: categoryId,
        month: row.month,
        amount: row.amount,
        note: row.note || 'CSV Import',
      });
    }

    return await actualRepository.bulkInsertActuals(entriesToInsert);
  }
}

export const csvImportService = new CsvImportService();
