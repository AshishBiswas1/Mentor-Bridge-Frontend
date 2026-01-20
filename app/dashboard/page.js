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
import { Navbar } from '@/components/Navbar';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [studentsPanelOpen, setStudentsPanelOpen] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [studentsSession, setStudentsSession] = useState(null);
  

  // Session lists are empty by default — populate from backend/live session data
  const [activeSessions, setActiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedPagination, setCompletedPagination] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const mentorshipStats = useMemo(() => {
    const activeCount = activeSessions.length;
    // Use total from pagination if available, otherwise use array length
    const completedCount = completedPagination?.totalSessions ?? completedSessions.length;
    return { activeCount, completedCount };
  }, [activeSessions, completedSessions, completedPagination]);

  // Fetch mentor sessions (protected) using separate endpoints for active and ended sessions
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const token = user?.token;
        if (!token) {
          setActiveSessions([]);
          setCompletedSessions([]);
          return;
        }

        // Fetch active sessions (includes both 'pending' and 'active' status)
        const activeRes = await fetch(`${BASE}/session/active`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const activeJson = await activeRes.json().catch(() => null);

        // Fetch ended sessions (paginated)
        const endedRes = await fetch(`${BASE}/session/ended?page=${completedPage}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const endedJson = await endedRes.json().catch(() => null);
        
        // Store pagination info from response
        if (endedJson && endedJson.pagination) {
          setCompletedPagination(endedJson.pagination);
        }

        if (!mounted) return;

        // Process active sessions
        const activeSessions = (activeJson && activeJson.data) || [];
        const normalizedActive = (Array.isArray(activeSessions) ? activeSessions : []).map((s) => {
          // s expected: { id, link, status, started_at, ended_at, session_name }
          const started = s.started_at ? new Date(s.started_at) : null;
          const ended = s.ended_at ? new Date(s.ended_at) : null;
          const duration = started && ended ? (() => {
            const secs = Math.max(0, Math.floor((ended - started) / 1000));
            const mins = Math.floor(secs / 60);
            const remSecs = secs % 60;
            return `${mins}m ${remSecs}s`;
          })() : (started ? 'Scheduled' : '—');

          const startTime = started ? started.toLocaleString() : 'TBD';

          return {
            id: s.id,
            link: s.link,
            status: s.status || 'unknown',
            mentee: s.session_name || s.link || 'Session',
            topic: s.session_name || '',
            startTime,
            duration,
            progress: s.progress || 0,
            nextMilestone: s.nextMilestone || '',
            rating: s.rating || 0,
            completedDate: s.ended_at || null,
            outcome: s.outcome || '',
          };
        });

        // Process ended sessions
        const endedSessions = (endedJson && endedJson.data) || [];
        const normalizedEnded = (Array.isArray(endedSessions) ? endedSessions : []).map((s) => {
          const started = s.started_at ? new Date(s.started_at) : null;
          const ended = s.ended_at ? new Date(s.ended_at) : null;
          const duration = started && ended ? (() => {
            const secs = Math.max(0, Math.floor((ended - started) / 1000));
            const mins = Math.floor(secs / 60);
            const remSecs = secs % 60;
            return `${mins}m ${remSecs}s`;
          })() : '—';

          const startTime = started ? started.toLocaleString() : 'TBD';

          return {
            id: s.id,
            link: s.link,
            status: 'ended',
            mentee: s.session_name || s.link || 'Session',
            topic: s.session_name || '',
            startTime,
            duration,
            progress: 100,
            nextMilestone: '',
            rating: s.rating || 0,
            completedDate: s.ended_at || null,
            outcome: s.outcome || '',
          };
        });

        setActiveSessions(normalizedActive);
        setCompletedSessions(normalizedEnded);
      } catch (e) {
        setActiveSessions([]);
        setCompletedSessions([]);
      }
    };

    if (!loading && user) load();
    return () => { mounted = false; };
  }, [loading, user, completedPage]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 text-center"
        >
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 dark:border-white/10 border-t-primary" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Preparing your dashboard…</p>
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
    // prefer link-based navigation if possible
    if (!sessionId) return;
    router.push(`/session?link=${encodeURIComponent(sessionId)}`);
  };

  const rejoinSession = async (session) => {
    try {
      const token = user?.token;
      if (!token) {
        alert('Authentication required to rejoin session');
        return;
      }
      const link = session.link || session.id;
      const res = await fetch(`${BASE}/session/mentor-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ link }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || 'Failed to rejoin session';
        alert(msg);
        return;
      }

      // Navigate to session by link
      router.push(`/session?link=${encodeURIComponent(link)}`);
    } catch (e) {
      alert(e?.message || 'Network error while rejoining session');
    }
  };

  const closeStudentsPanel = () => {
    setStudentsPanelOpen(false);
    setStudentsList([]);
    setStudentsError('');
    setStudentsLoading(false);
    setStudentsSession(null);
  };

  const viewStudents = async (session) => {
    try {
      setStudentsSession(session);
      setStudentsPanelOpen(true);
      setStudentsLoading(true);
      setStudentsError('');
      setStudentsList([]);

      const token = user?.token;
      // Prefer the real UUID `session.id` (database id). If missing, fall back to link.
      const id = session.id || session.link;
      if (!id) {
        setStudentsError('Session id missing');
        setStudentsLoading(false);
        return;
      }

      const url = `${BASE}/user/sessionStudents?session_id=${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setStudentsError(json?.message || 'Failed to load students');
        setStudentsLoading(false);
        return;
      }

      const data = json && json.data ? json.data : [];
      setStudentsList(Array.isArray(data) ? data : []);
      setStudentsLoading(false);
    } catch (e) {
      setStudentsError(e?.message || 'Network error');
      setStudentsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-10 text-slate-900 dark:text-slate-100">
      <Navbar />
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-600 dark:text-white/50 font-fancy">Mentor Dashboard</p>
            <h1 className="mt-3 font-display text-4xl text-slate-900 dark:text-white">Welcome back, {user.name.split(' ')[0]}.</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-700 dark:text-slate-300">
              Manage your mentorship sessions, track progress with your mentees, and guide them towards their coding goals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="group flex items-center gap-2 self-start rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 dark:text-white transition hover:border-primary/40 hover:bg-slate-200 dark:hover:bg-primary/20"
            >
              Back
            </button>
            <button
              onClick={startSession}
              className="group flex items-center gap-2 self-start rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 dark:text-white transition hover:bg-primary/30"
            >
              <CodeBracketIcon className="h-5 w-5 text-primary transition group-hover:scale-110" />
              New Session
            </button>
            {/* Logout moved to global Navbar */}
          </div>
        </header>

        {/* Create Session Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-950/95 p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Create New Session</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Enter a name or topic for this collaborative session.</p>

              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Session name</label>
              <input
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 mb-4"
                placeholder="E.g. Python debugging with Alice"
              />

              {createError && <p className="text-xs text-red-400 mb-2">{createError}</p>}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300"
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
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/10 p-2">
                <ClockIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-white/60">Active Sessions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{mentorshipStats.activeCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-500/10 p-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-white/60">Completed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{mentorshipStats.completedCount}</p>
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
            className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-6 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl text-slate-900 dark:text-white flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-accent" />
                  Active Sessions
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Ongoing and scheduled mentorship sessions
                </p>
              </div>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">
                {activeSessions.length} active
              </span>
            </div>
            
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex">
                  <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/60 p-4 hover:border-primary/30 hover:bg-slate-200 dark:hover:bg-slate-950/80 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg text-slate-900 dark:text-white">{session.mentee}</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{session.topic}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Status hidden per UI requirement: show active & pending without status labels */}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-slate-600 dark:text-slate-400">
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
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{session.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-300 dark:bg-slate-800 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${session.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Next: {session.nextMilestone}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => joinSession(session.link || session.id)}
                          className="rounded-lg bg-primary/20 border border-primary/40 px-3 py-1 text-sm text-primary transition hover:bg-primary/30"
                        >
                          Open Session
                        </button>
                        <button
                          onClick={() => rejoinSession(session)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200"
                        >
                          Rejoin
                        </button>
                      </div>
                    </div>
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
          className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-6 shadow-xl backdrop-blur"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                Completed Sessions
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Recent mentorship sessions that have been completed
              </p>
            </div>
            <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs text-slate-700 dark:text-white/70">
              {completedPagination?.totalSessions ?? completedSessions.length} completed
            </span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {completedSessions.map((session) => (
              <div key={session.id} className="flex">
                <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg text-slate-900 dark:text-white">{session.mentee}</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{session.topic}</p>
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
                  
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>Completed {new Date(session.completedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>Duration: {session.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-slate-600 dark:text-slate-400">{session.duration}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewStudents(session)}
                        className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1 text-sm text-slate-700 dark:text-slate-200"
                      >
                        View Students
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {completedSessions.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/[0.02] p-6 text-center">
                <CheckCircleIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">No completed sessions yet</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Your completed mentorship sessions will appear here.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {completedPagination && completedPagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Page {completedPagination.currentPage} of {completedPagination.totalPages}
                {' '}({completedPagination.totalSessions} total sessions)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCompletedPage(prev => Math.max(1, prev - 1))}
                  disabled={!completedPagination.hasPrevPage}
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(completedPagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCompletedPage(i + 1)}
                      className={`h-8 w-8 rounded-lg text-sm transition ${
                        completedPage === i + 1
                          ? 'bg-primary text-white'
                          : 'border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCompletedPage(prev => Math.min(completedPagination.totalPages, prev + 1))}
                  disabled={!completedPagination.hasNextPage}
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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

        {/* Students slide-over panel (global) */}
        {studentsPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeStudentsPanel} />
            <div className="relative w-full max-w-2xl rounded-t-xl md:rounded-xl bg-slate-950/95 border border-white/10 p-6 m-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Students who joined</h3>
                  <p className="text-sm text-slate-400">Session: {studentsSession?.mentee || studentsSession?.link || studentsSession?.id}</p>
                </div>
                <div>
                  <button onClick={closeStudentsPanel} className="rounded-lg bg-white/5 px-3 py-1 text-sm text-slate-200">Close</button>
                </div>
              </div>

              <div className="mt-4">
                {studentsLoading && <p className="text-sm text-slate-400">Loading students…</p>}
                {studentsError && <p className="text-sm text-red-400">{studentsError}</p>}
                {!studentsLoading && !studentsError && studentsList.length === 0 && (
                  <p className="text-sm text-slate-400">No students found for this session.</p>
                )}

                {!studentsLoading && studentsList.length > 0 && (
                  <ul className="mt-3 space-y-3">
                    {studentsList.map((s, i) => (
                      <li key={i} className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white font-medium">{s.student_name || 'Student'}</p>
                            <p className="text-xs text-slate-400">{s.student_email || '—'}</p>
                          </div>
                          <div className="text-xs text-slate-400">{s.created_at ? new Date(s.created_at).toLocaleString() : ''}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
