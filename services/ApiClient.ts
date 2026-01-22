/**
 * ApiClient Class - OOP Implementation
 * Encapsulates all API communication with the backend
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
 */

// ========================================
// Types and Interfaces
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

export interface AuthStatus {
  connected: boolean;
  email: string | null;
}

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

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface Interceptor {
  request?: (config: RequestInit, url: string) => RequestInit | Promise<RequestInit>;
  response?: (response: Response) => Response | Promise<Response>;
  error?: (error: Error) => Error | Promise<Error>;
}

/**
 * ApiClient Class
 * Manages all HTTP communication with the backend API
 */
export class ApiClient {
  private baseUrl: string;
  private token: string | null;
  private interceptors: Interceptor[];

  /**
   * Create an ApiClient instance
   * @param baseUrl - Base URL for API (default: auto-detect based on environment)
   * @param token - Optional authentication token
   */
  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = baseUrl || this._getDefaultBaseUrl();
    this.token = token || this._getStoredToken();
    this.interceptors = [];
  }

  /**
   * Get default base URL based on environment
   * @private
   */
  private _getDefaultBaseUrl(): string {
    const apiUrl = import.meta.env.PROD 
      ? 'https://api.jobfetch.app'
      : 'http://localhost:3001';
    return `${apiUrl}/api`;
  }

  /**
   * Get stored token from localStorage
   * @private
   */
  private _getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Set authentication token
   * @param token - JWT token
   */
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Set base URL
   * @param url - New base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Add request/response interceptor
   * @param interceptor - Interceptor functions
   */
  addInterceptor(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * Make API request with automatic authentication and error handling
   * @private
   */
  private async _request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Build request config with authentication
    let config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      credentials: 'include',
    };

    // Apply request interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.request) {
        config = await interceptor.request(config, url);
      }
    }

    try {
      let response = await fetch(url, config);

      // Apply response interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.response) {
          response = await interceptor.response(response);
        }
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      return await response.json();
    } catch (error) {
      // Apply error interceptors
      let finalError = error as Error;
      for (const interceptor of this.interceptors) {
        if (interceptor.error) {
          finalError = await interceptor.error(finalError);
        }
      }

      console.error(`API Error (${endpoint}):`, finalError);
      throw finalError;
    }
  }

  // ========================================
  // Health Check
  // ========================================

  async checkHealth(): Promise<HealthResponse> {
    return this._request<HealthResponse>('/health');
  }

  // ========================================
  // Applications API
  // ========================================

  async getAllApplications(): Promise<Application[]> {
    return this._request<Application[]>('/applications');
  }

  async getApplication(id: string): Promise<Application> {
    return this._request<Application>(`/applications/${id}`);
  }

  async createApplication(application: Partial<Application>): Promise<Application> {
    return this._request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    return this._request<Application>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateApplicationStatus(id: string, status: Application['status']): Promise<Application> {
    return this._request<Application>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteApplication(id: string): Promise<void> {
    return this._request<void>(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  async getApplicationHistory(id: string): Promise<any[]> {
    return this._request<any[]>(`/applications/${id}/history`);
  }

  // ========================================
  // Auth API
  // ========================================

  async getAuthUrl(): Promise<{ authUrl: string }> {
    return this._request<{ authUrl: string }>('/auth/gmail');
  }

  async getAuthStatus(): Promise<AuthStatus> {
    return this._request<AuthStatus>('/auth/status');
  }

  async disconnectEmail(): Promise<{ success: boolean; message: string }> {
    return this._request<{ success: boolean; message: string }>('/auth/disconnect', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<{ success: boolean; message: string }> {
    return this._request<{ success: boolean; message: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  // ========================================
  // Email Sync API
  // ========================================

  async syncEmails(options?: { maxResults?: number; afterDate?: string }): Promise<SyncResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      const result = await this._request<SyncResult>('/email/sync', {
        method: 'POST',
        body: JSON.stringify(options || {}),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Sync is taking longer than expected. Please check your applications list - some may have been added.');
      }
      throw error;
    }
  }

  async getEmailProfile(): Promise<{ email: string; messagesTotal: number; threadsTotal: number }> {
    return this._request<{ email: string; messagesTotal: number; threadsTotal: number }>('/email/profile');
  }

  async getEmailStatus(): Promise<{ connected: boolean; email: string | null; lastSync: string | null }> {
    return this._request<{ connected: boolean; email: string | null; lastSync: string | null }>('/email/status');
  }
}
