import React from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-basic-dist-min';
import { Application } from '../types';
import { transformToPlotlyData } from '../utils/funnelDataTransform';

export interface SankeyDiagramProps {
  applications: Application[];
  width?: number;
  height?: number;
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  applications
}) => {
  try {
    const plotlyData = transformToPlotlyData(applications);
    
    console.log('SankeyDiagram rendering with:', {
      applicationCount: applications.length,
      plotlyData
    });

    const config = {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
      responsive: true,
      toImageButtonOptions: {
        format: 'png' as const,
        filename: `job-funnel-${new Date().toISOString().split('T')[0]}`,
        height: 1080,
        width: 1920,
        scale: 2
      }
    };

    const layout: Partial<Plotly.Layout> = {
      font: { size: 14 },
      margin: { l: 40, r: 40, t: 40, b: 40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      height: 500,
      autosize: true
    };

    return (
      <div style={{ width: '100%', height: '500px' }}>
        <Plot
          data={[plotlyData as any]}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
          plotly={Plotly}
        />
      </div>
    );
  } catch (error) {
    console.error('Error rendering SankeyDiagram:', error);
    throw error;
  }
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onClose?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

export class SankeyDiagramErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Funnel visualization error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-600 font-semibold mb-2">
            Failed to load visualization
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{this.state.error}</p>
          {this.props.onClose && (
            <button
              onClick={this.props.onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg"
            >
              Close
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
