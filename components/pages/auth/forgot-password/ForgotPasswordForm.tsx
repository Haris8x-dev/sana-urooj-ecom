'use client';

import React, { useState } from 'react';
import { AuthState } from '../AuthContainer';

interface ForgotPasswordFormProps {
    switchView: (newState: AuthState) => void;
}

export default function ForgotPasswordForm({ switchView }: ForgotPasswordFormProps) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email.');
            }

            setSuccess(data.message);
            setEmail(''); // Clear the email field

        } catch (err: any) {
            console.error('Forgot Password API Error:', err.message);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <h2 className="text-2xl font-bold text-center text-gray-800">Reset Password</h2>
            <p className="text-sm text-gray-600 text-center">
                Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm text-center">{error}</p>}
            {success && <p className="text-green-600 bg-green-100 p-2 rounded text-sm text-center">{success}</p>}

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="your.email@example.com"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
                type="button"
                onClick={() => switchView('login')}
                className="text-sm text-center w-full text-gray-500 hover:text-indigo-600 mt-4"
            >
                ← Back to Login
            </button>
        </form>
    );
}
