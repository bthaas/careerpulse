import React from 'react';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
  onAddClick: () => void;
  onCSVImportClick?: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  onSyncEmails?: () => void;
  isSyncing?: boolean;
  onLogout?: () => void;
  user?: { name?: string; email?: string };
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, isDark, onAddClick, onCSVImportClick, searchQuery, onSearch, onSyncEmails, isSyncing = false, onLogout, user }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#101922]/90 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/JobFetchLogo3.png" 
              alt="JobFetch Logo" 
              className="size-9 object-contain"
            />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">JobFetch</h1>
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

            {onCSVImportClick && (
              <button 
                onClick={onCSVImportClick}
                className="hidden sm:flex items-center gap-2 h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                title="Import from CSV"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Import Spreadsheet</span>
              </button>
            )}

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

            {/* User Menu */}
            {onLogout && user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 h-9 px-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <span className="material-symbols-outlined text-[16px]">
                    {showUserMenu ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;