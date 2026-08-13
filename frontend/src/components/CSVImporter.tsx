import React, { useState } from 'react';
import { apiClient } from '../api/apiClient';
import { Upload, AlertTriangle, CheckCircle, FileText, X } from 'lucide-react';

interface CsvValidationRowResult {
  rowNumber: number;
  month: string;
  categoryName: string;
  amount: number;
  note?: string;
  isValid: boolean;
  errors: string[];
}

interface CsvParseSummary {
  totalRows: number;
  validRows: CsvValidationRowResult[];
  invalidRows: CsvValidationRowResult[];
}

interface CSVImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CSVImporter: React.FC<CSVImporterProps> = ({ isOpen, onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [previewData, setPreviewData] = useState<CsvParseSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setCsvText(content);
      handlePreview(content);
    };
    reader.readAsText(file);
  };

  const handlePreview = async (content: string) => {
    setError(null);
    setIsProcessing(true);
    try {
      const res = await apiClient.post('/actuals/preview-csv', { csvContent: content });
      setPreviewData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to preview CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!csvText) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await apiClient.post('/actuals/import-csv', { csvContent: csvText });
      setImportResult(res.data.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'CSV Import failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText color="var(--accent-primary)" />
            Import Actual Spend CSV
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="badge badge-missing" style={{ padding: '12px', width: '100%', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {importResult && (
          <div className="badge badge-success" style={{ padding: '12px', width: '100%', borderRadius: '8px', marginBottom: '16px' }}>
            <CheckCircle size={16} /> {importResult}
          </div>
        )}

        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px' }}>
          <strong>Required CSV Format:</strong>
          <pre style={{ margin: '6px 0 0 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            month,category,amount{'\n'}
            2026-01,Marketing,4800{'\n'}
            2026-01,Payroll,20500{'\n'}
            2026-02,Payroll,19800
          </pre>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">Upload CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="form-input" style={{ padding: '8px' }} />
        </div>

        <div className="form-group">
          <label className="form-label">Or Paste CSV Text Content</label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="month,category,amount..."
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              if (e.target.value.trim()) {
                handlePreview(e.target.value);
              }
            }}
          />
        </div>

        {previewData && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <span className="badge badge-success">
                <CheckCircle size={12} /> {previewData.validRows.length} Valid Rows
              </span>
              {previewData.invalidRows.length > 0 && (
                <span className="badge badge-missing">
                  <AlertTriangle size={12} /> {previewData.invalidRows.length} Invalid Rows
                </span>
              )}
            </div>

            {previewData.invalidRows.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.85rem', color: '#f87171' }}>Validation Errors Found:</strong>
                <ul style={{ paddingLeft: '20px', margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {previewData.invalidRows.map((inv, idx) => (
                    <li key={idx}>
                      Row {inv.rowNumber}: {inv.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCommitImport}
            disabled={isProcessing || !previewData || previewData.validRows.length === 0}
          >
            <Upload size={16} />
            {isProcessing ? 'Importing...' : `Import ${previewData?.validRows.length || 0} Entries`}
          </button>
        </div>
      </div>
    </div>
  );
};
