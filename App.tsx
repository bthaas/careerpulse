import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ApplicationsTable from './components/ApplicationsTable';
import ApplicationDrawer from './components/ApplicationDrawer';
import AddApplicationModal, { NewApplication } from './components/AddApplicationModal';
import EmptyState from './components/EmptyState';
import LoginSignup from './components/LoginSignup';
import { Application } from './types';
import * as api from './services/api';
import { useAuth } from './contexts/AuthContext';

export type SortField = 'company' | 'dateApplied' | 'lastUpdate' | 'status' | 'none';
export type SortOrder = 'asc' | 'desc';

const App: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  
  // Show login screen if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginSignup />;
  }
  
  return <Dashboard logout={logout} user={user} />;
};

const Dashboard: React.FC<{ logout: () => void; user: { id: string; email: string; name?: string } }> = ({ logout, user }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Sort & Filter state
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initialize theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch applications on mount
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAllApplications();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAddApplication = async (newApp: NewApplication) => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      
      const application = {
        id: `app-${Date.now()}`,
        company: newApp.company,
        role: newApp.role,
        location: newApp.location,
        dateApplied: newApp.dateApplied,
        lastUpdate: dateStr,
        createdAt: now.toISOString(),
        status: newApp.status,
        source: newApp.source || 'Manual',
        salary: newApp.salary,
        remotePolicy: newApp.remotePolicy,
        notes: newApp.notes,
      };

      // Create application via API
      const created = await api.createApplication(application);
      
      // Add to local state
      setApplications(prev => [created, ...prev]);
      
      // Success notification
      console.log('✅ Application added successfully:', created);
    } catch (err: any) {
      console.error('❌ Error adding application:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      alert(`Failed to add application: ${err.message || 'Please try again.'}`);
    }
  };

  const handleSyncEmails = async () => {
    try {
      setIsSyncing(true);
      const result = await api.syncEmails({ maxResults: 100 });
      
      // Refresh applications list
      await fetchApplications();
      
      alert(`✅ Sync complete!\n\nFound ${result.totalEmails} emails\nExtracted ${result.jobEmails} job-related emails\nAdded ${result.newApplications} new applications\nSkipped ${result.duplicates} duplicates`);
    } catch (err: any) {
      console.error('Error syncing emails:', err);
      
      if (err.message.includes('Gmail not connected') || err.message.includes('No Gmail connection')) {
        // Automatically trigger connect flow
        const shouldConnect = confirm('Gmail is not connected. Would you like to connect now?');
        if (shouldConnect) {
          await handleConnectGmail();
        }
      } else {
        alert(`Failed to sync emails: ${err.message}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      // Get Gmail OAuth URL
      const response = await fetch(`${api.API_URL}/api/auth/gmail`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const data = await response.json();
      
      // Open OAuth flow in new window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        data.authUrl,
        'Gmail OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Poll for connection status
      const checkConnection = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${api.API_URL}/api/auth/status`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            if (status.connected) {
              clearInterval(checkConnection);
              alert('✅ Gmail connected successfully! You can now sync your emails.');
            }
          }
        } catch (err) {
          // Continue polling
        }
      }, 2000);
      
      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(checkConnection), 120000);
      
    } catch (err: any) {
      console.error('Error connecting Gmail:', err);
      alert('Failed to connect Gmail. Please try again.');
    }
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

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.company.toLowerCase().includes(query) ||
        app.role.toLowerCase().includes(query) ||
        app.location.toLowerCase().includes(query)
      );
    }

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark transition-colors duration-200">
      <Header 
        toggleTheme={toggleTheme} 
        isDark={isDark} 
        onAddClick={() => setIsAddModalOpen(true)}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onSyncEmails={handleSyncEmails}
        isSyncing={isSyncing}
        onLogout={logout}
        user={user}
      />
      
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
        {/* Top Stats - Always visible */}
        <StatsCards applications={applications} />

        {/* List View or Empty State */}
        <div className="flex-1 min-h-0">
            {applications.length === 0 ? (
              <EmptyState 
                onAddManually={() => setIsAddModalOpen(true)}
                onConnectEmail={handleConnectGmail}
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