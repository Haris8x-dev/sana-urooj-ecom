// components/pages/auth/AuthContainer.tsx
'use client';

import React, { useState } from 'react';
import RegisterForm from './register/RegisterForm';
import VerifyOtpForm from './verify-otp/VerifyOtpForm';
import StandardLoginForm from './login/StandardLoginForm';
import ForgotPasswordForm from './forgot-password/ForgotPasswordForm';

// Define the possible states for the authentication flow
export type AuthState = 'register' | 'verify_otp' | 'login' | 'forgot_password';

// State to track user data temporarily during registration/verification
interface PendingUser {
  email: string;
  userName: string;
}

export default function AuthContainer() {
  const [authState, setAuthState] = useState<AuthState>('register');
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);

  const handleRegistrationSuccess = (email: string, userName: string) => {
    setPendingUser({ email, userName });
    setAuthState('verify_otp');
  };

  const handleVerificationSuccess = () => {
    setPendingUser(null);
    setAuthState('login');
    // In a real app, you might show a success toast here instead of an alert
    alert("Verification successful! You can now log in.");
  };

  const switchView = (newState: AuthState) => {
    setAuthState(newState);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white shadow-xl rounded-lg max-w-md w-full">
      <div className="w-full mb-6 flex justify-center space-x-4 border-b pb-3">
        <button
          className={`font-semibold ${authState === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => switchView('register')}
        >
          Register
        </button>
        <button
          className={`font-semibold ${authState === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => switchView('login')}
        >
          Login
        </button>
      </div>

      {authState === 'register' && (
        <RegisterForm
          onSuccess={handleRegistrationSuccess}
          switchView={switchView}
        />
      )}

      {authState === 'verify_otp' && pendingUser ? (
        <VerifyOtpForm
          initialEmail={pendingUser.email}
          userName={pendingUser.userName}
          onSuccess={handleVerificationSuccess}
          switchView={switchView}
        />
      ) : authState === 'verify_otp' && (
        // Fallback if the user navigates directly or state is lost
        <div className="text-center">
          <p className="text-red-500">Verification session expired. Please register again.</p>
          <button onClick={() => switchView('register')} className="text-sm text-indigo-500 mt-4">
            Go to Registration
          </button>
        </div>
      )}

      {authState === 'login' && (
        <StandardLoginForm
          switchView={switchView}
        />
      )}

      {authState === 'forgot_password' && (
        <ForgotPasswordForm
          switchView={switchView}
        />
      )}
    </div>
  );
}