import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ApplicationsTable from './components/ApplicationsTable';
import ApplicationDrawer from './components/ApplicationDrawer';
import { Application, MOCK_APPLICATIONS } from './types';

const App: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Initialize theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleSelectApplication = (app: Application) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Wait for transition to finish before clearing data (optional for smoother UX)
    setTimeout(() => {
        if (!isDrawerOpen) setSelectedApp(null);
    }, 300);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark transition-colors duration-200">
      <Header toggleTheme={toggleTheme} isDark={isDark} />
      
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col overflow-hidden">
        {/* Top Stats */}
        <StatsCards applications={applications} />

        {/* List View */}
        <div className="flex-1 overflow-hidden">
            <ApplicationsTable 
                applications={applications} 
                onSelectApplication={handleSelectApplication}
            />
        </div>
      </main>

      <ApplicationDrawer 
        application={selectedApp} 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
      />
    </div>
  );
};

export default App;