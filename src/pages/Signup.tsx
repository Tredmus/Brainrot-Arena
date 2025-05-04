import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Key, Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const validateForm = () => {
    // Username validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (username.length > 20) {
      setError('Username must be less than 20 characters long');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password.length > 72) {
      setError('Password must be less than 72 characters long');
      return false;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setSignupSuccess(false);
    setResendSuccess(false);

    try {
      // Form validation
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      // Check if username exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (existingUser) {
        setError('This username is already taken');
        setIsLoading(false);
        return;
      }

      // Try to sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data?.user) {
        setSignupSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to connect with Google');
    }
  };

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsResendingEmail(true);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase(),
      });

      if (error) {
        setError(error.message);
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setError('Failed to resend confirmation email');
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="https://snipboard.io/Rr8lnU.jpg"
              alt="Brain Rot Arena Logo"
              className="w-16 h-16 rounded-full ring-2 ring-purple-500/50"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Join Brain Rot Arena
            </h1>
          </div>
          <p className="text-gray-400">Create your account to start your adventure</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-500/10">
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-lg mb-6 animate-[bounceIn_0.5s_ease-out]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {signupSuccess ? (
            <div className="space-y-4 animate-[bounceIn_0.5s_ease-out]">
              <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-4 rounded-lg">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>
                  Account created successfully! Please check your email to confirm your account.
                </span>
              </div>
              
              <div className="text-sm text-gray-400">
                <p>Haven't received the email? Check your spam folder or click below to resend.</p>
                <button
                  onClick={handleResendEmail}
                  disabled={isResendingEmail || resendSuccess}
                  className={`
                    mt-2 inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors
                    ${(isResendingEmail || resendSuccess) && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  <RefreshCw className={`w-4 h-4 ${isResendingEmail && 'animate-spin'}`} />
                  {isResendingEmail
                    ? 'Sending...'
                    : resendSuccess
                    ? 'Email sent!'
                    : 'Resend confirmation email'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                    Username
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 bg-gray-900/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Choose a username"
                      pattern="^[a-zA-Z0-9_]+$"
                      title="Username can only contain letters, numbers, and underscores"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 bg-gray-900/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 bg-gray-900/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Choose a password"
                      minLength={6}
                      maxLength={72}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    Password must be 6-72 characters and contain at least one number, one lowercase and one uppercase letter
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    w-full relative group flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white
                    ${isLoading
                      ? 'bg-purple-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                    }
                  `}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all" />
                  <div className="relative flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800/50 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleGoogleSignup}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-700 rounded-lg bg-white text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Sign up with Google</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}