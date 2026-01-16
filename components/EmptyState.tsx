import React from 'react';

interface EmptyStateProps {
  onAddManually: () => void;
  onConnectEmail?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddManually, onConnectEmail }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-4">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-500">
                folder_open
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-white">
                add
              </span>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          No Applications Yet
        </h2>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Start tracking your job applications by connecting your email to automatically import applications, 
          or add them manually to get started.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onAddManually}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Application Manually
          </button>

          {onConnectEmail && (
            <button
              onClick={onConnectEmail}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">sync</span>
              Connect Gmail
            </button>
          )}
        </div>

        {/* Features List */}
        <div className="mt-12 space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Track Your Applications
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                  list_alt
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Organize
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All in one place
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 size-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-orange-600 dark:text-orange-400">
                  insights
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Track Progress
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monitor status
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 size-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-green-600 dark:text-green-400">
                  auto_awesome
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Auto-Sync
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Import from email
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
