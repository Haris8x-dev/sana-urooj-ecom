// components/pages/auth/login/StandardLoginForm.tsx
'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthState } from '../AuthContainer'; 

interface StandardLoginFormProps {
  switchView: (newState: AuthState) => void;
}

export default function StandardLoginForm({ switchView }: StandardLoginFormProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Call NextAuth signIn with credentials provider
      const result = await signIn('credentials', {
        email: formData.email, // This field handles both username/email in our auth.ts logic
        password: formData.password,
        redirect: false, // Prevents automatic redirect on success/failure
      });

      if (result?.error) {
        // NextAuth errors are typically generic, but our auth.ts provides specific messages 
        // (e.g., "Account not verified", "Invalid Credentials")
        
        // Check for the specific "Account not verified" error from our auth.ts
        if (result.error.includes("not verified")) {
             // If unverified, switch back to the OTP form to encourage verification
             setError("Your account is not verified. Redirecting to verification.");
             // Optional: Timeout before switching view
             setTimeout(() => {
                switchView('verify_otp');
             }, 1500); 
        } else {
            setError(result.error || 'Login failed. Check your email/username and password.');
        }
      } else if (result?.ok) {
        // 2. Success: Redirect to a protected page (e.g., dashboard)
        router.push('/dashboard'); 
      }

    } catch (err) {
      console.error('Login Error:', err);
      setError('An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-800">Account Login</h2>
      
      {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm text-center">{error}</p>}
      
      {/* Input 1: Username or Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Username or Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Enter username or email"
        />
      </div>

      {/* Input 2: Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Enter your password"
        />
      </div>

      <div className="flex justify-end">
        {/* Forgot Password Button */}
        <button
          type="button"
          onClick={() => switchView('forgot_password')}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Logging In...' : 'Login'}
      </button>

      {/* Google Sign-in Button */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or sign in with</span>
        </div>
      </div>
      
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })} // Redirect to dashboard on Google success
        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {/* Google Icon SVG Path */}
        Sign in with Google
      </button>
    </form>
  );
}