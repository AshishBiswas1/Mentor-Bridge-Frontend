'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

const initialState = {
  email: '',
  password: '',
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = await login(form.email, form.password);
    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    router.replace('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="space-y-6 text-center">
        <h1 className="font-display text-3xl text-white">Welcome back</h1>
        <p className="text-sm text-slate-300">
          New to Mentor Bridge?{' '}
          <Link href="/signup" className="text-primary hover:text-primary/80">
            Create an account
          </Link>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60"
            >
              Password
            </label>
            <Link 
              href="/forgot-password"
              className="text-xs text-slate-300 hover:text-primary transition"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Your password"
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
          {isSubmitting ? 'Checking credentials…' : 'Log in'}
        </button>
      </form>
    </motion.div>
  );
}
