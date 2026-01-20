import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (results: ImportResults) => void;
}

export interface ImportResults {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{
    company: string;
    role: string;
    error: string;
  }>;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    const isValidFile = droppedFile && (
      droppedFile.name.endsWith('.csv') || 
      droppedFile.name.endsWith('.xlsx') ||
      droppedFile.name.endsWith('.xls')
    );
    
    if (isValidFile) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a CSV or Excel (.xlsx) file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      let csvText: string;
      
      // Check if file is Excel
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Convert Excel to CSV
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        csvText = XLSX.utils.sheet_to_csv(firstSheet);
      } else {
        // Read CSV file as text
        csvText = await file.text();
      }
      
      // Send to backend
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.PROD ? 'https://api.jobfetch.app' : 'http://localhost:3001'}/api/applications/import/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ csvData: csvText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import CSV');
      }

      const results = await response.json();
      onImport(results);
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="material-symbols-outlined text-blue-500 text-2xl">upload_file</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Spreadsheet</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Upload CSV or Excel (.xlsx) file</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-5xl">check_circle</span>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-slate-500">Click to choose a different file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-5xl">cloud_upload</span>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">
                    Drop your CSV or Excel file here
                  </p>
                  <p className="text-sm text-slate-500">Supports .csv, .xlsx, .xls files</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </p>
              </div>
            )}

            {/* Supported Formats */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ✅ Supported column names:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• <strong>Company:</strong> Company, Company Name, Organization, Employer</li>
                <li>• <strong>Position:</strong> Position, Role, Job Title, Title, Job</li>
                <li>• <strong>Status:</strong> Status, Application Status, Stage, State</li>
                <li>• <strong>Date:</strong> Date Applied, Date, Applied Date, Submitted</li>
                <li>• <strong>Location:</strong> Location, Job Location, City, Place</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                The parser will automatically detect these columns (case-insensitive)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleImport}
              disabled={!file || isUploading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">upload</span>
                  Import Applications
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CSVImportModal;
