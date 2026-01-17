/**
 * API Service Client
 * Handles all communication with the backend API
 */

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ========================================
// Health Check
// ========================================

export async function checkHealth() {
  return apiRequest<{ status: string; timestamp: string; version: string }>('/health');
}

// ========================================
// Applications API
// ========================================

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  dateApplied: string;
  lastUpdate: string;
  createdAt: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  source?: string;
  salary?: string;
  remotePolicy?: string;
  notes?: string;
  emailId?: string;
  confidenceScore?: number;
  isDuplicate?: number;
}

export async function getAllApplications(): Promise<Application[]> {
  return apiRequest<Application[]>('/applications');
}

export async function getApplication(id: string): Promise<Application> {
  return apiRequest<Application>(`/applications/${id}`);
}

export async function createApplication(application: Partial<Application>): Promise<Application> {
  return apiRequest<Application>('/applications', {
    method: 'POST',
    body: JSON.stringify(application),
  });
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  return apiRequest<Application>(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function updateApplicationStatus(id: string, status: Application['status']): Promise<Application> {
  return apiRequest<Application>(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  return apiRequest<void>(`/applications/${id}`, {
    method: 'DELETE',
  });
}

export async function getApplicationHistory(id: string): Promise<any[]> {
  return apiRequest<any[]>(`/applications/${id}/history`);
}

// ========================================
// Auth API
// ========================================

export interface AuthStatus {
  connected: boolean;
  email: string | null;
}

export async function getAuthUrl(): Promise<{ authUrl: string }> {
  return apiRequest<{ authUrl: string }>('/auth/gmail');
}

export async function getAuthStatus(): Promise<AuthStatus> {
  return apiRequest<AuthStatus>('/auth/status');
}

export async function disconnectEmail(): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>('/auth/disconnect', {
    method: 'POST',
  });
}

export async function refreshToken(): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>('/auth/refresh', {
    method: 'POST',
  });
}

// ========================================
// Email Sync API
// ========================================

export interface SyncResult {
  success: boolean;
  totalEmails: number;
  jobEmails: number;
  newApplications: number;
  duplicates: number;
  errors: number;
  applications: Array<{
    company: string;
    role: string;
    status: string;
    confidenceScore: number;
  }>;
}

export async function syncEmails(options?: { maxResults?: number; afterDate?: string }): Promise<SyncResult> {
  return apiRequest<SyncResult>('/email/sync', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

export async function getEmailProfile(): Promise<{ email: string; messagesTotal: number; threadsTotal: number }> {
  return apiRequest<{ email: string; messagesTotal: number; threadsTotal: number }>('/email/profile');
}

export async function getEmailStatus(): Promise<{ connected: boolean; email: string | null; lastSync: string | null }> {
  return apiRequest<{ connected: boolean; email: string | null; lastSync: string | null }>('/email/status');
}

export default {
  checkHealth,
  getAllApplications,
  getApplication,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationHistory,
  getAuthUrl,
  getAuthStatus,
  disconnectEmail,
  refreshToken,
  syncEmails,
  getEmailProfile,
  getEmailStatus,
};
