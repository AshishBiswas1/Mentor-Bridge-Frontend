'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeftOnRectangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';

const initialConnection = {
  name: '',
  email: '',
  goal: '',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout, addConnection } = useAuth();
  const [connection, setConnection] = useState(initialConnection);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const connectionCount = useMemo(() => user?.connections?.length ?? 0, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 text-center"
        >
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
          <p className="text-sm text-slate-400">Preparing your dashboard…</p>
        </motion.div>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setConnection((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddConnection = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!connection.name || !connection.email) {
      setError('Please provide a name and email.');
      return;
    }

    const result = addConnection(connection);
    if (!result.success) {
      setError(result.message || 'Could not add person.');
      return;
    }

    setSuccess('Person added to your mentorship circle.');
    setConnection(initialConnection);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Dashboard</p>
            <h1 className="mt-3 font-display text-4xl text-white">Welcome back, {user.name.split(' ')[0]}.</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Here is a snapshot of your mentorship journey. Keep the momentum going by inviting collaborators and tracking your sessions below.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-primary/40 hover:bg-primary/20"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 text-primary transition group-hover:translate-x-0.5" />
            Log out
          </button>
        </header>
        <section className="grid gap-6 md:grid-cols-[2fr,3fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Profile</p>
                <h2 className="mt-3 font-display text-2xl text-white">{user.name}</h2>
                <p className="mt-1 text-sm text-slate-300">{user.email}</p>
              </div>
              <div className="rounded-3xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent">
                {connectionCount} mentee{connectionCount === 1 ? '' : 's'}
              </div>
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Member since</dt>
                <dd className="mt-2 font-medium text-white">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Last session</dt>
                <dd className="mt-2 font-medium text-white">This week</dd>
              </div>
            </dl>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <PlusIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl text-white">Add a mentee or collaborator</h2>
                <p className="text-sm text-slate-300">
                  Keep track of the people you are supporting. We will store them locally for quick access.
                </p>
              </div>
            </div>
            <form onSubmit={handleAddConnection} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60" htmlFor="connection-name">
                    Name
                  </label>
                  <input
                    id="connection-name"
                    name="name"
                    value={connection.name}
                    onChange={handleChange}
                    placeholder="Jamie Chen"
                    className="w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60" htmlFor="connection-email">
                    Email
                  </label>
                  <input
                    id="connection-email"
                    name="email"
                    type="email"
                    value={connection.email}
                    onChange={handleChange}
                    placeholder="jamie@build.dev"
                    className="w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60" htmlFor="connection-goal">
                  Focus area
                </label>
                <textarea
                  id="connection-goal"
                  name="goal"
                  rows={3}
                  value={connection.goal}
                  onChange={handleChange}
                  placeholder="Set up their TypeScript tooling and CI/CD pipeline."
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/80 px-4 py-3 text-sm text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {error && (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs text-accent">
                  {success}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
              >
                Add person
              </button>
            </form>
          </motion.div>
        </section>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-white">Mentorship circle</h2>
              <p className="text-sm text-slate-300">
                Track who you are mentoring or learning with. Stored locally on this device.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
              {connectionCount} total
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {user.connections && user.connections.length > 0 ? (
              user.connections.map((person) => (
                <div
                  key={person.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <h3 className="font-display text-lg text-white">{person.name}</h3>
                  <p className="text-xs text-slate-400">{person.email}</p>
                  {person.goal && <p className="mt-3 text-sm text-slate-300">{person.goal}</p>}
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-white/40">
                    Added {new Date(person.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-sm text-slate-300">
                You have not added anyone yet. Use the form above to organize the people you are supporting.
              </p>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
