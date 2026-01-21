"use client";

import { useEffect, useState, useRef, useMemo, Suspense, memo } from 'react';
import ReactDOM from 'react-dom';
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
  ChatBubbleLeftRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { monacoThemeDark, monacoThemeLight } from '@/components/monaco-theme';

// Camera and Mic toggle buttons with WebRTC controls
function CameraButton({ isEnabled, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isEnabled}
      title={isEnabled ? 'Turn camera off' : 'Turn camera on'}
      className={`flex h-12 w-12 items-center justify-center rounded-full ${isEnabled ? 'bg-green-600/80 hover:bg-green-600 dark:bg-green-600/80 dark:hover:bg-green-600' : 'bg-red-600/80 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-600'} text-white transition disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isEnabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 7h7a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M8 5h7a2 2 0 012 2v6a2 2 0 01-2 2h-1" />
        </svg>
      )}
    </button>
  );
}

function MicButton({ isEnabled, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isEnabled}
      title={isEnabled ? 'Mute mic' : 'Unmute mic'}
      className={`flex h-12 w-12 items-center justify-center rounded-full ${isEnabled ? 'bg-green-600/80 hover:bg-green-600 dark:bg-green-600/80 dark:hover:bg-green-600' : 'bg-red-600/80 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-600'} text-white transition disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isEnabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v11m0 0a3 3 0 003-3V5a3 3 0 10-6 0v4a3 3 0 003 3zM19 11a7 7 0 01-14 0" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9 5v6a3 3 0 006 0v-1" />
        </svg>
      )}
    </button>
  );
}

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const INITIAL_CODE = `# Welcome to your coding session!
# Start coding together...

def hello(name):
    print(f"Hello, {name}! Ready to code?")


if __name__ == "__main__":
    hello("Mentor")
`;

