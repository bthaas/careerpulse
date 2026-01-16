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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Applications</p>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="material-symbols-outlined text-blue-500 text-[20px]">folder_open</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{totalApplications}</h3>
          <span className="text-xs font-medium text-slate-400">Total</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Interviews</p>
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span className="material-symbols-outlined text-orange-500 text-[20px]">video_camera_front</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{interviewCount}</h3>
          <span className="text-xs font-medium text-slate-400">Active</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Offers</p>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{offerCount}</h3>
          <span className="text-xs font-medium text-green-600">Pending response</span>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejected</p>
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <span className="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{rejectedCount}</h3>
          <span className="text-xs font-medium text-slate-400">This period</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;