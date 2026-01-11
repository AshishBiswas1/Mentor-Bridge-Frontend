'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function SessionJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Cleanup stray server-injected attributes that can cause hydration warnings
  // (some environments inject `fdprocessedid` into inputs). Remove them on mount.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      const els = document.querySelectorAll('[fdprocessedid]');
      els.forEach((el) => el.removeAttribute('fdprocessedid'));
    } catch (e) {
      // ignore
    }
  }, []);

  // Prefill link from URL query parameter if present
  useEffect(() => {
    try {
      const q = searchParams?.get?.('link') || '';
      if (q) setLink(q);
    } catch (e) {
      // ignore
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !link.trim()) {
      setError('Please provide your name, email and the session link.');
      return;
    }

    setIsSubmitting(true);

    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const payload = { link: link.trim(), student_name: name.trim(), student_email: email.trim() };

    try {
      const res = await fetch(`${base}/session/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || 'Failed to join session');
        setIsSubmitting(false);
        return;
      }

      // Persist guest info locally for the session page to pick up
      try {
        const guest = { name: name.trim(), email: email.trim(), joinedAt: Date.now() };
        window.localStorage.setItem('mentor-bridge-guest', JSON.stringify(guest));
      } catch (err) {
        // ignore storage errors
      }

      // Prefer backend-returned link if provided
      const returned = json?.data || null;
      let targetLink = link.trim();
      if (returned) {
        if (typeof returned === 'string') targetLink = returned;
        else if (returned.link) targetLink = returned.link;
        else if (Array.isArray(returned) && returned[0] && returned[0].link) targetLink = returned[0].link;
      }

      // Navigate to session page (internal) if path-like, otherwise full URL
      const lower = targetLink.toLowerCase();
      if (lower.startsWith('http://') || lower.startsWith('https://')) {
        window.location.href = targetLink;
      } else {
        // ensure correct query param path: /session?link=...
        const encoded = encodeURIComponent(targetLink);
        router.push(`/session?link=${encoded}`);
      }
    } catch (e) {
      setError(e?.message || 'Network error');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6"
    >
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <h1 className="font-display text-2xl text-white mb-2">Join a Session</h1>
        <p className="text-sm text-slate-400 mb-6">Enter your details and the session link to join as a student.</p>

        <form suppressHydrationWarning onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase text-white/60">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-2 w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-white/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-white/60">Session link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/session?id=xxxxx or https://example.com/session/xxxxx"
              className="mt-2 w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Joining…' : 'Join Session'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default function SessionJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <SessionJoinContent />
    </Suspense>
  );
}
