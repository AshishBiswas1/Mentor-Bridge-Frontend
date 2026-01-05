'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/Button';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 flex justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-12 md:flex-row md:items-center md:pt-20">
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="flex-1 space-y-6"
        >
          <motion.span variants={item} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
            Your private coding mentor
          </motion.span>
          <motion.h1
            variants={item}
            className="font-display text-4xl leading-tight text-white md:text-6xl md:leading-[1.1]"
          >
            Learn to code faster with 1-on-1 mentorship tailored to you.
          </motion.h1>
          <motion.p variants={item} className="max-w-xl text-lg text-slate-300">
            Mentor Bridge pairs ambitious students with world-class developers for live, guided sessions that accelerate skill growth and confidence.
          </motion.p>
          <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row">
            <Button href="/signup">Start free trial</Button>
            <Button href="#features" variant="secondary">
              Explore features
            </Button>
          </motion.div>
          <motion.ul variants={item} className="flex flex-wrap gap-6 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />Personalized learning paths
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />Mentors from FAANG, YC startups
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />Flexible scheduling across timezones
            </li>
          </motion.ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="flex flex-1 justify-center"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="absolute inset-x-8 top-0 h-[2px] animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xl text-white">React Debugging Live</p>
                </div>
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">In 2h</span>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Agenda</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  <li>• Profiling performance bottlenecks</li>
                  <li>• Refactoring complex hooks</li>
                  <li>• Deployment best practices</li>
                </ul>
              </div>
              <div className="grid gap-3 rounded-2xl bg-white/5 p-4 text-sm text-slate-100">
                <div className="flex items-center justify-between">
                  <span>Mentor</span>
                  <span className="font-medium text-white">Alex Rivera</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Focus</span>
                  <span className="font-medium text-white">Frontend architecture</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration</span>
                  <span className="font-medium text-white">60 minutes</span>
                </div>
              </div>
              {/* Join waiting room removed per request */}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
