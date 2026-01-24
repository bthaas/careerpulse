/**
 * Backward-compatible functional wrapper for ApiClient
 * Delegates to ApiClient class instance
 */

import { ApiClient } from './ApiClient';

// Create singleton instance
const apiClient = new ApiClient();

// Export class for new code
export { ApiClient };

export const API_URL = import.meta.env.VITE_API_URL || 'https://api.jobfetch.app';

const API_BASE_URL = `${API_URL}/api`;

// ========================================
// Health Check
// ========================================

export async function checkHealth() {
  return apiClient.checkHealth();
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
  return apiClient.getAllApplications();
}

export async function getApplication(id: string): Promise<Application> {
  return apiClient.getApplication(id);
}

export async function createApplication(application: Partial<Application>): Promise<Application> {
  return apiClient.createApplication(application);
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
  return apiClient.updateApplication(id, updates);
}

export async function updateApplicationStatus(id: string, status: Application['status']): Promise<Application> {
  return apiClient.updateApplicationStatus(id, status);
}

export async function deleteApplication(id: string): Promise<void> {
  return apiClient.deleteApplication(id);
}

export async function getApplicationHistory(id: string): Promise<any[]> {
  return apiClient.getApplicationHistory(id);
}

// ========================================
// Auth API
// ========================================

export interface AuthStatus {
  connected: boolean;
  email: string | null;
}

export async function getAuthUrl(): Promise<{ authUrl: string }> {
  return apiClient.getAuthUrl();
}

export async function getAuthStatus(): Promise<AuthStatus> {
  return apiClient.getAuthStatus();
}

export async function disconnectEmail(): Promise<{ success: boolean; message: string }> {
  return apiClient.disconnectEmail();
}

export async function refreshToken(): Promise<{ success: boolean; message: string }> {
  return apiClient.refreshToken();
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
  return apiClient.syncEmails(options);
}

export async function getEmailProfile(): Promise<{ email: string; messagesTotal: number; threadsTotal: number }> {
  return apiClient.getEmailProfile();
}

export async function getEmailStatus(): Promise<{ connected: boolean; email: string | null; lastSync: string | null }> {
  return apiClient.getEmailStatus();
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

// Export singleton instance
export { apiClient };
