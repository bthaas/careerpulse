import React from 'react';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
  onAddClick: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  onSyncEmails?: () => void;
  isSyncing?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, isDark, onAddClick, searchQuery, onSearch, onSyncEmails, isSyncing = false, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#101922]/90 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined text-2xl">work</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">CareerPulse</h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <label className="relative flex items-center w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border-none rounded-full focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 transition-shadow outline-none"
                placeholder="Search applications, companies..."
              />
            </label>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onAddClick}
              className="hidden sm:flex items-center gap-2 h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Application</span>
            </button>

            <button 
              onClick={onSyncEmails}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-2 h-9 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? 'progress_activity' : 'sync'}
              </span>
              <span>{isSyncing ? 'Syncing...' : 'Sync Gmail'}</span>
            </button>
            
            {/* Mobile Add Icon */}
            <button 
              onClick={onAddClick}
              className="sm:hidden flex items-center justify-center size-9 bg-green-600 text-white rounded-lg"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>

            {/* Mobile Sync Icon */}
            <button 
              onClick={onSyncEmails}
              disabled={isSyncing}
              className="sm:hidden flex items-center justify-center size-9 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[20px] ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? 'progress_activity' : 'sync'}
              </span>
            </button>

            <button onClick={toggleTheme} className="flex items-center justify-center size-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                 <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center justify-center size-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}

            <div className="relative group cursor-pointer">
              <div 
                className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border-2 border-white dark:border-slate-800 shadow-sm"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB042Z9FpnPxGIhZJWBtXrGUj1tdZgmRZ7O3M-mBGTrQ6bsrblgeAVl3Axq3dnMmQoVsO7d93YMalHh1mqWf3wkUFNtwVjVde-Tc0K2mig4LZQBm5ArILWPbPz3RuPd9Wolt2O2vv9ziIWHgKHZdo8udeAAj-aILI2cJAwTCG7NxdY_iN0YlDkhu1s7ILO_l48ehT5HNeVqnbrpzf7htpuhee0XvY2IIHx-6Briv1dLaXTD86dAT1Xo99MuomAjRsEUXbZaz0u7M_9N')" }}
              >
              </div>
              <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;