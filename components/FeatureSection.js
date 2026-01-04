'use client';

import { motion } from 'framer-motion';
import { CommandLineIcon, CursorArrowRaysIcon, GlobeAltIcon, UsersIcon } from '@heroicons/react/24/outline';

const features = [
  {
    title: 'Live pair-programming',
    description: 'Debug, architect, and ship real projects in collaborative sessions built around your goals.',
    Icon: CommandLineIcon,
  },
  {
    title: 'Progress you can see',
    description: 'Track every milestone with weekly mentor notes, session recordings, and actionable tasks.',
    Icon: GlobeAltIcon,
  },
  {
    title: 'Mentor marketplace',
    description: 'Match with senior engineers from top companies and switch mentors as your skills evolve.',
    Icon: UsersIcon,
  },
  {
    title: 'On-demand support',
    description: 'Get async feedback between sessions through code reviews, Loom walkthroughs, and office hours.',
    Icon: CursorArrowRaysIcon,
  },
];

export function FeatureSection() {
  return (
    <section id="features" className="relative py-24">
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl text-white md:text-4xl">Your mentor, your roadmap</h2>
          <p className="mt-4 text-base text-slate-300">
            Every feature is crafted to help you learn faster, stay accountable, and ship work that matters.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur transition hover:border-primary/40 hover:bg-white/[0.08]"
            >
              <feature.Icon className="h-10 w-10 text-accent" />
              <h3 className="mt-4 font-display text-xl text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              <div className="mt-6 h-[2px] w-1/2 origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary to-accent transition duration-300 group-hover:scale-x-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
