import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Application } from '../types';
import { SankeyDiagram, SankeyDiagramErrorBoundary } from './SankeyDiagram';
import { SummaryStats } from './SummaryStats';
import { ExportControls } from './ExportControls';
import { exportToPNG, exportToSVG, exportToCSV } from '../utils/funnelExport';

export interface FunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
}

export const FunnelModal: React.FC<FunnelModalProps> = ({
  isOpen,
  onClose,
  applications
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const plotlyDivId = 'funnel-plotly-chart';

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleExportPNG = async () => {
    await exportToPNG(plotlyDivId);
  };

  const handleExportSVG = async () => {
    await exportToSVG(plotlyDivId);
  };

  const handleExportCSV = () => {
    exportToCSV(applications);
  };

  if (!isOpen) return null;

  if (applications.length === 0) {
    return createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Job Application Funnel
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 text-2xl"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div className="text-center text-slate-600 dark:text-slate-400 py-12">
            <p className="text-lg">No applications to visualize</p>
            <p className="text-sm mt-2">Add some applications to see your funnel</p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'auto'
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl my-auto flex flex-col"
        style={{ maxHeight: 'calc(100vh - 32px)', zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Always visible and clickable */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Job Application Funnel
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full w-10 h-10 flex items-center justify-center text-3xl leading-none transition-colors"
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Sankey Diagram */}
          <div id={plotlyDivId} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <SankeyDiagramErrorBoundary onClose={onClose}>
              <SankeyDiagram applications={applications} />
            </SankeyDiagramErrorBoundary>
          </div>

          {/* Summary Statistics */}
          <SummaryStats applications={applications} />

          {/* Export Controls */}
          <ExportControls
            onExportPNG={handleExportPNG}
            onExportSVG={handleExportSVG}
            onExportCSV={handleExportCSV}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
