'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeftOnRectangleIcon, 
  PlusIcon, 
  CodeBracketIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
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

  // Mock data for mentor dashboard
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 1,
      mentee: 'Sarah Johnson',
      topic: 'React Hooks & State Management',
      startTime: '2:00 PM',
      duration: '1h 30m',
      status: 'ongoing',
      progress: 75,
      nextMilestone: 'Build todo app component'
    },
    {
      id: 2,
      mentee: 'Alex Chen',
      topic: 'Algorithm Design & Problem Solving',
      startTime: '4:00 PM',
      duration: '1h',
      status: 'scheduled',
      progress: 0,
      nextMilestone: 'Binary search implementation'
    },
  ]);

  const [completedSessions, setCompletedSessions] = useState([
    {
      id: 3,
      mentee: 'Maya Patel',
      topic: 'JavaScript Fundamentals',
      completedDate: '2026-01-08',
      duration: '2h',
      outcome: 'Successfully built first web app',
      rating: 5
    },
    {
      id: 4,
      mentee: 'James Wilson',
      topic: 'Git & Version Control',
      completedDate: '2026-01-07',
      duration: '1h 15m',
      outcome: 'Mastered branching and merging',
      rating: 4
    },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const mentorshipStats = useMemo(() => {
    const totalMentees = (user?.connections?.length ?? 0) + activeSessions.length;
    const activeCount = activeSessions.filter(s => s.status === 'ongoing').length;
    const completedCount = completedSessions.length;
    const totalHours = completedSessions.reduce((acc, session) => {
      const hours = parseFloat(session.duration.replace('h', '').replace('m', '')) || 1;
      return acc + hours;
    }, 0);
    
    return {
      totalMentees,
      activeCount,
      completedCount,
      totalHours: Math.round(totalHours)
    };
  }, [user, activeSessions, completedSessions]);

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

  const startSession = () => {
    router.push('/session');
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

        {/* Mentor Stats Overview */}
        <section className="grid gap-6 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <UserGroupIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total Mentees</p>
                <p className="text-2xl font-bold text-white">{mentorshipStats.totalMentees}</p>
              </div>
            </div>
          </motion.div>
          
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

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-yellow-500/10 p-2">
                <ChartBarIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Hours Mentored</p>
                <p className="text-2xl font-bold text-white">{mentorshipStats.totalHours}</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Active Sessions */}
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
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

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <PlusIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl text-white">Add New Mentee</h2>
                <p className="text-sm text-slate-300">Expand your mentorship circle</p>
              </div>
            </div>
            
            <form onSubmit={handleAddConnection} className="space-y-4">
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
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60" htmlFor="connection-goal">
                  Learning Goal
                </label>
                <textarea
                  id="connection-goal"
                  name="goal"
                  rows={3}
                  value={connection.goal}
                  onChange={handleChange}
                  placeholder="Master React fundamentals and build first portfolio project"
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
                Add Mentee
              </button>
            </form>
          </motion.div>
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
