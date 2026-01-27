import { AppStatus } from './types';

/**
 * Standardized funnel stages for the job application pipeline
 */
export enum FunnelStage {
  APPLIED = 'Applied',
  INTERVIEW = 'Interview',
  REJECTED = 'Rejected',
  OFFER = 'Offer',
  UNKNOWN = 'Unknown'
}

/**
 * Mapping from application status to funnel stage
 */
export const STATUS_TO_STAGE_MAP: Record<AppStatus, FunnelStage> = {
  'Applied': FunnelStage.APPLIED,
  'Interview': FunnelStage.INTERVIEW,
  'Rejected': FunnelStage.REJECTED,
  'Offer': FunnelStage.OFFER
};

/**
 * Count of applications at a specific stage
 */
export interface StageCount {
  stage: FunnelStage;
  count: number;
}

/**
 * Flow between two stages in the funnel
 */
export interface Flow {
  source: FunnelStage;
  target: FunnelStage;
  count: number;
  conversionRate: number;
}

/**
 * Plotly node configuration for Sankey diagram
 */
export interface PlotlyNode {
  label: string;
  color: string;
  pad: number;
  thickness: number;
}

/**
 * Plotly link configuration for Sankey diagram
 */
export interface PlotlyLink {
  source: number;  // Index into nodes array
  target: number;  // Index into nodes array
  value: number;   // Number of applications
  color: string;
}

/**
 * Complete Plotly data structure for Sankey diagram
 */
export interface PlotlyData {
  type: 'sankey';
  orientation: 'h';
  node: {
    label: string[];
    color: string[];
    pad: number;
    thickness: number;
  };
  link: {
    source: number[];
    target: number[];
    value: number[];
    color: string[];
  };
}

/**
 * Pipeline metrics for summary statistics
 */
export interface PipelineMetrics {
  totalApplications: number;
  responseRate: number;      // % that moved beyond "Applied"
  interviewRate: number;      // % that reached "Interview"
  offerRate: number;          // % that reached "Offer"
}

/**
 * Color scheme for funnel stages
 */
export const STAGE_COLORS: Record<FunnelStage, string> = {
  [FunnelStage.APPLIED]: '#94a3b8',      // Slate-400 (neutral)
  [FunnelStage.INTERVIEW]: '#22c55e',    // Green-500 (positive)
  [FunnelStage.OFFER]: '#10b981',        // Emerald-500 (very positive)
  [FunnelStage.REJECTED]: '#ef4444',     // Red-500 (negative)
  [FunnelStage.UNKNOWN]: '#6b7280'       // Gray-500 (neutral)
};

/**
 * Plotly configuration for the Sankey diagram
 */
export const PLOTLY_CONFIG = {
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

/**
 * Plotly layout configuration for the Sankey diagram
 */
export const PLOTLY_LAYOUT = {
  title: {
    text: 'Job Application Funnel',
    font: { size: 24 }
  },
  font: { size: 14 },
  margin: { l: 20, r: 20, t: 60, b: 20 },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent'
};
