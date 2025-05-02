import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Key, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.user) {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setError('Password reset instructions have been sent to your email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-purple-400 flex items-center justify-center gap-2">
            <LogIn className="w-8 h-8" />
            Brain Rot Arena
          </h1>
          <p className="mt-2 text-gray-400">
            {isResettingPassword ? 'Reset your password' : 'Sign in to continue your adventure'}
          </p>
        </div>

        <form 
          onSubmit={isResettingPassword ? handlePasswordReset : handleLogin} 
          className="mt-8 space-y-6 bg-gray-800 p-8 rounded-lg shadow-lg"
        >
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-900 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {!isResettingPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-900 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? 'bg-purple-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
            }`}
          >
            {isLoading 
              ? (isResettingPassword ? 'Sending Reset Link...' : 'Signing in...') 
              : (isResettingPassword ? 'Send Reset Link' : 'Sign in')}
          </button>

          <div className="flex flex-col items-center gap-2 pt-4 text-sm text-gray-400">
            {isResettingPassword ? (
              <button
                type="button"
                onClick={() => setIsResettingPassword(false)}
                className="text-purple-400 hover:text-purple-300"
              >
                Back to Sign In
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsResettingPassword(true)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Forgot your password?
                </button>
                <div className="flex items-center gap-1">
                  <span>Don't have an account?</span>
                  <Link to="/signup" className="text-purple-400 hover:text-purple-300">
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}