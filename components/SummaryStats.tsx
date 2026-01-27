import React from 'react';
import { Application } from '../types';
import { calculatePipelineMetrics } from '../utils/funnelMetrics';
import { formatNumber, formatPercentage } from '../utils/funnelStyles';

export interface SummaryStatsProps {
  applications: Application[];
}

/**
 * SummaryStats component displays key pipeline metrics
 * in a grid of metric cards.
 */
export const SummaryStats: React.FC<SummaryStatsProps> = ({ applications }) => {
  const metrics = calculatePipelineMetrics(applications);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      {/* Total Applications */}
      <div className="text-center">
        <div className="text-xl font-bold text-slate-900 dark:text-white">
          {formatNumber(metrics.totalApplications)}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Total Applications</div>
      </div>

      {/* Response Rate */}
      <div className="text-center">
        <div className="text-xl font-bold text-green-600 dark:text-green-400">
          {formatPercentage(metrics.responseRate)}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Response Rate</div>
      </div>

      {/* Interview Rate */}
      <div className="text-center">
        <div className="text-xl font-bold text-green-600 dark:text-green-400">
          {formatPercentage(metrics.interviewRate)}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Interview Rate</div>
      </div>

      {/* Offer Rate */}
      <div className="text-center">
        <div className="text-xl font-bold text-green-600 dark:text-green-400">
          {formatPercentage(metrics.offerRate)}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Offer Rate</div>
      </div>
    </div>
  );
};
