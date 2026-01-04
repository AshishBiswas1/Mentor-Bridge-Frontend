'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Fragment, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog, Transition } from '@headlessui/react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#mentors', label: 'Mentors' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#cta', label: 'Get started' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        isScrolled ? 'bg-slate-950/85 backdrop-blur border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            MB
          </span>
          Mentor Bridge
        </Link>
        <div className="hidden items-center gap-8 text-sm text-slate-200 md:flex">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative transition hover:text-white"
            >
              {item.label}
              <span className="absolute inset-x-0 -bottom-2 h-[2px] origin-left scale-x-0 bg-primary transition-transform duration-200 ease-out hover:scale-x-100" />
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <Button href="/login" variant="ghost">
            Log in
          </Button>
          <Button href="/signup">Start free trial</Button>
        </div>
        <button className="md:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
          <Bars3Icon className="h-7 w-7 text-slate-100" />
        </button>
      </nav>

      <Transition show={mobileOpen} as={Fragment}>
        <Dialog onClose={setMobileOpen} className="relative z-50 md:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition duration-200"
            enterFrom="opacity-0 translate-y-6"
            enterTo="opacity-100 translate-y-0"
            leave="transition duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <Dialog.Panel className="fixed inset-x-4 top-20 origin-top rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl backdrop-blur">
              <nav className="space-y-4 text-base text-slate-100">
                {navLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl px-3 py-2 transition hover:bg-white/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-6 grid gap-3">
                  <Button href="/login" variant="ghost" className="w-full justify-center">
                    Log in
                  </Button>
                  <Button href="/signup" className="w-full justify-center">
                    Start free trial
                  </Button>
                </div>
              </nav>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </header>
  );
}
