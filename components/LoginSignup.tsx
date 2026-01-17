import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginSignup: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name || undefined);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get Google OAuth URL from backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/google`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError('Failed to initiate Google sign-in');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl text-primary mb-4">
            <span className="material-symbols-outlined text-4xl">work</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            JobFetch
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Fetch your dream job opportunities
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isLogin
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !isLogin
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-shadow"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={8}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-shadow"
              />
              {!isLogin && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                <span>{isLogin ? 'Login' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Google Sign-In Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            ✨ Free features included:
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-500">
            <span>📧 Gmail Sync</span>
            <span>🤖 Auto-Extract</span>
            <span>📊 Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
