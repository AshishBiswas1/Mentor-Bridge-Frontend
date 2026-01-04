export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-lg text-white">Mentor Bridge</p>
        <nav className="flex flex-wrap gap-6">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#mentors" className="transition hover:text-white">
            Mentors
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#cta" className="transition hover:text-white">
            Pricing
          </a>
        </nav>
        <p className="text-xs">
          © {new Date().getFullYear()} Mentor Bridge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
