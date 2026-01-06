'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const initialState = {
  password: '',
  confirmPassword: '',
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || searchParams.get('access_token') || searchParams.get('accessToken');
  const [token, setToken] = useState(initialToken);
  const [tokenChecked, setTokenChecked] = useState(Boolean(initialToken));

  useEffect(() => {
    // If token not present in query params, try to read it from the URL fragment (#...)
    if (token) return;
    if (typeof window === 'undefined') {
      setTokenChecked(true);
      return;
    }

    const hash = window.location.hash || '';
    if (!hash) {
      setTokenChecked(true);
      return;
    }

    try {
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const t = params.get('access_token') || params.get('token') || params.get('accessToken');
      if (t) {
        setToken(t);
        // remove hash from URL to keep it clean
        try {
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState({}, document.title, newUrl);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore parse errors
    } finally {
      setTokenChecked(true);
    }
  }, [token]);
  
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Password validation
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Confirm password validation
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }
    
    setValidationErrors({});

    if (!token) {
      setError('Missing or invalid reset token.');
      setIsSubmitting(false);
      return;
    }

    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${base}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token, newPassword: form.password }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || json?.message || 'Failed to reset password.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If token is missing after we've checked both query and fragment, show invalid-link message
  if (!token && tokenChecked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-white">Invalid reset link</h1>
          <p className="text-sm text-slate-300">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link 
            href="/forgot-password"
            className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            Request new reset link
          </Link>
          <Link 
            href="/login"
            className="flex w-full items-center justify-center rounded-full bg-slate-800 py-3 text-sm font-semibold text-white border border-white/20 transition hover:bg-slate-700"
          >
            Back to login
          </Link>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-white">Password reset successful</h1>
          <p className="text-sm text-slate-300">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={() => router.push('/login')}
            className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            Continue to login
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="space-y-6 text-center">
        <h1 className="font-display text-3xl text-white">Reset your password</h1>
        <p className="text-sm text-slate-300">
          Enter your new password below.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            className={`w-full rounded-2xl border bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:outline-none focus:ring-2 ${
              validationErrors.password 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' 
                : 'border-white/20 focus:border-primary focus:ring-primary/50'
            }`}
            placeholder="Enter your new password"
          />
          {validationErrors.password && (
            <p className="text-xs text-red-400">{validationErrors.password}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            className={`w-full rounded-2xl border bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:outline-none focus:ring-2 ${
              validationErrors.confirmPassword 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' 
                : 'border-white/20 focus:border-primary focus:ring-primary/50'
            }`}
            placeholder="Confirm your new password"
          />
          {validationErrors.confirmPassword && (
            <p className="text-xs text-red-400">{validationErrors.confirmPassword}</p>
          )}
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs text-blue-200">
          <p className="font-semibold mb-1">Password requirements:</p>
          <ul className="space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains at least one uppercase letter</li>
            <li>• Contains at least one lowercase letter</li>
            <li>• Contains at least one number</li>
          </ul>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </p>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
        >
          {isSubmitting ? 'Resetting password…' : 'Reset password'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <Link 
          href="/login" 
          className="text-sm text-slate-300 hover:text-white"
        >
          Remember your password? <span className="text-primary hover:text-primary/80">Sign in</span>
        </Link>
      </div>
    </motion.div>
  );
}