'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeftOnRectangleIcon, 
  CodeBracketIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  

  // Session lists are empty by default — populate from backend/live session data
  const [activeSessions, setActiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const mentorshipStats = useMemo(() => {
    const activeCount = activeSessions.filter(s => s.status === 'ongoing').length;
    const completedCount = completedSessions.length;
    return { activeCount, completedCount };
  }, [activeSessions, completedSessions]);

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

  

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const startSession = () => {
    // open create session modal for mentor
    setShowCreateModal(true);
  };

  const joinSession = (sessionId) => {
    router.push(`/session?id=${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Mentor Dashboard</p>
            <h1 className="mt-3 font-display text-4xl text-white">Welcome back, {user.name.split(' ')[0]}.</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Manage your mentorship sessions, track progress with your mentees, and guide them towards their coding goals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startSession}
              className="group flex items-center gap-2 self-start rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary/30"
            >
              <CodeBracketIcon className="h-5 w-5 text-primary transition group-hover:scale-110" />
              New Session
            </button>
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-primary/40 hover:bg-primary/20"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 text-primary transition group-hover:translate-x-0.5" />
              Log out
            </button>
          </div>
        </header>

        {/* Create Session Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-2xl bg-slate-950/95 p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-2">Create New Session</h3>
              <p className="text-sm text-slate-400 mb-4">Enter a name or topic for this collaborative session.</p>

              <label className="block text-sm text-slate-300 mb-2">Session name</label>
              <input
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 mb-4"
                placeholder="E.g. Python debugging with Alice"
              />

              {createError && <p className="text-xs text-red-400 mb-2">{createError}</p>}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setCreateError('');
                    if (!newSessionName || newSessionName.trim().length < 3) {
                      setCreateError('Please enter a session name (3+ characters).');
                      return;
                    }
                    setCreating(true);
                    try {
                      const token = user?.token;
                      const res = await fetch(`${BASE}/session/create`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ name: newSessionName.trim() }),
                      });
                      const json = await res.json().catch(() => null);
                      if (!res.ok) {
                        setCreateError(json?.message || 'Failed to create session');
                        setCreating(false);
                        return;
                      }

                      // backend may return session in json.data or json.session
                      const s = json?.data || json?.session || json;
                      // try to resolve a link or id to navigate
                      const link = s?.link || s?.id || (Array.isArray(s) && s[0]?.link) || null;
                      setShowCreateModal(false);
                      setNewSessionName('');
                      setCreating(false);
                      if (link) {
                        router.push(`/session?link=${encodeURIComponent(link)}`);
                      } else {
                        // fallback: open generic session route
                        router.push('/session');
                      }
                    } catch (e) {
                      setCreateError(e?.message || 'Network error');
                      setCreating(false);
                    }
                  }}
                  disabled={creating}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create Session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mentor Stats Overview */}
        <section className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/10 p-2">
                <ClockIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Active Sessions</p>
                <p className="text-2xl font-bold text-white">{mentorshipStats.activeCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-500/10 p-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Completed</p>
                <p className="text-2xl font-bold text-white">{mentorshipStats.completedCount}</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Active Sessions */}
        <section className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl text-white flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-accent" />
                  Active Sessions
                </h2>
                <p className="text-sm text-slate-300">
                  Ongoing and scheduled mentorship sessions
                </p>
              </div>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">
                {activeSessions.length} active
              </span>
            </div>
            
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 hover:border-primary/30 hover:bg-slate-950/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg text-white">{session.mentee}</h3>
                      <p className="text-sm text-slate-300">{session.topic}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'ongoing' && (
                        <span className="rounded-full bg-green-500/10 border border-green-500/40 px-2 py-1 text-xs text-green-400">
                          Live
                        </span>
                      )}
                      {session.status === 'scheduled' && (
                        <span className="rounded-full bg-yellow-500/10 border border-yellow-500/40 px-2 py-1 text-xs text-yellow-400">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{session.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>{session.duration}</span>
                    </div>
                  </div>

                  {session.progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{session.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${session.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Next: {session.nextMilestone}
                    </p>
                    <button
                      onClick={() => joinSession(session.id)}
                      className="rounded-lg bg-primary/20 border border-primary/40 px-3 py-1 text-sm text-primary transition hover:bg-primary/30"
                    >
                      {session.status === 'ongoing' ? 'Join Session' : 'Start Session'}
                    </button>
                  </div>
                </div>
              ))}

              {activeSessions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
                  <ClockIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 mb-2">No active sessions</p>
                  <p className="text-xs text-slate-400">Schedule a session or start mentoring someone new.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions removed */}
        </section>

        {/* Completed & Ending Sessions */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45, ease: 'easeOut' }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl text-white flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                Completed Sessions
              </h2>
              <p className="text-sm text-slate-300">
                Recent mentorship sessions that have been completed
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
              {completedSessions.length} completed
            </span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {completedSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg text-white">{session.mentee}</h3>
                    <p className="text-sm text-slate-300">{session.topic}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${i < session.rating ? 'text-yellow-400' : 'text-slate-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-400 mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>Completed {new Date(session.completedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Duration: {session.duration}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300 bg-slate-950/60 rounded-lg p-3 border border-white/10">
                  <span className="text-accent font-medium">Outcome:</span> {session.outcome}
                </p>
              </div>
            ))}

            {completedSessions.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
                <CheckCircleIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300 mb-2">No completed sessions yet</p>
                <p className="text-xs text-slate-400">Your completed mentorship sessions will appear here.</p>
              </div>
            )}
          </div>
        </motion.section>
        
        {/* Legacy Connections (if any exist) */}
        {user.connections && user.connections.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45, ease: 'easeOut' }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl text-white">Your Mentees</h2>
                <p className="text-sm text-slate-300">People you are currently mentoring</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
                {user.connections.length} mentee{user.connections.length === 1 ? '' : 's'}
              </span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.connections.map((person) => (
                <div
                  key={person.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <h3 className="font-display text-lg text-white">{person.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{person.email}</p>
                  {person.goal && (
                    <p className="text-sm text-slate-300 mb-4 bg-slate-950/60 rounded-lg p-3 border border-white/10">
                      <span className="text-accent font-medium">Goal:</span> {person.goal}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                      Added {new Date(person.createdAt).toLocaleDateString()}
                    </p>
                    <button className="rounded-lg bg-primary/20 border border-primary/40 px-3 py-1 text-xs text-primary transition hover:bg-primary/30">
                      Start Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
