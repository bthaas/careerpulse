import React from 'react';
import { Application } from '../types';

interface StatsCardsProps {
  applications: Application[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ applications }) => {
  // Calculate stats dynamically
  const totalApplications = applications.length;
  const interviewCount = applications.filter(app => app.status === 'Interview').length;
  const offerCount = applications.filter(app => app.status === 'Offer').length;
  const rejectedCount = applications.filter(app => app.status === 'Rejected').length;

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {/* Card 1 */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Applications</p>
          <span className="material-symbols-outlined text-blue-500 text-[16px]">folder_open</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{totalApplications}</h3>
      </div>

      {/* Card 2 */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Interviews</p>
          <span className="material-symbols-outlined text-orange-500 text-[16px]">video_camera_front</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{interviewCount}</h3>
      </div>

      {/* Card 3 */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Offers</p>
          <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{offerCount}</h3>
      </div>

      {/* Card 4 */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Rejected</p>
          <span className="material-symbols-outlined text-red-500 text-[16px]">cancel</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{rejectedCount}</h3>
      </div>
    </div>
  );
};

export default StatsCards;