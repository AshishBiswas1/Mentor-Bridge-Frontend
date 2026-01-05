'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    title: 'Set your goals',
    description: 'Tell us where you are today and what you want to achieve in the next 90 days.',
    stats: ['Skill audit', 'Goal workshop'],
  },
  {
    title: 'Match with a mentor',
    description: 'We connect you with vetted mentors who have built the products you admire.',
    stats: ['150+ mentors', '3x faster pairing'],
  },
  {
    title: 'Meet weekly, ship weekly',
    description: 'Code alongside your mentor, review progress, and stay on track with clear actions.',
    stats: ['Weekly sessions', 'Async feedback'],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-1"
        >
          <h2 className="font-display text-3xl text-white md:text-4xl">A learning loop engineered for momentum</h2>
          <p className="mt-4 text-base text-slate-300">
            Mentor Bridge combines expert feedback, habit-building, and real-world projects into one rhythm, so you keep shipping and never plateau.
          </p>
        </motion.div>
        <div className="flex-1 space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
            >
              <span className="absolute -left-10 top-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-4xl font-semibold text-primary/90">
                0{index + 1}
              </span>
              <div className="ml-12">
                <h3 className="font-display text-xl text-white">{step.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{step.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-accent/90">
                  {step.stats.map((stat) => (
                    <span
                      key={stat}
                      className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1"
                    >
                      {stat}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
