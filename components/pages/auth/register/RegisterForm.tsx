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
      if (!response.ok) throw new Error(data.error || 'Registration failed.');
      onSuccess(formData.email, formData.userName);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-[10px] uppercase tracking-widest text-red-600 text-center">{error}</div>}

      <div className="space-y-5">
        {[
          { label: 'Name', name: 'userName', type: 'text', ph: 'Full Name' },
          { label: 'Email', name: 'email', type: 'email', ph: 'name@example.com' },
          { label: 'Security Password', name: 'password', type: 'password', ph: '••••••••' }
        ].map((field) => (
          <div key={field.name} className="group">
            <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-black transition-colors">{field.label}</label>
            <input
              type={field.type} name={field.name} required placeholder={field.ph} onChange={handleChange}
              className="w-full bg-transparent border-b border-gray-200 py-3 text-sm outline-none focus:border-black transition-all placeholder:text-gray-200 font-light"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-gray-800 transition-all disabled:opacity-50 mt-4"
      >
        {isLoading ? 'Processing...' : 'Register Account'}
      </button>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
        <div className="relative flex justify-center text-[9px] uppercase tracking-widest text-gray-300 bg-[#F9F8F6] px-4">Social Access</div>
      </div>

      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="w-full flex justify-center items-center py-4 border border-gray-200 text-[10px] uppercase tracking-widest gap-3 hover:bg-white transition-all font-medium"
      >
        <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-4 h-4" alt="Google" />
        Google Continuity
      </button>
    </form>
  );
}