export default function TailwindDemoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 p-8 shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.4em] text-white/70">Tailwind CSS Demo</p>
        <h1 className="mt-4 font-display text-3xl">Styled card rendered via Tailwind utilities</h1>
        <p className="mt-3 text-sm text-slate-200">
          This page exists purely to verify that Tailwind is compiling correctly. If you see the gradient card with rounded corners and soft shadows, the pipeline is working.
        </p>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">Primary</span>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-accent">Accent</span>
        </div>
      </div>
    </main>
  );
}
