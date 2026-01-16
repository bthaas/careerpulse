import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ApplicationsTable from './components/ApplicationsTable';
import ApplicationDrawer from './components/ApplicationDrawer';
import AddApplicationModal, { NewApplication } from './components/AddApplicationModal';
import EmptyState from './components/EmptyState';
import { Application, MOCK_APPLICATIONS } from './types';

export type SortField = 'company' | 'dateApplied' | 'lastUpdate' | 'status' | 'none';
export type SortOrder = 'asc' | 'desc';

const App: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  // Sort & Filter state
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');

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

  // Sort and filter applications
  const getFilteredAndSortedApplications = (): Application[] => {
    let filtered = [...applications];

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(app => statusFilter.includes(app.status));
    }

    // Apply date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateRangeFilter) {
        case '7days':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter(app => {
        const appDate = new Date(app.dateApplied);
        return appDate >= cutoffDate;
      });
    }

    // Apply sorting
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'company':
            aValue = a.company.toLowerCase();
            bValue = b.company.toLowerCase();
            break;
          case 'dateApplied':
            aValue = new Date(a.dateApplied);
            bValue = new Date(b.dateApplied);
            break;
          case 'lastUpdate':
            aValue = new Date(a.lastUpdate);
            bValue = new Date(b.lastUpdate);
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredApplications = getFilteredAndSortedApplications();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilterStatus = (statuses: string[]) => {
    setStatusFilter(statuses);
  };

  const handleFilterDateRange = (range: 'all' | '7days' | '30days' | '90days') => {
    setDateRangeFilter(range);
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setDateRangeFilter('all');
    setSortField('none');
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark transition-colors duration-200">
      <Header toggleTheme={toggleTheme} isDark={isDark} onAddClick={() => setIsAddModalOpen(true)} />
      
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col overflow-hidden">
        {/* Top Stats */}
        {applications.length > 0 && <StatsCards applications={applications} />}

        {/* List View or Empty State */}
        <div className="flex-1 overflow-hidden">
            {applications.length === 0 ? (
              <EmptyState 
                onAddManually={() => setIsAddModalOpen(true)}
                onConnectEmail={() => alert('Gmail connection coming soon!')}
              />
            ) : (
              <ApplicationsTable 
                  applications={filteredApplications} 
                  onSelectApplication={handleSelectApplication}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  statusFilter={statusFilter}
                  dateRangeFilter={dateRangeFilter}
                  onFilterStatus={handleFilterStatus}
                  onFilterDateRange={handleFilterDateRange}
                  onClearFilters={clearFilters}
              />
            )}
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