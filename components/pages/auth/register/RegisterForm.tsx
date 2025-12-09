'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { AuthState } from '../AuthContainer';

interface RegisterFormProps {
  onSuccess: (email: string, userName: string) => void;
  switchView: (newState: AuthState) => void;
}

export default function RegisterForm({ onSuccess, switchView }: RegisterFormProps) {
  const [formData, setFormData] = useState({ userName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Success: Switch to OTP form
      onSuccess(formData.email, formData.userName);

    } catch (err: any) {
      console.error('Registration API Error:', err.message);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-800">New Account</h2>

      {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm text-center">{error}</p>}

      {['userName', 'email', 'password'].map((key) => (
        <div key={key}>
          <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">
            {key === 'userName' ? 'Username' : key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
          <input
            id={key}
            name={key}
            type={key === 'password' ? 'password' : 'text'}
            required
            value={(formData as any)[key]}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Sending OTP...' : 'Register & Verify'}
      </button>

      {/* Google Sign-in Button */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signIn('google')}
        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Sign in with Google
      </button>
    </form>
  );
}