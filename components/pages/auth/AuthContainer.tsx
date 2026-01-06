'use client';

import React, { useState } from 'react';
import RegisterForm from './register/RegisterForm';
import VerifyOtpForm from './verify-otp/VerifyOtpForm';
import StandardLoginForm from './login/StandardLoginForm';
import ForgotPasswordForm from './forgot-password/ForgotPasswordForm';

export type AuthState = 'register' | 'verify_otp' | 'login' | 'forgot_password';

interface PendingUser {
  email: string;
  userName: string;
}

export default function AuthContainer() {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);

  const handleRegistrationSuccess = (email: string, userName: string) => {
    setPendingUser({ email, userName });
    setAuthState('verify_otp');
  };

  const handleVerificationSuccess = () => {
    setPendingUser(null);
    setAuthState('login');
    alert("Verification successful! You can now log in.");
  };

  const switchView = (newState: AuthState) => {
    setAuthState(newState);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F9F8F6]">
      {/* LEFT SIDE: Brand Visual with Bottom Vignette */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
          alt="Sana Urooj Couture"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        {/* BOTTOM VIGNETTE EFFECT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent shadow-[inset_0_-100px_120px_rgba(0,0,0,0.9)]" />
        
        <div className="absolute bottom-20 left-16 z-10">
          <h1 className="text-white text-6xl font-serif italic tracking-tighter">Sana Urooj</h1>
          <p className="text-gray-300 text-[10px] uppercase tracking-[0.5em] mt-4 font-light">
            Defined by Elegance, Worn by Grace
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Forms */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif italic text-gray-900">
              {authState === 'login' ? 'Welcome Back' : authState === 'register' ? 'Create Account' : 'Security Check'}
            </h2>
            <div className="flex justify-center gap-6 pt-4">
              <button
                className={`text-[10px] uppercase tracking-widest pb-1 transition-all ${authState === 'register' ? 'text-black border-b border-black font-bold' : 'text-gray-400'}`}
                onClick={() => switchView('register')}
              >
                Register
              </button>
              <button
                className={`text-[10px] uppercase tracking-widest pb-1 transition-all ${authState === 'login' ? 'text-black border-b border-black font-bold' : 'text-gray-400'}`}
                onClick={() => switchView('login')}
              >
                Login
              </button>
            </div>
          </div>

          <div className="mt-8">
            {authState === 'register' && (
              <RegisterForm onSuccess={handleRegistrationSuccess} switchView={switchView} />
            )}

            {authState === 'verify_otp' && pendingUser ? (
              <VerifyOtpForm initialEmail={pendingUser.email} userName={pendingUser.userName} onSuccess={handleVerificationSuccess} switchView={switchView} />
            ) : authState === 'verify_otp' && (
              <div className="text-center p-6 bg-red-50">
                <p className="text-[10px] uppercase tracking-widest text-red-600">Session Expired</p>
                <button onClick={() => switchView('register')} className="text-xs underline mt-2">Try Again</button>
              </div>
            )}

            {authState === 'login' && <StandardLoginForm switchView={switchView} />}
            {authState === 'forgot_password' && <ForgotPasswordForm switchView={switchView} />}
          </div>
          
          <p className="text-center text-[9px] uppercase tracking-widest text-gray-400 pt-8">
            &copy; {new Date().getFullYear()} Sana Urooj Couture
          </p>
        </div>
      </div>
    </div>
  );
}