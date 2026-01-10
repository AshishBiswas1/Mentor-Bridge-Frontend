'use client';

import Link from 'next/link';

export default function SessionLeftPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="max-w-lg w-full p-8 rounded-2xl bg-slate-800/60 border border-white/10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-display text-white">You left the session</h1>
        <p className="mt-2 text-sm text-slate-300">
          You've left the live session. Thanks for joining — feel free to return to the dashboard
          or the homepage to find more sessions.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-white text-center shadow-md"
          >
            Go to dashboard
          </Link>

          <Link
            href="/"
            className="flex-1 rounded-full border border-white/20 py-3 text-sm font-semibold text-white text-center"
          >
            Back to home
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-400">This page is not yet wired to session logic.</p>
      </div>
    </div>
  );
}
