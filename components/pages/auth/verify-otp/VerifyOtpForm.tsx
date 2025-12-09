// components/pages/auth/verify-otp/VerifyOtpForm.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthState } from '../AuthContainer';
import { signIn } from 'next-auth/react';

interface VerifyOtpFormProps {
  initialEmail: string;
  userName: string;
  onSuccess: () => void;
  switchView: (newState: AuthState) => void;
}

// Initial cooldown in seconds (2 minutes, matching our backend logic)
const INITIAL_COOLDOWN_SECONDS = 120;

export default function VerifyOtpForm({ initialEmail, userName, onSuccess, switchView }: VerifyOtpFormProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Cooldown for resend button
  const [timer, setTimer] = useState(600); // OTP validity timer (10 minutes, 600 seconds)

  // ----------------------------------------------------
  // I. OTP Validity Timer Logic
  // ----------------------------------------------------
  useEffect(() => {
    const otpTimerId = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 0) {
          clearInterval(otpTimerId);
          // Optional: Display a message that OTP has expired
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(otpTimerId);
  }, []);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  // ----------------------------------------------------
  // II. Resend Cooldown Logic
  // ----------------------------------------------------
  useEffect(() => {
    let cooldownTimerId: NodeJS.Timeout | null = null;
    if (cooldown > 0) {
      cooldownTimerId = setInterval(() => {
        setCooldown(prevCooldown => prevCooldown - 1);
      }, 1000);
    } else if (cooldown === 0 && cooldownTimerId) {
      clearInterval(cooldownTimerId);
    }

    return () => {
      if (cooldownTimerId) clearInterval(cooldownTimerId);
    };
  }, [cooldown]);

  const handleResendOtp = useCallback(async () => {
    if (cooldown > 0) return; // Prevent resend if still on cooldown

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: initialEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting (429 status from backend)
        if (response.status === 429) {
          setError(data.error);
          setCooldown(data.cooldown); // Set the cooldown based on backend response
          return;
        }
        throw new Error(data.error || 'Failed to resend OTP.');
      }

      // Success: Reset the OTP validity timer and start the resend cooldown
      alert(data.message);
      setTimer(600); // Reset OTP expiry timer to 10 minutes
      setCooldown(INITIAL_COOLDOWN_SECONDS); // Start the 2-minute resend cooldown

    } catch (err: any) {
      console.error('Resend API Error:', err.message);
      setError(err.message || 'An unexpected error occurred during resend.');
    } finally {
      setIsLoading(false);
    }
  }, [initialEmail, cooldown]);


  // ----------------------------------------------------
  // III. Verification Submission
  // ----------------------------------------------------
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (timer <= 0) {
        throw new Error("OTP has expired. Please request a new code.");
      }

      // 1. Call custom API route to verify OTP
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: initialEmail, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      // 2. Verification Success:
      // The user is now verified in the DB (isVerified: true).
      // We log them in using NextAuth CredentialsProvider.
      const signInResult = await signIn('credentials', {
        email: initialEmail,
        password: 'This is a placeholder',
        redirect: false,
      });

      if (signInResult?.error) {
        // If auto-sign-in fails (e.g., due to the placeholder password logic):
        console.warn("Auto sign-in failed after verification. Redirecting to login.");
        onSuccess(); // Switch to login form where they can enter the real password
      } else {
        // If auto-sign-in works (unlikely with our current flow), refresh or redirect to dashboard.
        // Since we explicitly want them to login normally after verification, 
        // we'll enforce the switch to the login form.
        onSuccess();
      }

    } catch (err: any) {
      console.error('Verification Error:', err.message);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerifySubmit} className="w-full space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">Verify Account</h2>
      <p className="text-sm text-gray-600 text-center">
        A 6-digit OTP has been sent to **{initialEmail}**.
      </p>

      {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm text-center">{error}</p>}

      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
          Verification Code
        </label>
        <input
          id="otp"
          name="otp"
          type="text"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="mt-1 block w-full px-3 py-2 text-center text-xl border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm tracking-widest"
        />
      </div>

      <div className="flex justify-between items-center text-sm">
        <p className={`font-medium ${timer <= 60 ? 'text-red-500' : 'text-gray-500'}`}>
          Expires in: {formatTime(timer)}
        </p>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || isLoading}
          className={`font-semibold transition-colors duration-200 ${cooldown > 0
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-indigo-600 hover:text-indigo-800'
            }`}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading || otp.length !== 6 || timer <= 0}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {isLoading ? 'Verifying...' : 'Verify & Continue'}
      </button>

      <button onClick={() => switchView('register')} type="button" className="text-sm text-center w-full text-gray-500 hover:text-indigo-600 mt-4">
        Change Email? Go Back
      </button>
    </form>
  );
}