function SessionPageContent() {

  // Router, auth and URL params
  const router = useRouter();
  const searchParams = useSearchParams();
  const link = (searchParams && typeof searchParams.get === 'function') ? (searchParams.get('link') || searchParams.get('session')) : null;

  // Auth (include loading to avoid ReferenceError)
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Core refs and state used throughout the component
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const selectionListenerRef = useRef(null);
  const remoteCursorsRef = useRef({});

  const socketRef = useRef(null);
  const signalSocketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localParticipantNameRef = useRef(null);
  const userRef = useRef(null);
  const sessionRef = useRef(null);
  const sessionJsonRef = useRef(null);
  const chatStudentNameRef = useRef(null);
  const chatInputRef = useRef(null);
  const participantsRef = useRef([]);
  const participantsJsonRef = useRef(null);
  const isMentorRef = useRef(false);
  const iceCandidatesQueue = useRef([]);
  const presenceRef = useRef({});
  const incrementedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const isNegotiatingRef = useRef(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteMutedRef = useRef(true);
  const activeStreamRef = useRef(null); // Track actual hardware stream for reliable cleanup
  const isInitializingRef = useRef(false); // Lock to prevent race conditions

  const codeRef = useRef(INITIAL_CODE);
  const emitTimeout = useRef(null);
  const typingEmitRef = useRef(0);

  const [guest, setGuest] = useState(null);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLeft, setParticipantsLeft] = useState(new Set());
  const [code, setCode] = useState(INITIAL_CODE);
  const [codeLoaded, setCodeLoaded] = useState(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatVisible, setChatVisible] = useState(false);

  // Keep refs in sync with latest state so external socket handlers can read current values
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  
  // Update Monaco editor theme when global theme changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'mentor-bridge-dark' : 'mentor-bridge-light');
    }
  }, [theme]);
  
  // Autofocus chat input when the floating chat panel is opened
  useEffect(() => {
    if (chatVisible) {
      try { setTimeout(() => { chatInputRef.current?.focus(); }, 50); } catch (e) {}
    }
  }, [chatVisible]);
  
  // Chat portal component: renders chat UI into document.body to avoid stacking-context issues
  const ChatPortal = useMemo(() => memo((props) => {
    const { chatVisible, setChatVisible, messages, chatInput, setChatInput, chatInputRef, session, link, chatStudentNameRef, user, guest, socketRef, setMessages } = props;
    const [el, setEl] = useState(null);
    const createdRef = useRef(false);

    useEffect(() => {
      try {
        // Reuse existing container if present to avoid DOM churn when parent re-mounts
        let container = document.getElementById('floating-chat-root');
        if (!container) {
          container = document.createElement('div');
          container.setAttribute('id', 'floating-chat-root');
          document.body.appendChild(container);
          createdRef.current = true;
        }
        setEl(container);
        return () => {
          try {
            if (createdRef.current && container && container.parentNode) {
              container.parentNode.removeChild(container);
            }
          } catch (e) {}
        };
      } catch (e) {
        return undefined;
      }
    }, []);

    // Restore focus/selection on the chat input if messages update and the input lost focus.
    useEffect(() => {
      if (!chatVisible) return;
      try {
        const elInput = chatInputRef?.current;
        if (!elInput) return;
        if (document.activeElement !== elInput) {
          const start = elInput.selectionStart ?? 0;
          const end = elInput.selectionEnd ?? start;
          elInput.focus();
          try { elInput.setSelectionRange(start, end); } catch (e) {}
        }
      } catch (e) {}
    }, [messages, chatVisible]);

    const chatBox = useMemo(() => (
      <div>
        {!chatVisible ? (
          <button
            type="button"
            onClick={() => setChatVisible(true)}
            aria-label="Open chat"
            className="fixed bottom-6 right-6 pointer-events-auto flex items-center gap-2 bg-primary px-4 py-3 rounded-full shadow-lg text-white"
            style={{ zIndex: 9999 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H7l-5 3V5z" />
            </svg>
            <span className="sr-only">Open chat</span>
          </button>
        ) : (
          <div className="fixed right-6 pointer-events-auto w-80 border border-slate-300 dark:border-white/10 bg-white/95 dark:bg-slate-950/60 p-4 flex flex-col rounded-lg shadow-xl" style={{ zIndex: 9999, top: '7.5rem', bottom: '3.5rem' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Chat</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Session chat</p>
              </div>
              <button
                type="button"
                onClick={() => setChatVisible(false)}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white ml-2"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-slate-900/40 p-3">
              <div className="flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="text-xs text-slate-600 dark:text-slate-400">No messages yet</div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <div className="text-xs text-slate-600 dark:text-slate-400">{m.user}</div>
                      <div className="mt-1 rounded-md bg-slate-200 dark:bg-slate-800/60 px-3 py-2 text-slate-900 dark:text-slate-100">{m.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2" onMouseDown={(e) => { try { e.stopPropagation(); if (chatInputRef.current) chatInputRef.current.focus(); } catch (e) {} }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  ref={chatInputRef}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const text = chatInput && chatInput.trim();
                      if (!text) return;
                      const sessionId = session?.id || link;
                      const canonicalRoom = session?.link || session?.id || link;
                      const studentName = chatStudentNameRef.current || session?.student_name || link;
                      const userName = (user && (user.name || user.email)) || (guest && guest.name) || 'participant';
                      const payload = { sessionId, studentName, user: userName, content: text, type: 'text', link: session?.link || link, room: canonicalRoom };
                      try {
                        setMessages((prev) => [...prev, { id: `local-${Date.now()}`, user: userName, content: text, type: 'text', created_at: new Date().toISOString() }]);
                        if (socketRef.current && socketRef.current.connected) socketRef.current.emit('sendMessage', payload);
                      } catch (e) {}
                      setChatInput('');
                    }
                  }}
                  onMouseDown={(e) => { try { e.stopPropagation(); if (chatInputRef.current) chatInputRef.current.focus(); } catch (e) {} }}
                  onFocus={(e) => { try { e.stopPropagation(); } catch (e) {} }}
                  autoFocus={false}
                  tabIndex={0}
                  style={{ zIndex: 70, position: 'relative', pointerEvents: 'auto' }}
                  className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
                {/* focus-restorer runs in hook above; nothing to render here */}
                <button
                  type="button"
                  onClick={() => {
                    const text = chatInput && chatInput.trim();
                    if (!text) return;
                    const sessionId = session?.id || link;
                    const canonicalRoom = session?.link || session?.id || link;
                    const studentName = chatStudentNameRef.current || session?.student_name || link;
                    const userName = (user && (user.name || user.email)) || (guest && guest.name) || 'participant';
                    const payload = { sessionId, studentName, user: userName, content: text, type: 'text', link: session?.link || link, room: canonicalRoom };
                    try {
                      setMessages((prev) => [...prev, { id: `local-${Date.now()}`, user: userName, content: text, type: 'text', created_at: new Date().toISOString() }]);
                      if (socketRef.current && socketRef.current.connected) socketRef.current.emit('sendMessage', payload);
                    } catch (e) {}
                    setChatInput('');
                  }}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                  style={{ pointerEvents: 'auto', zIndex: 70 }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ), [chatVisible, messages, chatInput, setChatVisible, setChatInput, chatInputRef, session, link, chatStudentNameRef, user, guest, socketRef, setMessages]);

    if (!el) return null;

    return ReactDOM.createPortal(chatBox, el);
  }), []);
  // Invoke ChatPortal once at top level to ensure the component is stable
  // Note: isMentorRef is synced after `isMentor` is declared to avoid temporal dead zone
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [error, setError] = useState(null);
  const [showNewLinkModal, setShowNewLinkModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [generatingNewLink, setGeneratingNewLink] = useState(false);
  const [language, setLanguage] = useState('python');

  // Synchronous best-effort decrement for unload handlers
  const decrementIfNeededSync = () => {
    try {
      const sid = sessionIdRef.current;
      if (incrementedRef.current && sid) {
        if (navigator && typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon(`${BASE}/session/decrement/${sid}`);
        } else {
          // fire-and-forget
          fetch(`${BASE}/session/decrement/${sid}`, { method: 'POST' }).catch(() => {});
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

  // Determine whether current authenticated user is the mentor for this session
  const isMentor = useMemo(() => {
    try {
      if (!user || !session) return false;
      const uid = user.id || user._id || null;
      if (!uid) return false;
      if (session.mentor_id && String(session.mentor_id) === String(uid)) return true;
      if (session.mentor && session.mentor.id && String(session.mentor.id) === String(uid)) return true;
      if (session.creator && session.creator.id && String(session.creator.id) === String(uid)) return true;
      if (session.mentor_email && user.email && session.mentor_email === user.email) return true;
      if (session.mentor_name && user.name && session.mentor_name === user.name) return true;
      return false;
    } catch (e) { 
      return false; 
    }
  }, [user, session]);

  // Keep isMentorRef in sync after `isMentor` is available
  useEffect(() => { isMentorRef.current = isMentor; }, [isMentor]);

  // Keep remote muted ref in sync so handlers inside PC can read latest value
  useEffect(() => {
    remoteMutedRef.current = remoteMuted;
    try {
      if (remoteVideoRef.current) remoteVideoRef.current.muted = !!remoteMuted;
    } catch (e) {}
  }, [remoteMuted]);

  // Helper: Save code to localStorage for this session
  const saveCodeToStorage = (sessionLink, codeContent) => {
    try {
      if (typeof window !== 'undefined' && sessionLink) {
        const storageKey = `mentor-bridge-code-${sessionLink}`;
        localStorage.setItem(storageKey, codeContent);
      }
    } catch (e) {
      // Failed to save code to localStorage
    }
  };

  // Helper: Load code from localStorage for this session
  const loadCodeFromStorage = (sessionLink) => {
    try {
      if (typeof window !== 'undefined' && sessionLink) {
        const storageKey = `mentor-bridge-code-${sessionLink}`;
        return localStorage.getItem(storageKey);
      }
    } catch (e) {
      // Failed to load code from localStorage
    }
    return null;
  };

  // Helper: Create a video stream with participant's initial for when camera is off
  const createBlackVideoStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Fill with dark background
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get LOCAL participant's name (the one who turned off the camera)
    let localName = '';
    if (session) {
      // If current user is mentor, show mentor's name, otherwise show student's name
      const currentUserIsMentor = isMentorRef.current;
      if (currentUserIsMentor) {
        localName = session.mentor_name || user?.name || 'M';
      } else {
        localName = session.student_name || guest?.name || user?.name || 'S';
      }
    }
    
    // Draw circular background for the initial
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    // Create gradient for circle
    const gradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    gradient.addColorStop(0, '#2563eb'); // primary blue
    gradient.addColorStop(1, '#7c3aed'); // accent purple
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw the initial letter
    const initial = localName.charAt(0).toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, centerX, centerY);
    
    const stream = canvas.captureStream(30); // 30 FPS stream
    return stream;
  };

  // WebRTC Helper Functions
  const initializeMedia = async () => {
    // Prevent duplicate calls - check if we already have an active stream
    if (activeStreamRef.current) {
      return activeStreamRef.current;
    }

    // Lock to prevent race conditions from simultaneous calls
    if (isInitializingRef.current) {
      // Wait for the in-progress initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return activeStreamRef.current || initializeMedia();
    }

    isInitializingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      stream.getTracks().forEach(track => {
        track.enabled = true;
      });
      
      // Store in ref for reliable access
      activeStreamRef.current = stream;
      setLocalStream(stream);
      
      // Attach to local video element immediately
      if (localVideoRef.current) {
        const video = localVideoRef.current;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(e => console.log('Local video autoplay failed:', e));
        };
      }
      
      isInitializingRef.current = false;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // Try audio only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        activeStreamRef.current = audioStream;
        setLocalStream(audioStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = audioStream;
        }
        setCameraEnabled(false);
        isInitializingRef.current = false;
        return audioStream;
      } catch (audioError) {
        console.error('Error accessing audio:', audioError);
        isInitializingRef.current = false;
        return null;
      }
    }
  };

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);

    // NOTE: Do not pre-create transceivers here — let addTrack()/createOffer()/createAnswer()
    // establish m-lines dynamically. Pre-creating transceivers can accidentally lock
    // directions and lead to muted receivers if the timing differs between peers.

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const payload = { link, candidate: event.candidate };
        if (signalSocketRef.current && signalSocketRef.current.connected) {
          const room = (session && (session.link || session.id)) || link;
          signalSocketRef.current.emit('ice-candidate', { room, ...payload });
        } else if (socketRef.current) {
          socketRef.current.emit('ice-candidate', payload);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected') {
        
      } else if (pc.iceConnectionState === 'failed') {
        
      }
    };

    pc.ontrack = (event) => {
      const trackKind = event.track ? event.track.kind : 'unknown';
      
      
      if (event.streams && event.streams[0]) {
        const tracks = event.streams[0].getTracks();
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        const s = new MediaStream([event.track]);
        setRemoteStream(s);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        isNegotiatingRef.current = false;
      } else if (pc.connectionState === 'failed') {
        setIsConnecting(false);
        isNegotiatingRef.current = false;
      } else if (pc.connectionState === 'disconnected') {
        
        setIsConnecting(false);
        isNegotiatingRef.current = false;
      }
    };

    return pc;
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      // Use activeStreamRef for most reliable current stream
      let stream = activeStreamRef.current || localStream;
      if (!stream) {
        stream = await initializeMedia();
      }
      if (!stream) {
        setIsConnecting(false);
        return;
      }

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add mentor's local tracks to peer connection
      
      stream.getTracks().forEach(track => {
        try {
          // Ensure track is enabled and check muted state
          track.enabled = true;
          
          pc.addTrack(track, stream);
        } catch (e) {
          // Failed to add track
        }
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      isNegotiatingRef.current = true;

      // Prefer signaling namespace for multi-room support
      try {
        const room = (session && (session.link || session.id)) || link;
        if (signalSocketRef.current && signalSocketRef.current.connected) {
          signalSocketRef.current.emit('offer', { room, link, offer: pc.localDescription });
        } else if (socketRef.current) {
          socketRef.current.emit('webrtc-offer', { link, offer: pc.localDescription });
        }
      } catch (e) { /* Failed to send offer */ }
    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      isNegotiatingRef.current = false;
    }
  };

  const handleWebRTCOffer = async (payload) => {
    try {
      
      // Accept offers that match either the link field or the room field
      const room = (session && (session.link || session.id)) || link;
      const matches = payload && (payload.link === link || payload.room === room || payload.link === room);
      if (!payload || !matches) {
        return;
      }
      
      setIsConnecting(true);
      
      // Use activeStreamRef for most reliable current stream
      let stream = activeStreamRef.current || localStream;
      if (!stream) {
        stream = await initializeMedia();
      }
      if (!stream) {
        setIsConnecting(false);
        return;
      }

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Set remote description FIRST (required for proper negotiation)
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        try {
          // Ensure track is enabled and check muted state
          track.enabled = true;
          
          pc.addTrack(track, stream);
        } catch (e) {
          // Failed to add track
        }
      });

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      try {
        const room = (session && (session.link || session.id)) || link;
        if (signalSocketRef.current && signalSocketRef.current.connected) {
          signalSocketRef.current.emit('answer', { room, link, answer: pc.localDescription });
        } else if (socketRef.current) {
          socketRef.current.emit('webrtc-answer', { link, answer: pc.localDescription });
        }
      } catch (e) { /* Failed to send answer */ }

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          // Error adding queued ICE candidate
        }
      }
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
      setIsConnecting(false);
      isNegotiatingRef.current = false;
    }
  };

  const handleWebRTCAnswer = async (payload) => {
    try {
      
      const room = (session && (session.link || session.id)) || link;
      const matches = payload && (payload.link === link || payload.room === room || payload.link === room);
      if (!payload || !matches) {
        return;
      }
      
      const pc = peerConnectionRef.current;
      if (!pc) return;

      // Only process answer if we're in a state that expects one
      if (pc.signalingState !== 'have-local-offer') {
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      isNegotiatingRef.current = false;

      // Diagnostic: log receivers and their track states immediately after setting remote description
      try {
        const receivers = pc.getReceivers ? pc.getReceivers() : [];
        receivers.forEach((r, i) => {
          const t = r && r.track;
        });
      } catch (e) {
        // Could not inspect receivers
      }

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          // Error adding queued ICE candidate
        }
      }
      
      // pc.ontrack will fire automatically - no need to manually check for tracks
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  };

  const handleICECandidate = async (payload) => {
    try {
      const room = (session && (session.link || session.id)) || link;
      const matches = payload && (payload.link === link || payload.room === room || payload.link === room);
      if (!payload || !matches) {
        return;
      }
      
      const pc = peerConnectionRef.current;
      
      if (!pc || !pc.remoteDescription) {
        // Queue the candidate if peer connection isn't ready
        iceCandidatesQueue.current.push(payload.candidate);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleCamera = async () => {
    const pc = peerConnectionRef.current;

    if (cameraEnabled) {
      // Turn camera OFF - Stop ALL tracks from BOTH state AND ref to handle async race conditions
      
      // 1. Collect ALL video tracks from both sources (handles state/ref sync issues)
      const allVideoTracks = [
        ...(localStream ? localStream.getVideoTracks() : []),
        ...(activeStreamRef.current ? activeStreamRef.current.getVideoTracks() : [])
      ];
      
      // Remove duplicates by track ID
      const uniqueTracks = Array.from(
        new Map(allVideoTracks.map(track => [track.id, track])).values()
      );
      
      // 2. Stop ALL tracks immediately (Hardware Level Release)
      uniqueTracks.forEach(track => {
        track.stop();
        track.enabled = false;
      });

      // 3. Clear ALL video DOM element references (DOM Level Release)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      // 4. Create black stream for both local UI and remote peer
      const currentStream = activeStreamRef.current || localStream;
      const audioTracks = currentStream ? currentStream.getAudioTracks() : [];
      const blackStream = createBlackVideoStream();
      const blackVideoTrack = blackStream.getVideoTracks()[0];
      const newStream = new MediaStream([...audioTracks, blackVideoTrack]);

      // 5. Send black video to remote peer so they see black screen
      if (pc && blackVideoTrack) {
        const senders = pc.getSenders();
        const vSender = senders.find(s => s.track?.kind === 'video');
        if (vSender) {
          await vSender.replaceTrack(blackVideoTrack);
        }
      }

      // 6. Update both ref and state with new stream (keeps audio active)
      activeStreamRef.current = newStream;
      setLocalStream(newStream);
      setCameraEnabled(false);
    } else {
      // Turn camera ON - acquire new video track and replace in peer connection
      try {
        // Acquire fresh camera stream with quality constraints
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: false 
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];

        if (!newVideoTrack) {
          throw new Error('No video track obtained from camera');
        }

        // Enable the track immediately
        newVideoTrack.enabled = true;

        // Create NEW stream (don't mutate existing) to ensure clean state
        const currentStream = activeStreamRef.current || localStream;
        if (currentStream) {
          // Stop and remove old black video track
          const oldVideoTracks = currentStream.getVideoTracks();
          oldVideoTracks.forEach(track => {
            track.stop();
          });
          
          // Create completely NEW stream with audio + real video
          const audioTracks = currentStream.getAudioTracks();
          const newStream = new MediaStream([...audioTracks, newVideoTrack]);
          
          // Update BOTH ref and state - CRITICAL!
          activeStreamRef.current = newStream;
          setLocalStream(newStream);
        } else {
          // No existing stream, create new one with just video
          const newStream = new MediaStream([newVideoTrack]);
          activeStreamRef.current = newStream;
          setLocalStream(newStream);
        }

        // Replace track in peer connection (no renegotiation needed with replaceTrack)
        if (pc) {
          const senders = pc.getSenders ? pc.getSenders() : [];
          // Find video sender by checking track kind or by checking the transceiver media type
          const videoSender = senders.find(s => {
            if (s.track && s.track.kind === 'video') return true;
            // Check transceiver to see if this sender is for video (even if track is null)
            const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
            const transceiver = transceivers.find(t => t.sender === s);
            return transceiver && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === 'video';
          });

          if (videoSender && typeof videoSender.replaceTrack === 'function') {
            // replaceTrack doesn't require renegotiation
            await videoSender.replaceTrack(newVideoTrack);
          } else {
            // Fallback: add track if no sender exists (requires renegotiation)
            pc.addTrack(newVideoTrack, localStream);
            
            if (!isNegotiatingRef.current) {
              isNegotiatingRef.current = true;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              const room = (session && (session.link || session.id)) || link;
              if (signalSocketRef.current && signalSocketRef.current.connected) {
                signalSocketRef.current.emit('offer', { room, link, offer: pc.localDescription });
              } else if (socketRef.current) {
                socketRef.current.emit('webrtc-offer', { link, offer: pc.localDescription });
              }
            }
          }
        }

        setCameraEnabled(true);

      } catch (error) {
        console.error('Error restarting camera:', error);
        alert('Failed to access camera. Please check permissions.');
      }
    }
  };

  const toggleMic = async () => {
    const pc = peerConnectionRef.current;
    
    if (micEnabled) {
      // Turn mic OFF - stop audio track and replace with null in peer connection
      try {
        const currentStream = activeStreamRef.current || localStream;
        if (currentStream) {
          // Stop ALL audio tracks to fully release microphone hardware
          const audioTracks = currentStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.stop(); // This releases the hardware
            track.enabled = false;
          });
            
            // Replace with null in peer connection to stop sending audio
            if (pc) {
              const senders = pc.getSenders ? pc.getSenders() : [];
              const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
              if (audioSender && typeof audioSender.replaceTrack === 'function') {
                await audioSender.replaceTrack(null);
              }
            }
            
            // Create new stream without audio for consistency
            const videoTracks = currentStream.getVideoTracks();
            const newStream = new MediaStream([...videoTracks]);
            activeStreamRef.current = newStream;
            setLocalStream(newStream);
            setMicEnabled(false);
        }
      } catch (e) {
        console.error('Error muting mic:', e);
      }
    } else {
      // Turn mic ON - acquire new audio track and replace in peer connection
      try {
        // Acquire fresh microphone stream
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const newAudioTrack = audioStream.getAudioTracks()[0];

        if (!newAudioTrack) {
          throw new Error('No audio track obtained from microphone');
        }

        // Create new stream with audio + existing video tracks
        const currentStream = activeStreamRef.current || localStream;
        const videoTracks = currentStream ? currentStream.getVideoTracks() : [];
        const newStream = new MediaStream([...videoTracks, newAudioTrack]);
        
        // Update both ref and state
        activeStreamRef.current = newStream;
        setLocalStream(newStream);

        // Replace track in peer connection (no renegotiation needed with replaceTrack)
        if (pc) {
          const senders = pc.getSenders ? pc.getSenders() : [];
          // Find audio sender by checking track kind or by checking the transceiver media type
          const audioSender = senders.find(s => {
            if (s.track && s.track.kind === 'audio') return true;
            // Check transceiver to see if this sender is for audio (even if track is null)
            const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
            const transceiver = transceivers.find(t => t.sender === s);
            return transceiver && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === 'audio';
          });

          if (audioSender && typeof audioSender.replaceTrack === 'function') {
            // replaceTrack doesn't require renegotiation
            await audioSender.replaceTrack(newAudioTrack);
          } else {
            // Fallback: add track if no sender exists (requires renegotiation)
            pc.addTrack(newAudioTrack, localStream || new MediaStream([newAudioTrack]));

            if (!isNegotiatingRef.current) {
              isNegotiatingRef.current = true;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              const room = (session && (session.link || session.id)) || link;
              if (signalSocketRef.current && signalSocketRef.current.connected) {
                signalSocketRef.current.emit('offer', { room, link, offer: pc.localDescription });
              } else if (socketRef.current) {
                socketRef.current.emit('webrtc-offer', { link, offer: pc.localDescription });
              }
            }
          }
        }

        setMicEnabled(true);

      } catch (e) {
        console.error('Error enabling mic:', e);
        alert('Failed to access microphone. Please check permissions.');
      }
    }
  };

  const cleanupWebRTC = () => {
    // Stop ALL tracks from BOTH state AND ref to handle any zombie streams
    const allTracks = [
      ...(localStream ? localStream.getTracks() : []),
      ...(activeStreamRef.current ? activeStreamRef.current.getTracks() : [])
    ];
    
    // Remove duplicates by track ID
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    );
    
    // Stop all unique tracks
    uniqueTracks.forEach(track => {
      track.stop(); // Stop hardware
      track.enabled = false;
    });
    
    // Clear ALL video element references
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear all stream references
    activeStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
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

    // Separate signaling namespace for multi-room video signaling
    try {
      const signal = io(BASE + '/signal');
      signalSocketRef.current = signal;
    } catch (e) {
      // Failed to connect to signaling namespace
    }

    socket.on('connect', () => {
      socket.emit('join-session', link);
    });

    socket.on('session-joined', (updated) => {
      const sessionData = Array.isArray(updated) ? updated[0] : updated;
      try {
        const serialized = JSON.stringify(sessionData || {});
        if (sessionJsonRef.current !== serialized) {
          sessionJsonRef.current = serialized;
          setSession(sessionData || null);
        }
      } catch (e) {
        setSession(sessionData || null);
      }
      
      // When session is joined, ensure current user is not in participantsLeft
      const localIsMentor = isMentorRef.current;
      const currentRole = localIsMentor ? 'mentor' : 'student';
      setParticipantsLeft((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentRole);
        return newSet;
      });
      
      // Join signaling room for video calls when session data is available
      try {
        const room = (sessionData && (sessionData.link || sessionData.id)) || link;
        const name = (user && (user.name || user.email)) || (guest && guest.name) || 'participant';
          if (signalSocketRef.current && room) {
              // persist the local display name so role-checking can fallback to name matches
              try { localParticipantNameRef.current = name; } catch (e) {}
              signalSocketRef.current.emit('joinRoom', { room, studentName: name });
          }

          // Determine a stable studentName for chat room membership. Prefer session's student_name when available,
          // otherwise fall back to the session link so both mentor and student compute the same identifier.
          const chatStudentName = (sessionData && (sessionData.student_name || sessionData.studentName)) || link;
          chatStudentNameRef.current = chatStudentName;

          // Join chat room on the main socket namespace using a canonical room key (session.link || session.id || query link)
          try {
            if (socketRef.current && room) {
              const canonicalRoom = (sessionData && (sessionData.link || sessionData.id)) || link || room;
              socketRef.current.emit('joinSession', { sessionId: sessionData?.id || canonicalRoom, studentName: chatStudentName, user: name, link: sessionData?.link || link, room: canonicalRoom });
            }
          } catch (e) {}
      } catch (e) {}
      
      // Load code with priority: localStorage > backend > INITIAL_CODE
      if (!codeLoaded) {
        const savedCode = loadCodeFromStorage(link);
        if (savedCode) {
          // Prioritize saved code from localStorage (user's last edit)
          codeRef.current = savedCode;
          setCode(savedCode);
        } else if (sessionData && sessionData.code) {
          // Fallback to backend code if available
          codeRef.current = sessionData.code;
          setCode(sessionData.code);
        }
        // If neither exists, keep INITIAL_CODE (already set in useState)
        setCodeLoaded(true);
      }
      
      // refresh participants list when session data arrives
      try {
        const built = buildParticipants(sessionData);
        const pSerialized = JSON.stringify(built || []);
        if (participantsJsonRef.current !== pSerialized) {
          participantsJsonRef.current = pSerialized;
          setParticipants(built);
        }
      } catch (e) {}
      // update active state/timer
      try {
        updateSessionState(sessionData);
      } catch (e) {}
    });

    socket.on('session-update', (updated) => {
      const sessionData = Array.isArray(updated) ? updated[0] : updated;
      
      // Always update session state to ensure UI reflects latest data
      sessionJsonRef.current = JSON.stringify(sessionData || {});
      setSession(sessionData || null);

      // Check if student has rejoined and remove them from participantsLeft
      if (sessionData?.student_name) {
        setParticipantsLeft((prev) => {
          const newSet = new Set(prev);
          newSet.delete('student');
          return newSet;
        });
      }

      // refresh participants list when session updates
      const built = buildParticipants(sessionData);
      participantsJsonRef.current = JSON.stringify(built || []);
      setParticipants(built);

      // Apply any explicit presence overrides we've received from sockets
      // If mentor/student left, remove them from the list (don't just mark inactive)
      try {
        const pres = presenceRef.current || { mentorPresent: null, studentPresent: null };
        if (pres.mentorPresent === false) {
          setParticipants((prev) => prev.filter((p) => p.role !== 'mentor'));
        }
        if (pres.studentPresent === false) {
          setParticipants((prev) => prev.filter((p) => p.role !== 'student'));
        }
      } catch (e) {}
      
      // update active state/timer
      try {
        updateSessionState(sessionData);
      } catch (e) {}
    });

    // Participant left handler (emitted by backend on leave)
    socket.on('participant-left', (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        const { role } = payload;
        if (!role) return;

        // Track that this role has left so we can hide them in the UI
        setParticipantsLeft((prev) => new Set(prev).add(role));
        
        // Clean up WebRTC connection when participant leaves so we can reconnect when they rejoin
        try {
          cleanupWebRTC();
        } catch (e) {
          console.error('Error cleaning up WebRTC on participant leave:', e);
        }
      } catch (e) {}
    });

    // Mentor joined handler - mark mentor active and request session update
    socket.on('mentor-joined', async (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        
        // Remove mentor from the left set so they show up again
        setParticipantsLeft((prev) => {
          const newSet = new Set(prev);
          newSet.delete('mentor');
          return newSet;
        });

        // Fetch latest session data to refresh UI
        try {
          const resp = await fetch(`${BASE}/session?link=${encodeURIComponent(link)}`);
          const json = await resp.json().catch(() => null);
          const sessionData = json && json.status === 'success' ? (Array.isArray(json.data) ? json.data[0] : json.data) : null;
          if (sessionData) {
            try {
              const serialized = JSON.stringify(sessionData || {});
              if (sessionJsonRef.current !== serialized) {
                sessionJsonRef.current = serialized;
                setSession(sessionData);
              }
            } catch (e) {
              setSession(sessionData);
            }
            
            // Rebuild participants list to ensure rejoined mentor is displayed
            try {
              const built = buildParticipants(sessionData);
              const pSerialized = JSON.stringify(built || []);
              if (participantsJsonRef.current !== pSerialized) {
                participantsJsonRef.current = pSerialized;
                setParticipants(built);
              }
            } catch (e) {}
            
            try { updateSessionState(sessionData); } catch (e) {}
          }
        } catch (e) {
          // ignore fetch errors
        }

        // If current user is student and mentor rejoined, initiate WebRTC connection
        const currentRole = sessionStorage.getItem('userRole');
        if (currentRole === 'student') {
          // Clean up any existing connection first
          cleanupWebRTC();
          
          // Wait a bit for mentor's socket listeners to be ready
          await new Promise(res => setTimeout(res, 500));
          
          // Initiate new WebRTC connection to the rejoined mentor
          try {
            await startCall();
          } catch (e) {
            console.error('Failed to initiate call to rejoined mentor:', e);
          }
        }
      } catch (e) {}
    });

    // Generic participant joined handler - remove role from left set and refresh session
    socket.on('participant-joined', async (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        const { role } = payload || {};
        if (!role) return;

        // Remove the role from the left set so they show up again
        setParticipantsLeft((prev) => {
          const newSet = new Set(prev);
          newSet.delete(role);
          return newSet;
        });

        // If this is a student rejoining and current user is mentor, initiate WebRTC connection
        const localIsMentor = isMentorRef.current;
        if (localIsMentor && role === 'student') {
          try {
            // Clean up any existing connection first
            cleanupWebRTC();
            
            // Ensure media is ready
            if (!activeStreamRef.current) {
              await initializeMedia();
            }
            
            // Give the student a moment to set up their socket listeners
            setTimeout(() => {
              try {
                startCall();
              } catch (e) {
                console.error('Error starting call after participant joined:', e);
              }
            }, 500);
          } catch (e) {
            console.error('Error handling participant rejoin:', e);
          }
        }

        // Fetch latest session data to refresh UI (participant name may be present there)
        try {
          const resp = await fetch(`${BASE}/session?link=${encodeURIComponent(link)}`);
          const json = await resp.json().catch(() => null);
          const sessionData = json && json.status === 'success' ? (Array.isArray(json.data) ? json.data[0] : json.data) : null;
          if (sessionData) {
            // Always update session state when participant joins to ensure student name is displayed
            sessionJsonRef.current = JSON.stringify(sessionData || {});
            setSession(sessionData);
            
            // Rebuild participants list to ensure rejoined student is displayed
            try {
              const built = buildParticipants(sessionData);
              participantsJsonRef.current = JSON.stringify(built || []);
              setParticipants(built);
            } catch (e) {}
            
            try { updateSessionState(sessionData); } catch (e) {}
          }
        } catch (e) {
          // ignore fetch errors
        }
      } catch (e) {}
    });

    // listen for remote cursor positions (support both 'cursor-position' and 'cursor-change' events)
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

    // Also accept server-relayed 'cursor-change' events for compatibility with backend
    socket.on('cursor-change', (payload) => {
      try {
        if (!payload || payload.link !== link) return;
        const sid = payload.senderId;
        if (!sid) return;
        if (socketRef.current && socketRef.current.id === sid) return;

        const pos = payload.position;
        if (!pos || !pos.lineNumber) return;

        const pickIndex = (id) => {
          const colors = [0,1,2,3,4,5];
          let h = 0;
          for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
          return Math.abs(h) % colors.length;
        };

        const colorIndex = remoteCursorsRef.current[sid]?.colorIndex ?? pickIndex(String(sid));
        const className = `remote-caret-${colorIndex}`;

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
          // Save received code changes to localStorage
          saveCodeToStorage(link, incoming);
        }
      } catch (e) {}
    });

    // Chat message received from server (either from DB insert or relay)
    socket.on('receiveMessage', (msg) => {
      try {
        if (!msg) return;
        // Normalize message object shape
        const normalized = {
          id: msg.id || msg._id || `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          user: msg.user_name || msg.user || msg.userName || 'participant',
          content: msg.content || msg.message || msg.text || '',
          type: msg.type || 'text',
          created_at: msg.created_at || new Date().toISOString(),
        };
        // Ignore system messages (join/leave) so they are not shown in chat
        if (normalized.type === 'system' || String(normalized.user).toLowerCase() === 'system') return;
        // Also ignore common join/leave content patterns
        const lc = String(normalized.content || '').toLowerCase();
        if (lc.includes(' joined the session') || lc.includes(' left the session') || lc.includes('joined the chat') || lc.includes('left the chat')) return;

        setMessages((prev) => [...prev, normalized]);
      } catch (e) {}
    });

    socket.on('errorMessage', (payload) => {
      try {
        // Optionally show errors to user — for now, ignore or could display toast
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

    // WebRTC signaling listeners
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('ice-candidate', handleICECandidate);

    // Also listen on the signaling namespace (if present)
    if (signalSocketRef.current) {
      const s = signalSocketRef.current;
      s.on('connect', () => {
        // join a room specific to this session when signaling socket connects
        try {
          const room = (session && (session.link || session.id)) || link;
          const name = (user && (user.name || user.email)) || (guest && guest.name) || 'participant';
          if (room) s.emit('joinRoom', { room, studentName: name });
        } catch (e) {}
      });

      s.on('offer', handleWebRTCOffer);
      s.on('answer', handleWebRTCAnswer);
      s.on('ice-candidate', handleICECandidate);
      
      // When another participant joins, mentor should initiate the call immediately
      s.on('participant-ready', async (payload) => {
        
        try {
          const localIsMentor = isMentorRef.current;
          const pc = peerConnectionRef.current;
          const isNeg = isNegotiatingRef.current;

          if (localIsMentor && !pc && !isNeg) {
            // Ensure media is ready before starting call - use activeStreamRef for consistency
            if (!activeStreamRef.current) {
              await initializeMedia();
            }
            startCall();
          }
        } catch (e) {
          // Error in participant-ready
        }
      });
    }

    // fetch session data from backend
    fetch(`${BASE}/session?link=${encodeURIComponent(link)}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data && data.status === 'success') {
          const sessionData = Array.isArray(data.data) ? data.data[0] : data.data;
          setSession(sessionData || null);
          
          // Load code with priority: Database > localStorage > INITIAL_CODE
          if (!codeLoaded && sessionData && sessionData.id) {
            try {
              // First try to fetch from database
              const codeRes = await fetch(`${BASE}/editor/getCode?session_id=${encodeURIComponent(sessionData.id)}`);
              const codeJson = await codeRes.json().catch(() => null);
              
              if (codeRes.ok && codeJson?.data?.code) {
                // Use database code if available
                codeRef.current = codeJson.data.code;
                setCode(codeJson.data.code);
                // Also save to localStorage for offline access
                saveCodeToStorage(link, codeJson.data.code);
              } else {
                // Fallback to localStorage
                const savedCode = loadCodeFromStorage(link);
                if (savedCode) {
                  codeRef.current = savedCode;
                  setCode(savedCode);
                }
                // If neither exists, keep INITIAL_CODE (already set in useState)
              }
            } catch (e) {
              // On error, try localStorage
              const savedCode = loadCodeFromStorage(link);
              if (savedCode) {
                codeRef.current = savedCode;
                setCode(savedCode);
              }
            }
            setCodeLoaded(true);
          }
          
          // update active state/timer from fetched session
          try { updateSessionState(sessionData); } catch (e) {}
          
          // Check if we just changed the link (to avoid double increment)
          let skipIncrement = false;
          try {
            const linkChanged = sessionStorage.getItem('mentor-bridge-link-changed');
            if (linkChanged === 'true') {
              skipIncrement = true;
              sessionStorage.removeItem('mentor-bridge-link-changed');
            }
          } catch (e) {
            // ignore
          }
          
          // increment participant count once per client (unless we just changed the link)
          if (!skipIncrement && sessionData && sessionData.id && !incrementedRef.current) {
            fetch(`${BASE}/session/increment/${sessionData.id}`, { method: 'POST' }).catch(() => {});
            incrementedRef.current = true;
            sessionIdRef.current = sessionData.id;
          } else if (skipIncrement && sessionData && sessionData.id) {
            // Still set the refs even if we skip increment
            incrementedRef.current = true;
            sessionIdRef.current = sessionData.id;
          }
        } else {
          setError((data && data.message) || 'Session not found');
        }
      })
      .catch((err) => setError(err?.message || 'Network error. Please check your connection and try again.'));

    return () => {
      try {
        if (socket && typeof socket.disconnect === 'function') socket.disconnect();
      } catch (e) {}
      try {
        if (signalSocketRef.current && typeof signalSocketRef.current.disconnect === 'function') signalSocketRef.current.disconnect();
      } catch (e) {}
      cleanupWebRTC();
    };
  }, [link]);

  // Initialize WebRTC media eagerly when session is loaded
  useEffect(() => {
    const setupMedia = async () => {
      // Initialize media if we don't have an active stream
      if (!activeStreamRef.current) {
        try {
          await initializeMedia();
        } catch (err) {
          console.error('Failed to initialize media:', err);
          return;
        }
      }

      // After media is ready (or already available), signal to other participants
      const localIsMentor = isMentorRef.current;
      const room = (session && (session.link || session.id)) || link;
      
      if (signalSocketRef.current && signalSocketRef.current.connected && room) {
        // Emit participant-ready so other side knows to initiate/accept connections
        signalSocketRef.current.emit('participant-ready', { room, role: localIsMentor ? 'mentor' : 'student' });
      }
    };

    if (session && link) {
      setupMedia();
    }

    return () => {
      // Cleanup on unmount - use activeStreamRef for reliable cleanup
      const currentStream = activeStreamRef.current;
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        activeStreamRef.current = null;
      }
    };
  }, [session, link]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      const video = localVideoRef.current;
      video.srcObject = localStream;
      // Use onloadedmetadata to avoid AbortError
      video.onloadedmetadata = () => {
        video.play().catch(e => console.log('Local video play failed:', e));
      };
    }
  }, [localStream]);

  // Combined useEffect for remoteStream to prevent flickering and AbortError
  useEffect(() => {
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      
      if (remoteStream) {
        // Diagnostic: check track states
        const tracks = remoteStream.getTracks();
        
        // Add event listeners to tracks for when they end (camera/mic turned off)
        tracks.forEach(track => {
          if (track.kind === 'video') {
            track.onended = () => {
              // When remote video track ends, show black screen instead of frozen frame
              if (remoteVideoRef.current) {
                const blackStream = createBlackVideoStream();
                remoteVideoRef.current.srcObject = blackStream;
                remoteVideoRef.current.play().catch(err => console.error('Error playing black stream:', err));
              }
            };
          }
        });
        
        try {
          // Apply muted state and set stream
          video.muted = remoteMuted;
          video.srcObject = remoteStream;
          
          // Play immediately without waiting for metadata
          video.play().catch(err => {
            console.error('❌ Remote video play failed:', err.message);
          });
        } catch (e) {
          console.error('❌ Error in remoteStream useEffect:', e.message);
        }
      } else {
        // No remote stream - show black canvas instead of frozen frame
        const blackStream = createBlackVideoStream();
        video.srcObject = blackStream;
        video.play().catch(err => console.error('Error playing black stream:', err));
      }
    }
  }, [remoteStream, remoteMuted]);

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
        // dispose selection listener and any content listener attached to it
        if (selectionListenerRef.current) {
          try {
            if (typeof selectionListenerRef.current.dispose === 'function') selectionListenerRef.current.dispose();
          } catch (e) {}
          try {
            const contentListener = selectionListenerRef.current && selectionListenerRef.current._contentListener;
            if (contentListener && typeof contentListener.dispose === 'function') contentListener.dispose();
          } catch (e) {}
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

    // Save code to localStorage for persistence across sessions
    saveCodeToStorage(link, v);

    // Emit code changes immediately for real-time collaboration
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('code-change', { link, code: v });
      }
    } catch (e) {}

    // Debounce database saves to avoid excessive requests
    try {
      if (emitTimeout.current) clearTimeout(emitTimeout.current);
      emitTimeout.current = setTimeout(() => {
        // Auto-save to database (debounced to avoid excessive saves)
        if (session && session.id) {
          fetch(`${BASE}/editor/saveCode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: v, session_id: session.id })
          }).catch(() => {
            // Silent fail - localStorage is the fallback
          });
        }
        emitTimeout.current = null;
      }, 2000); // 2 second debounce for database auto-save only
    } catch (e) {}
  };

  const handleEditorDidMount = (editor, monaco) => {
    // store refs for later use
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define our custom themes
    monaco.editor.defineTheme('mentor-bridge-dark', monacoThemeDark);
    monaco.editor.defineTheme('mentor-bridge-light', monacoThemeLight);
    
    // Set theme based on current theme state
    monaco.editor.setTheme(theme === 'dark' ? 'mentor-bridge-dark' : 'mentor-bridge-light');

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
              // Emit both local and server-compatible event names to ensure delivery
              socketRef.current.emit('cursor-position', payload);
              socketRef.current.emit('cursor-change', payload);
            }
          } catch (e) {}
        });

        // Also emit position while typing so others see a live typing caret
        try {
          const contentListener = editor.onDidChangeModelContent(() => {
            try {
              const now = Date.now();
              if (now - (typingEmitRef.current || 0) < 120) return; // throttle to ~120ms
              typingEmitRef.current = now;
              const pos = editor.getPosition();
              if (!pos) return;
              const payload = {
                link,
                senderId: socketRef.current?.id || null,
                name: (typeof window !== 'undefined' && window.localStorage.getItem('mentor-bridge-guest')) ? (JSON.parse(window.localStorage.getItem('mentor-bridge-guest') || '{}')?.name) : (null),
                position: { lineNumber: pos.lineNumber, column: pos.column },
              };
              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('cursor-change', payload);
              }
            } catch (e) {}
          });
          // store so we can dispose on unmount
          selectionListenerRef.current._contentListener = contentListener;
        } catch (e) {}
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

  // Public leave (explicitly no auth header) - used when mentor selects 'Leave' from mentor panel
  const leavePublic = async () => {
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
      setShowLeaveModal(false);
      router.push('/session-left');
    }
  };

  // Mentor-only: end the session (protected endpoint). The backend will emit 'session-ended' to all participants.
  const confirmEndSession = async () => {
    try {
      const token = user?.token;
      if (!token) {
        setError('Authentication required to end session');
        return;
      }

      await fetch(`${BASE}/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ link }),
      }).catch(() => {});

      // backend emits 'session-ended' and disconnects sockets; ensure local cleanup as well
      try {
        if (socketRef.current && typeof socketRef.current.disconnect === 'function') socketRef.current.disconnect();
      } catch (e) {}
    } finally {
      setShowLeaveModal(false);
      router.push('/session-left');
    }
  };

  const closeLeaveModal = () => setShowLeaveModal(false);

  const shareSession = () => {
    // open the share modal so mentor can copy the session-join link
    setShowShareModal(true);
  };

  const generateNewLink = async () => {
    if (!session || !session.link) {
      alert('Session link not available');
      return;
    }

    if (!user || !user.token) {
      alert('Authentication required');
      return;
    }

    setGeneratingNewLink(true);
    try {
      // Prevent beforeunload from sending a decrement while we rotate the link
      if (incrementedRef.current) {
        incrementedRef.current = false;
      }

      const res = await fetch(`${BASE}/session/new-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ link: session.link }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || json?.error || 'Failed to generate new link');
        setGeneratingNewLink(false);
        return;
      }

      // Extract the new link from response - backend returns { status: 'success', data: sessionObject }
      const updated = json && json.data;
      const newLink = (updated && updated.link) || (updated && updated[0] && updated[0].link);

      if (newLink) {
        // Save current code to localStorage with new link
        saveCodeToStorage(newLink, code);
        
        // Set flag in sessionStorage to prevent increment on next page load
        try {
          sessionStorage.setItem('mentor-bridge-link-changed', 'true');
        } catch (e) {
          // ignore
        }
        
        // Close modal
        setShowNewLinkModal(false);
        
        // Redirect to the new session link - this will reload the page and reconnect sockets
        // Backend already set participants=1, so mentor stays connected
        window.location.href = `/session?link=${encodeURIComponent(newLink)}`;
        return;
      }

      // Fallback: if we got the session but no link, show error
      alert('Failed to get new link from response');
      setGeneratingNewLink(false);
    } catch (e) {
      alert(e?.message || 'Network error. Please check your connection and try again.');
      setGeneratingNewLink(false);
    }
  };

  // Loading check - show loading state while auth is initializing
  if (loading || (!user && !guest)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 text-center"
        >
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 dark:border-white/10 border-t-primary" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading session...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
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
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {session ? (
                  (session.mentor_name && !participantsLeft.has('mentor') ? 1 : 0) + 
                  ((session.student_name || guest?.name) && !participantsLeft.has('student') ? 1 : 0)
                ) : 0} participants
              </span>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 p-2 transition hover:border-primary/40 hover:bg-slate-200 dark:hover:bg-primary/20"
                title="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </button>
              {/* Copy code removed */}
              {isMentor && session?.status === 'pending' && (
                <button
                  onClick={() => setShowNewLinkModal(true)}
                  className="rounded-full border border-amber-600/40 dark:border-yellow-500/40 bg-amber-100 dark:bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-yellow-300 transition hover:bg-amber-200 dark:hover:bg-yellow-500/30"
                  title="Generate new session link"
                >
                  Generate New Link
                </button>
              )}
              <button
                onClick={shareSession}
                className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 p-2 transition hover:border-primary/40 hover:bg-slate-200 dark:hover:bg-primary/20"
                title="Share session"
              >
                <ShareIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => { if (isMentor) setShowLeaveModal(true); else leaveSession(); }}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Leave Session
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Generate New Link Modal */}
      {showNewLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-950/95 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Generate New Session Link</h3>
            <p className="text-sm text-slate-700 dark:text-slate-400 mb-4">
              This will create a new unique link for this session. The previous link will become invalid, 
              and any students who haven't joined yet will need the new link to join.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-300">⚠ Warning: Students using the old link will no longer be able to join this session.</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewLinkModal(false)}
                disabled={generatingNewLink}
                className="rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={generateNewLink}
                disabled={generatingNewLink}
                className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-60"
              >
                {generatingNewLink ? 'Generating...' : 'Generate New Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-950/95 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Share Session</h3>
            <p className="text-sm text-slate-700 dark:text-slate-400 mb-4">Copy the join link for students to join the session.</p>

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
                className="rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave / End Session modal for mentors */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-950/95 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Leave Session</h3>
            <p className="text-sm text-slate-700 dark:text-slate-400 mb-4">You can either leave this session (you will be removed) or end the session for everyone. Ending the session will disconnect all participants.</p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Mentor chooses to leave but not end session — call public leave
                  leavePublic();
                }}
                className="rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200"
              >
                Leave
              </button>

              <button
                onClick={() => {
                  // Mentor ends the session for everyone
                  confirmEndSession();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                End Session
              </button>

              <button
                onClick={closeLeaveModal}
                className="ml-auto rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Participants Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-4 flex flex-col">
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Participants</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Active in this session</p>
            </div>
            
            <div className="space-y-2">
              {/* Render mentor if present in session and hasn't left */}
              {session && session.mentor_name && !participantsLeft.has('mentor') && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-xs font-semibold text-white">
                        {session.mentor_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-100 dark:border-slate-950" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{session.mentor_name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Mentor</p>
                  </div>
                </div>
              )}

              {/* Render student if present in session and hasn't left */}
              {session && session.student_name && !participantsLeft.has('student') && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-xs font-semibold text-white">
                        {session.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-100 dark:border-slate-950" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{session.student_name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Student</p>
                  </div>
                </div>
              )}
              
              {/* Fallback: Show guest student if session.student_name is not set but guest exists */}
              {session && !session.student_name && guest?.name && !participantsLeft.has('student') && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-xs font-semibold text-white">
                        {guest.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-100 dark:border-slate-950" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{guest.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Student</p>
                  </div>
                </div>
              )}

              {/* Show empty state if no visible participants */}
              {session && (
                (!session.mentor_name && !session.student_name) ||
                (participantsLeft.has('mentor') && participantsLeft.has('student')) ||
                (participantsLeft.has('mentor') && !session.student_name) ||
                (participantsLeft.has('student') && !session.mentor_name)
              ) && (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.02] p-4 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400">No participants yet</p>
                </div>
              )}
            </div>

              {/* Invite button removed — sharing handled elsewhere */}
            </div>

            {/* Video / call box sits at bottom of the participants panel and spans full width */}
            <div className="mt-auto">
              <div className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/60 shadow-lg">
                <div className="p-2">
                  {/* Remote video stream */}
                  <div className="relative h-32 w-full overflow-hidden rounded-md bg-slate-800 dark:bg-slate-900">
                    {remoteStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        muted={remoteMuted}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300 dark:text-slate-400">
                        {isConnecting ? 'Connecting...' : 'Waiting for remote video'}
                      </div>
                    )}
                    
                    {/* Local video (Picture-in-Picture) */}
                    {localStream && (
                      <div className="absolute bottom-2 right-2 h-16 w-20 overflow-hidden rounded-md border border-slate-300 dark:border-white/20 bg-slate-700 dark:bg-slate-900">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-cover mirror"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Status info */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${remoteStream ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {remoteStream ? 'Connected' : isConnecting ? 'Connecting...' : 'Not connected'}
                      </div>
                    </div>
                    {localStream && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <div className={`h-2 w-2 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className={`h-2 w-2 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
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
                theme={theme === 'dark' ? 'mentor-bridge-dark' : 'mentor-bridge-light'}
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
            <div className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 h-48">
              <div className="border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/40 p-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Output</h3>
              </div>
              <div className="h-full overflow-y-auto p-4">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                  {output || 'Click "Run Code" to see output...'}
                </pre>
              </div>
            </div>
          </div>
        </main>

        {/* Render chat via portal to avoid stacking/context click-blocking issues */}
        <ChatPortal
          chatVisible={chatVisible}
          setChatVisible={setChatVisible}
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatInputRef={chatInputRef}
          session={session}
          link={link}
          chatStudentNameRef={chatStudentNameRef}
          user={user}
          guest={guest}
          socketRef={socketRef}
          setMessages={setMessages}
        />
      </div>

      {/* (video placeholder moved into participants sidebar; fixed duplicate removed) */}

      {/* Bottom control strip with camera/mic buttons */}
      <div className="fixed left-0 right-0 bottom-0 z-50">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-t-xl bg-slate-100/90 dark:bg-slate-900/70 border-t border-slate-300/50 dark:border-white/5 py-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-center gap-4">
              {/* Camera toggle */}
              <CameraButton 
                isEnabled={cameraEnabled} 
                onToggle={toggleCamera}
                disabled={false}
              />

              {/* Mic toggle */}
              <MicButton 
                isEnabled={micEnabled} 
                onToggle={toggleMic}
                disabled={false}
              />
              
              {/* Connection status indicator */}
              {isConnecting && (
                <div className="ml-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span>Connecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center"><div className="text-white">Loading session...</div></div>}>
      <SessionPageContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;