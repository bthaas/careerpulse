import React from 'react';
import { Application } from '../types';

export interface FunnelButtonProps {
  applications: Application[];
  onClick: () => void;
}

/**
 * FunnelButton component displays an orange button that opens
 * the funnel visualization modal. Only renders when applications exist.
 */
export const FunnelButton: React.FC<FunnelButtonProps> = ({
  applications,
  onClick
}) => {
  // Don't render if no applications
  if (applications.length === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      aria-label="View application funnel visualization"
    >
      {/* Chart icon */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <span>View Funnel</span>
    </button>
  );
};
