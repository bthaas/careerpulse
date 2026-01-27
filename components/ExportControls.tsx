import React, { useState } from 'react';

export interface ExportControlsProps {
  onExportPNG: () => Promise<void>;
  onExportSVG: () => Promise<void>;
  onExportCSV: () => void;
}

/**
 * ExportControls component provides buttons for exporting
 * the funnel visualization in different formats.
 */
export const ExportControls: React.FC<ExportControlsProps> = ({
  onExportPNG,
  onExportSVG,
  onExportCSV
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (
    type: 'PNG' | 'SVG' | 'CSV',
    exportFn: () => Promise<void> | void
  ) => {
    setLoading(type);
    setError(null);

    try {
      await exportFn();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      console.error(`${type} export error:`, err);
    } finally {
      setLoading(null);
    }
  };

  const buttonClass = (type: string) =>
    `px-3 py-1.5 text-sm rounded-lg font-medium transition-colors duration-200 ${
      loading === type
        ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400 cursor-wait'
        : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
    }`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => handleExport('PNG', onExportPNG)}
          disabled={loading !== null}
          className={buttonClass('PNG')}
          aria-label="Export as PNG"
        >
          {loading === 'PNG' ? 'Exporting...' : 'Export PNG'}
        </button>

        <button
          onClick={() => handleExport('SVG', onExportSVG)}
          disabled={loading !== null}
          className={buttonClass('SVG')}
          aria-label="Export as SVG"
        >
          {loading === 'SVG' ? 'Exporting...' : 'Export SVG'}
        </button>

        <button
          onClick={() => handleExport('CSV', () => Promise.resolve(onExportCSV()))}
          disabled={loading !== null}
          className={buttonClass('CSV')}
          aria-label="Export data as CSV"
        >
          {loading === 'CSV' ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {error && (
        <div className="text-center text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
