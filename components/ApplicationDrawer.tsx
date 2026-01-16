import React, { useState } from 'react';
import { Application } from '../types';

interface ApplicationDrawerProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

const ApplicationDrawer: React.FC<ApplicationDrawerProps> = ({ application, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'Details' | 'Raw Email' | 'Notes'>('Details');

  // Prevent background scroll when open (optional, often handled by a library but good to have)
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!application) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer Component */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[720px] bg-white dark:bg-[#111827] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header */}
        <div className="flex-none p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] z-10">
          {/* Top Controls */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4">
              <div 
                className={`relative h-16 w-16 flex-none rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center bg-cover bg-center ${application.logoBgColor}`}
                 style={{ backgroundImage: `url('${application.logoUrl}')` }}
              >
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{application.role}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">{application.company}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{application.location}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    {application.status === 'Applied' ? 'In Review' : application.status}
                  </span>
                </div>
              </div>
            </div>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full">
              {/* Edit Status Button */}
              <button className="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-blue-200 dark:shadow-none flex-1 md:flex-none md:min-w-[140px]">
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                Edit Status
              </button>
              {/* External Link */}
              <button className="flex items-center justify-center gap-2 h-10 w-10 md:w-auto md:px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span className="hidden md:inline">View Job</span>
              </button>
              {/* More Actions */}
              <div className="relative ml-auto">
                <button className="flex items-center justify-center h-10 w-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Application">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-8 border-b border-slate-200 dark:border-slate-800">
            {(['Details', 'Raw Email', 'Notes'] as const).map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 border-b-[3px] font-medium text-sm transition-colors ${
                        activeTab === tab 
                        ? 'border-primary text-primary font-bold' 
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    {tab}
                </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto drawer-scroll bg-slate-50/50 dark:bg-[#0b1016]">
          <div className="p-6 max-w-3xl mx-auto space-y-8">
            
            {/* Info Grid */}
            <section className="bg-white dark:bg-[#161e29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Date Applied</span>
                  <span className="text-slate-900 dark:text-white font-medium">{application.dateApplied}</span>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Source</span>
                  <span className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#0077b5]">work</span>
                    {application.source}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Salary Range</span>
                  <span className="text-slate-900 dark:text-white font-medium">{application.salary || 'Not listed'}</span>
                </div>
                <div className="p-4 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Remote Policy</span>
                  <span className="text-slate-900 dark:text-white font-medium">{application.remotePolicy || 'Not specified'}</span>
                </div>
              </div>
            </section>

            {/* Original Correspondence Section */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Original Correspondence</h3>
                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Auto-scraped</span>
              </div>
              <div className="bg-white dark:bg-[#161e29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-1">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 max-h-64 overflow-y-auto text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-mono border border-slate-100 dark:border-slate-800">
                  <p className="mb-4">
                    <strong className="text-slate-900 dark:text-slate-200">From:</strong> {application.company} Careers &lt;careers-noreply@{application.company.toLowerCase().replace(/\s/g, '')}.com&gt;<br/>
                    <strong className="text-slate-900 dark:text-slate-200">Subject:</strong> {application.emailSubject}
                  </p>
                  <hr className="border-slate-200 dark:border-slate-700 my-4"/>
                  {application.emailBody?.split('\n').map((line, i) => (
                      <p key={i} className="mb-4 min-h-[1em]">{line}</p>
                  ))}
                </div>
              </div>
            </section>

            {/* Notes Section */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">My Notes</h3>
              </div>
              <div className="bg-white dark:bg-[#161e29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex flex-col gap-3">
                  <textarea 
                    className="w-full min-h-[120px] bg-transparent border-0 focus:ring-0 p-0 text-slate-700 dark:text-slate-300 placeholder-slate-400 resize-none text-base leading-relaxed" 
                    placeholder="Add your notes here (e.g. key requirements, questions for the recruiter)..."
                    defaultValue={application.notes}
                  ></textarea>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2 text-slate-400">
                      <button className="hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded transition-colors" title="Bold">
                        <span className="material-symbols-outlined text-[18px]">format_bold</span>
                      </button>
                      <button className="hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded transition-colors" title="List">
                        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                      </button>
                    </div>
                    <button className="text-xs font-bold text-primary hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline/Activity Teaser */}
            <section className="pb-10">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-3 px-1">Activity Log</h3>
              <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500 ring-4 ring-white dark:ring-[#0b1016]"></div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Status updated to In Review</p>
                  <p className="text-xs text-slate-500">Today, 9:41 AM</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-[#0b1016]"></div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Applied via LinkedIn</p>
                  <p className="text-xs text-slate-500">{application.dateApplied}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationDrawer;