'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  PlayIcon, 
  StopIcon, 
  ArrowLeftIcon, 
  DocumentDuplicateIcon,
  ShareIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';
import { monacoTheme } from '@/components/monaco-theme';

const INITIAL_CODE = `// Welcome to your coding session!
// Start coding together...

function hello(name) {
  console.log(\`Hello, \${name}! Ready to code?\`);
}

hello('Mentor');
`;

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
];

export default function SessionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [code, setCode] = useState(INITIAL_CODE);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    let interval;
    if (sessionStarted) {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  useEffect(() => {
    // Mock participants for demo
    if (user) {
      setParticipants([
        { id: 1, name: user.name, role: 'mentor', active: true },
        { id: 2, name: 'Sarah Johnson', role: 'mentee', active: true },
      ]);
    }
  }, [user]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Define our custom theme
    monaco.editor.defineTheme('mentor-bridge-dark', monacoTheme);
    monaco.editor.setTheme('mentor-bridge-dark');
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');
    
    // Simulate code execution
    setTimeout(() => {
      if (language === 'javascript') {
        try {
          // Simple JavaScript execution simulation
          const result = eval(code);
          setOutput(prev => prev + `Output: ${result || 'Code executed successfully!'}\n`);
        } catch (error) {
          setOutput(prev => prev + `Error: ${error.message}\n`);
        }
      } else {
        setOutput(prev => prev + `Code execution for ${language} would happen here.\nMock output: Hello World!\n`);
      }
      setIsRunning(false);
    }, 1500);
  };

  const startSession = () => {
    setSessionStarted(true);
    setSessionTimer(0);
  };

  const endSession = () => {
    setSessionStarted(false);
    setSessionTimer(0);
    router.push('/session-left');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    // Could add a toast notification here
  };

  const shareSession = () => {
    const sessionUrl = window.location.href;
    navigator.clipboard.writeText(sessionUrl);
    // Could add a toast notification here
  };

  if (loading || !user) {
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
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:border-primary/40 hover:bg-primary/20"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
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
              <button
                onClick={copyCode}
                className="rounded-full border border-white/10 bg-white/10 p-2 transition hover:border-primary/40 hover:bg-primary/20"
                title="Copy code"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
              <button
                onClick={shareSession}
                className="rounded-full border border-white/10 bg-white/10 p-2 transition hover:border-primary/40 hover:bg-primary/20"
                title="Share session"
              >
                <ShareIcon className="h-4 w-4" />
              </button>
              {!sessionStarted ? (
                <button
                  onClick={startSession}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Start Session
                </button>
              ) : (
                <button
                  onClick={endSession}
                  className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

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

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={shareSession}
                className="w-full rounded-lg border border-white/20 bg-white/[0.02] px-3 py-2 text-sm text-slate-300 transition hover:border-primary/40 hover:bg-primary/10"
              >
                Invite Others
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col">
          {/* Editor Controls */}
          <div className="flex h-12 items-center justify-between border-b border-white/10 bg-slate-950/40 px-4">
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="rounded-lg border border-white/20 bg-slate-900 px-3 py-1 text-sm text-white focus:border-primary focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
          <div className="flex flex-1">
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

            {/* Output Panel */}
            <div className="w-80 border-l border-white/10 bg-slate-950/60">
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