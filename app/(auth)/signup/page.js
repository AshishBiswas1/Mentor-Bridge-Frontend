'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

const initialState = {
  name: '',
  email: '',
  password: '',
};

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
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

    const result = signup(form);
    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="space-y-6 text-center">
        <h1 className="font-display text-3xl text-white">Create your account</h1>
        <p className="text-sm text-slate-300">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80">
            Log in
          </Link>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ada Lovelace"
          />
        </div>
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
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="At least 6 characters"
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
          {isSubmitting ? 'Creating account…' : 'Sign up and continue'}
        </button>
      </form>
    </motion.div>
  );
}
