export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950 px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-8 shadow-2xl backdrop-blur">
        {children}
      </div>
    </div>
  );
}
