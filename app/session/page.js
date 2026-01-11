"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import { 
  PlayIcon, 
  StopIcon, 
  ShareIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';
import { monacoTheme } from '@/components/monaco-theme';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const INITIAL_CODE = `# Welcome to your coding session!
# Start coding together...

def hello(name):
    print(f"Hello, {name}! Ready to code?")


if __name__ == "__main__":
    hello("Mentor")
`;

// The editor language is fixed to Python for sessions

export default function SessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const link = searchParams.get('link');
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const { user, loading } = useAuth();
  const [guest, setGuest] = useState(null);
  const [code, setCode] = useState(INITIAL_CODE);
  const [language] = useState('python');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const codeRef = useRef(code);
  const emitTimeout = useRef(null);
  const incrementedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const remoteCursorsRef = useRef({}); // { senderId: {decorationIds: [], colorIndex} }
  const selectionListenerRef = useRef(null);

  // Decrement helpers: ensure we only call decrement once per client
  const decrementIfNeededSync = () => {
    try {
      const sid = sessionIdRef.current;
      if (incrementedRef.current && sid) {
        if (navigator && typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon(`${BASE}/session/decrement/${sid}`);
        } else {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${BASE}/session/decrement/${sid}`, false);
            xhr.send(null);
          } catch (e) {
            // ignore
          }
        }
        incrementedRef.current = false;
        sessionIdRef.current = null;
      }
    } catch (e) {}
  };

  const decrementIfNeeded = async () => {
    try {
      const sid = sessionIdRef.current;
      if (incrementedRef.current && sid) {
        if (navigator && typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon(`${BASE}/session/decrement/${sid}`);
        } else {
          await fetch(`${BASE}/session/decrement/${sid}`, { method: 'POST' }).catch(() => {});
        }
        incrementedRef.current = false;
        sessionIdRef.current = null;
      }
    } catch (e) {}
  };

  useEffect(() => {
    // allow access if the user is authenticated OR a guest has been stored locally
    if (!loading) {
      try {
        if (!user) {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem('mentor-bridge-guest') : null;
          if (raw) {
            try {
              setGuest(JSON.parse(raw));
            } catch (e) {
              setGuest({ name: String(raw) });
            }
            return; // guest present, allow access
          }
        }
      } catch (e) {
        // ignore storage errors
      }

      if (!user && !guest) {
        router.replace('/login');
      }
    }
  }, [loading, user, router]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    let interval;
    if (sessionStarted) {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Helper: construct participants list from session payload
  const buildParticipants = (s) => {
    const parts = [];
    if (!s) return parts;

    // Mentor: various possible field names
    const mentorName = s?.mentor_name || s?.mentor?.name || s?.mentorName || s?.creator?.name || s?.ownerName || (user && user.name) || (guest && guest.name) || null;
    if (mentorName) {
      parts.push({ id: s?.mentor?.id || s?.mentor_id || 'mentor', name: mentorName, role: 'mentor', active: true });
    }

    // Student single fields
    if (s?.student_name || s?.student_email) {
      const n = s.student_name || s.student_email || 'Student';
          parts.push({ id: s.student_email || `student-${Math.random().toString(36).slice(2,6)}`, name: n, role: 'student', active: true });
          }

          const guests = s?.guests || s?.participants || s?.students || [];
    if (Array.isArray(guests)) {
      guests.forEach((g) => {
        const n = g?.name || g?.guestName || g?.email || 'Student';
        parts.push({ id: g?.id || g?.email || `${n}-${Math.random().toString(36).slice(2,6)}`, name: n, role: g?.role || 'student', active: true });
      });
    }

    // Ensure mentor present if possible
    if (!parts.find((p) => p.role === 'mentor') && user && user.name) {
      parts.unshift({ id: user?.id || 'me', name: user.name, role: 'mentor', active: true });
    }

    // dedupe by id
    const seen = new Set();
    return parts.filter((p) => {
      if (!p || !p.id) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  };

  // Update sessionStarted/sessionTimer from session payload
  const updateSessionState = (s) => {
    if (!s) return;
    try {
      if (s.status === 'active') {
        setSessionStarted(true);
        // if backend provides started_at timestamp, compute elapsed seconds
        if (s.started_at) {
          const startedAt = Date.parse(s.started_at);
          if (!Number.isNaN(startedAt)) {
            const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
            setSessionTimer(seconds);
          }
        }
      } else {
        setSessionStarted(false);
        setSessionTimer(0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    // participants will be populated from real session data when available
  }, [user]);

  // Also update participants whenever `session` state changes (initial fetch)
  useEffect(() => {
    if (!session) return;
    try {
      setParticipants(buildParticipants(session));
    } catch (e) {}
  }, [session]);

  // Collaborative socket and session load
  useEffect(() => {
    if (!link) return;

    const socket = io(BASE);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-session', link);
    });

    socket.on('session-joined', (updated) => {
      const sessionData = Array.isArray(updated) ? updated[0] : updated;
      setSession(sessionData || null);
      if (sessionData && sessionData.code) {
        codeRef.current = sessionData.code;
        setCode(sessionData.code);
      }
      // refresh participants list when session data arrives
      try {
        setParticipants(buildParticipants(sessionData));
      } catch (e) {}
      // update active state/timer
      try {
        updateSessionState(sessionData);
      } catch (e) {}
    });

    socket.on('session-update', (updated) => {
      const sessionData = Array.isArray(updated) ? updated[0] : updated;
      setSession(sessionData || null);
      // refresh participants list when session updates
      try {
        setParticipants(buildParticipants(sessionData));
      } catch (e) {}
      // update active state/timer
      try {
        updateSessionState(sessionData);
      } catch (e) {}
    });

    // listen for remote cursor positions
    socket.on('cursor-position', (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        const sid = payload.senderId;
        if (!sid) return;
        // ignore our own emitted events
        if (socketRef.current && socketRef.current.id === sid) return;

        const pos = payload.position;
        if (!pos || !pos.lineNumber) return;

        // pick a consistent color index for this sender
        const pickIndex = (id) => {
          const colors = [0,1,2,3,4,5];
          let h = 0;
          for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
          return Math.abs(h) % colors.length;
        };

        const colorIndex = remoteCursorsRef.current[sid]?.colorIndex ?? pickIndex(String(sid));

        // build decoration class (must match injected CSS)
        const className = `remote-caret-${colorIndex}`;

        // prepare decoration
        if (editorRef.current && monacoRef.current) {
          const monaco = monacoRef.current;
          const range = new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
          const newDecor = [{ range, options: { afterContentClassName: className, stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowWhenTypingAtEdges } }];

          const prev = remoteCursorsRef.current[sid]?.decorationIds || [];
          try {
            const newIds = editorRef.current.deltaDecorations(prev, newDecor);
            remoteCursorsRef.current[sid] = { decorationIds: newIds, colorIndex };
          } catch (e) {
            // ignore errors from deltaDecorations
          }
        }
      } catch (e) {}
    });

    socket.on('code-change', (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        const incoming = payload.code || '';
        if (incoming !== codeRef.current) {
          codeRef.current = incoming;
          setCode(incoming);
        }
      } catch (e) {}
    });

    socket.on('run-start', (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        setIsRunning(true);
        setOutput('Running code...');
      } catch (e) {}
    });

    socket.on('run-result', (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        setIsRunning(false);
        const out = payload.data || payload;
        setOutput((out && (out.stdout || out.output || JSON.stringify(out))) || '');
      } catch (e) {}
    });

    socket.on('student-disconnected', () => {
      try {
        if (socket && typeof socket.disconnect === 'function') socket.disconnect();
      } catch (e) {}
      window.location.href = '/session-left';
    });

    socket.on('session-ended', () => {
      try {
        if (socket && typeof socket.disconnect === 'function') socket.disconnect();
      } catch (e) {}
      window.location.href = '/session-left';
    });

    // fetch session data from backend
    fetch(`${BASE}/session?link=${encodeURIComponent(link)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === 'success') {
          const sessionData = Array.isArray(data.data) ? data.data[0] : data.data;
          setSession(sessionData || null);
          if (sessionData && sessionData.code) {
            codeRef.current = sessionData.code;
            setCode(sessionData.code);
          }
          // update active state/timer from fetched session
          try { updateSessionState(sessionData); } catch (e) {}
          // increment participant count once per client
          if (sessionData && sessionData.id && !incrementedRef.current) {
            fetch(`${BASE}/session/increment/${sessionData.id}`, { method: 'POST' }).catch(() => {});
            incrementedRef.current = true;
            sessionIdRef.current = sessionData.id;
          }
        } else {
          setError((data && data.message) || 'Session not found');
        }
      })
      .catch(() => setError('Failed to load session'));

    return () => {
      try {
        if (socket && typeof socket.disconnect === 'function') socket.disconnect();
      } catch (e) {}
    };
  }, [link]);

  // ensure participant count is decremented on unload/unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      decrementIfNeededSync();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        // best-effort async decrement when the component unmounts
        decrementIfNeeded();
      } catch (e) {}
    };
  }, []);

  // Inject CSS for remote caret classes once and cleanup remote decorations/listener on unmount
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        const id = 'remote-caret-styles';
        if (!document.getElementById(id)) {
          const style = document.createElement('style');
          style.id = id;
          style.innerHTML = `
            .remote-caret-0::after { content: ''; display:inline-block; border-left:2px solid #FF6B6B; height:1em; margin-left:-2px; }
            .remote-caret-1::after { content: ''; display:inline-block; border-left:2px solid #6BCB77; height:1em; margin-left:-2px; }
            .remote-caret-2::after { content: ''; display:inline-block; border-left:2px solid #4D96FF; height:1em; margin-left:-2px; }
            .remote-caret-3::after { content: ''; display:inline-block; border-left:2px solid #FFD166; height:1em; margin-left:-2px; }
            .remote-caret-4::after { content: ''; display:inline-block; border-left:2px solid #9D4EDD; height:1em; margin-left:-2px; }
            .remote-caret-5::after { content: ''; display:inline-block; border-left:2px solid #00C2CA; height:1em; margin-left:-2px; }
          `;
          document.head.appendChild(style);
        }
      }
    } catch (e) {}

    return () => {
      try {
        // remove remote decorations
        if (editorRef.current) {
          Object.keys(remoteCursorsRef.current || {}).forEach((sid) => {
            const prev = remoteCursorsRef.current[sid]?.decorationIds || [];
            try { editorRef.current.deltaDecorations(prev, []); } catch (e) {}
          });
        }
        // dispose selection listener
        if (selectionListenerRef.current && typeof selectionListenerRef.current.dispose === 'function') {
          try { selectionListenerRef.current.dispose(); } catch (e) {}
        }
      } catch (e) {}
    };
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditorChange = (value) => {
    const v = value || '';
    setCode(v);
    codeRef.current = v;

    // debounce emits to avoid flooding
    try {
      if (emitTimeout.current) clearTimeout(emitTimeout.current);
      emitTimeout.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('code-change', { link, code: v });
        }
      }, 200);
    } catch (e) {}
  };

  const handleEditorDidMount = (editor, monaco) => {
    // store refs for later use
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define our custom theme
    monaco.editor.defineTheme('mentor-bridge-dark', monacoTheme);
    monaco.editor.setTheme('mentor-bridge-dark');

    // Listen for cursor/selection changes and emit cursor position to peers
    try {
      if (editor && typeof editor.onDidChangeCursorSelection === 'function') {
        selectionListenerRef.current = editor.onDidChangeCursorSelection((e) => {
          try {
            const pos = e.selection.getPosition();
            if (!pos) return;
            const payload = {
              link,
              senderId: socketRef.current?.id || null,
              name: (typeof window !== 'undefined' && window.localStorage.getItem('mentor-bridge-guest')) ? (JSON.parse(window.localStorage.getItem('mentor-bridge-guest') || '{}')?.name) : (null),
              position: { lineNumber: pos.lineNumber, column: pos.column },
            };
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('cursor-position', payload);
            }
          } catch (e) {}
        });
      }
    } catch (e) {}
  };

  // Language selection removed — sessions use Python by default

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');

    // notify others that a run has started
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('run-start', { link });
      }
    } catch (e) {}

    try {
      const res = await fetch(`${BASE}/editor/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeRef.current, language, link, sessionId: session?.id }),
      });
      const data = await res.json().catch(() => null);

      // Normalize backend response shapes. Backend may return { status, data } or raw object.
      const payload = (data && data.status === 'success' && data.data) ? data.data : data;

      // If payload is a string, show it directly
      if (typeof payload === 'string') {
        setOutput(payload);
      } else if (payload && typeof payload === 'object') {
        // Prefer stdout, then output, then result
        const stdout = payload.stdout || payload.output || payload.result || payload.message;
        const stderr = payload.stderr;
        if (typeof stdout === 'string' && stdout.length > 0) {
          // Normalize CRLF to LF for display
          const text = stdout.replace(/\r\n/g, '\n');
          setOutput(text);
        } else if (typeof stderr === 'string' && stderr.length > 0) {
          setOutput(stderr.replace(/\r\n/g, '\n'));
        } else {
          // Fallback: show a friendly render of known fields
          const parts = [];
          if (payload.actor) parts.push(`Run by: ${payload.actor}`);
          if (payload.stdout) parts.push(String(payload.stdout).replace(/\\r\\n/g, '\\n'));
          if (payload.stderr) parts.push(String(payload.stderr).replace(/\\r\\n/g, '\\n'));
          if (parts.length > 0) setOutput(parts.join('\n'));
          else setOutput(JSON.stringify(payload, null, 2));
        }
      } else {
        setOutput('No output');
      }

      // broadcast result to other participants
      try {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('run-result', { link, data });
        }
      } catch (e) {}
    } catch (error) {
      setOutput(`Error running code: ${error?.message || String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const startSession = () => {
    setSessionStarted(true);
    setSessionTimer(0);
  };

  const leaveSession = async () => {
    // call backend leave endpoint and decrement participant count, then navigate away
    try {
      const token = user?.token;
      if (session && session.id) {
        try {
          await fetch(`${BASE}/session/leave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ sessionId: session.id, link }),
          }).catch(() => {});
        } catch (e) {}

        // best-effort decrement (single shared helper) — await so it completes before navigation
        try {
          await decrementIfNeeded();
        } catch (e) {}
      }

      try {
        if (socketRef.current && typeof socketRef.current.disconnect === 'function') {
          socketRef.current.disconnect();
        }
      } catch (e) {}
    } finally {
      setSessionStarted(false);
      setSessionTimer(0);
      router.push('/session-left');
    }
  };

  const shareSession = () => {
    // open the share modal so mentor can copy the session-join link
    setShowShareModal(true);
  };

  if (loading || (!user && !guest)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 text-center"
        >
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
          <p className="text-sm text-slate-400">Loading session...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Back button removed */}
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <CodeBracketIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">Coding Session</h1>
                <p className="text-xs text-slate-400">
                  {sessionStarted ? `Active • ${formatTime(sessionTimer)}` : 'Not started'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Participants */}
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">{participants.length} participants</span>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Copy code removed */}
              <button
                onClick={shareSession}
                className="rounded-full border border-white/10 bg-white/10 p-2 transition hover:border-primary/40 hover:bg-primary/20"
                title="Share session"
              >
                <ShareIcon className="h-4 w-4" />
              </button>
              <button
                onClick={leaveSession}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950/95 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Share Session</h3>
            <p className="text-sm text-slate-400 mb-4">Copy the join link for students to join the session.</p>

            <div className="mb-4">
              <label className="text-xs text-slate-300">Session link</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={(() => {
                    try {
                      const token = (session && session.link) || link || '';
                      const origin = typeof window !== 'undefined' ? window.location.origin : '';
                      return origin ? `${origin}/session-join?link=${encodeURIComponent(token)}` : `session-join?link=${token}`;
                    } catch (e) {
                      return '';
                    }
                  })()}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <button
                  onClick={() => {
                    try {
                      const token = (session && session.link) || link || '';
                      const origin = typeof window !== 'undefined' ? window.location.origin : '';
                      const url = origin ? `${origin}/session-join?link=${encodeURIComponent(token)}` : `session-join?link=${token}`;
                      navigator.clipboard.writeText(url);
                    } catch (e) {}
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Participants Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-slate-950/60 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Participants</h3>
              <p className="text-xs text-slate-400">Active in this session</p>
            </div>
            
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-xs font-semibold text-white">
                        {participant.name.charAt(0)}
                      </div>
                      {participant.active && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-950" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{participant.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{participant.role}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Invite button removed — sharing handled elsewhere */}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col">
          {/* Editor Controls */}
          <div className="flex h-12 items-center justify-between border-b border-white/10 bg-slate-950/40 px-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg border border-white/20 bg-slate-900 px-3 py-1 text-sm text-white">
                Python
              </div>
            </div>
            
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <StopIcon className="h-4 w-4" />
                  Running...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Run Code
                </>
              )}
            </button>
          </div>

          {/* Editor and Output */}
          <div className="flex flex-1 flex-col">
            {/* Code Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="mentor-bridge-dark"
                options={{
                  fontSize: 14,
                  fontFamily: 'Fira Code, Monaco, Consolas, monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: true,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'line',
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                  },
                }}
              />
            </div>

            {/* Output Panel (moved below the editor) */}
            <div className="border-t border-white/10 bg-slate-950/60 h-48">
              <div className="border-b border-white/10 bg-slate-950/40 p-3">
                <h3 className="text-sm font-semibold text-white">Output</h3>
              </div>
              <div className="h-full overflow-y-auto p-4">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {output || 'Click "Run Code" to see output...'}
                </pre>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}