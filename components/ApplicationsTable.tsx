import React, { useState } from 'react';
import { Application, AppStatus } from '../types';
import { SortField, SortOrder } from '../App';

interface ApplicationsTableProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  statusFilter: string[];
  dateRangeFilter: 'all' | '7days' | '30days' | '90days';
  onFilterStatus: (statuses: string[]) => void;
  onFilterDateRange: (range: 'all' | '7days' | '30days' | '90days') => void;
  onClearFilters: () => void;
}

const StatusPill: React.FC<{ status: AppStatus }> = ({ status }) => {
  const styles: Record<AppStatus, string> = {
    Interview: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    Offer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({ 
  applications, 
  onSelectApplication,
  sortField,
  sortOrder,
  onSort,
  statusFilter,
  dateRangeFilter,
  onFilterStatus,
  onFilterDateRange,
  onClearFilters
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      onFilterStatus(statusFilter.filter(s => s !== status));
    } else {
      onFilterStatus([...statusFilter, status]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || dateRangeFilter !== 'all' || sortField !== 'none';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Applications</h2>
        <div className="flex gap-2 relative">
          {/* Sort Button */}
          <div className="relative">
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">sort</span>
              Sort
              {sortField !== 'none' && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">1</span>
              )}
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <button
                    onClick={() => { onSort('company'); setShowSortMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
                  >
                    <span>Company {sortField === 'company' && `(${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`}</span>
                    {sortField === 'company' && <span className="material-symbols-outlined text-primary text-[18px]">check</span>}
                  </button>
                  <button
                    onClick={() => { onSort('dateApplied'); setShowSortMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
                  >
                    <span>Date Applied {sortField === 'dateApplied' && `(${sortOrder === 'asc' ? 'Oldest' : 'Newest'})`}</span>
                    {sortField === 'dateApplied' && <span className="material-symbols-outlined text-primary text-[18px]">check</span>}
                  </button>
                  <button
                    onClick={() => { onSort('lastUpdate'); setShowSortMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
                  >
                    <span>Last Update {sortField === 'lastUpdate' && `(${sortOrder === 'asc' ? 'Oldest' : 'Newest'})`}</span>
                    {sortField === 'lastUpdate' && <span className="material-symbols-outlined text-primary text-[18px]">check</span>}
                  </button>
                  <button
                    onClick={() => { onSort('status'); setShowSortMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
                  >
                    <span>Status {sortField === 'status' && `(${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`}</span>
                    {sortField === 'status' && <span className="material-symbols-outlined text-primary text-[18px]">check</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
                  {(statusFilter.length > 0 ? 1 : 0) + (dateRangeFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                <div className="p-4 space-y-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                      Status
                    </label>
                    <div className="space-y-2">
                      {(['Applied', 'Interview', 'Offer', 'Rejected'] as const).map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={statusFilter.includes(status)}
                            onChange={() => toggleStatusFilter(status)}
                            className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'All Time' },
                        { value: '7days', label: 'Last 7 Days' },
                        { value: '30days', label: 'Last 30 Days' },
                        { value: '90days', label: 'Last 90 Days' },
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="dateRange"
                            checked={dateRangeFilter === option.value}
                            onChange={() => onFilterDateRange(option.value as any)}
                            className="border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => { onClearFilters(); setShowFilterMenu(false); }}
                      className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilterMenu(false)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-white bg-primary hover:bg-blue-600 rounded transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[18%]">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%]">Date Applied</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%]">Last Update</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%]">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[14%]">Source</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {applications.map((app) => (
              <tr 
                key={app.id} 
                onClick={() => onSelectApplication(app)}
                className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div 
                        className={`size-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold bg-cover bg-center ${app.logoBgColor} ${app.logoTextColor}`}
                        style={{ backgroundImage: `url('${app.logoUrl}')` }}
                    >
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{app.company}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{app.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-slate-700 dark:text-slate-200">{app.role}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{app.dateApplied}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{app.lastUpdate}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusPill status={app.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">{app.sourceIcon}</span>
                    {app.source}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button onClick={(e) => { e.stopPropagation(); onSelectApplication(app); }} className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-8 px-3 text-xs font-bold text-white bg-primary rounded-lg transition-opacity hover:bg-blue-600 ml-auto">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between mt-auto">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-medium text-slate-900 dark:text-white">1</span> to <span className="font-medium text-slate-900 dark:text-white">{applications.length}</span> of <span className="font-medium text-slate-900 dark:text-white">{applications.length}</span> results
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled>Previous</button>
          <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsTable;