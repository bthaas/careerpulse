import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ApplicationsTable from './components/ApplicationsTable';
import ApplicationDrawer from './components/ApplicationDrawer';
import AddApplicationModal, { NewApplication } from './components/AddApplicationModal';
import { Application, MOCK_APPLICATIONS } from './types';

const App: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const handleAddApplication = (newApp: NewApplication) => {
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    const application: Application = {
      id: Date.now().toString(),
      company: newApp.company,
      role: newApp.role,
      location: newApp.location,
      dateApplied: newApp.dateApplied,
      lastUpdate: now,
      status: newApp.status,
      source: newApp.source,
      sourceIcon: getSourceIcon(newApp.source),
      logoUrl: '',
      logoBgColor: getRandomBgColor(),
      logoTextColor: getRandomTextColor(),
      salary: newApp.salary,
      remotePolicy: newApp.remotePolicy,
      notes: newApp.notes,
      createdAt: now,
    };

    setApplications(prev => [application, ...prev]);
  };

  const getSourceIcon = (source: string): string => {
    const iconMap: Record<string, string> = {
      'LinkedIn': 'work',
      'Indeed': 'search',
      'Glassdoor': 'search',
      'Direct': 'send',
      'Referrer': 'person',
      'Other': 'public',
    };
    return iconMap[source] || 'public';
  };

  const getRandomBgColor = (): string => {
    const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-cyan-100', 'bg-pink-100'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRandomTextColor = (): string => {
    const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-cyan-600', 'text-pink-600'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark transition-colors duration-200">
      <Header toggleTheme={toggleTheme} isDark={isDark} onAddClick={() => setIsAddModalOpen(true)} />
      
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

      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddApplication}
      />
    </div>
  );
};

export default App;