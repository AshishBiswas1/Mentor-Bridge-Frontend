'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const initialState = {
  email: '',
};

export default function ForgotPasswordPage() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Simulate API call for password reset
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For now, we'll always show success
      // In a real app, you'd call your password reset API here
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="font-display text-3xl text-white">Check your email</h1>
          <p className="text-sm text-slate-300">
            We've sent a password reset link to <strong>{form.email}</strong>
          </p>
          <p className="text-xs text-slate-400">
            Didn't receive the email? Check your spam folder or{' '}
            <button 
              onClick={() => setSuccess(false)}
              className="text-primary hover:text-primary/80 underline"
            >
              try again
            </button>
          </p>
        </div>
        <div className="mt-8">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="space-y-6 text-center">
        <h1 className="font-display text-3xl text-white">Forgot your password?</h1>
        <p className="text-sm text-slate-300">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="you@mentorbridge.dev"
          />
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
          {isSubmitting ? 'Sending reset link…' : 'Send reset link'}
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