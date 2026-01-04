'use client';

import { motion } from 'framer-motion';

const testimonials = [
  {
    quote:
      'Working with my mentor took me from building toy apps to deploying production-ready services in three months. The accountability made all the difference.',
    name: 'Priya Sharma',
    role: 'Backend Engineer, Launchbyte',
  },
  {
    quote:
      'The weekly rhythm kept me shipping consistently. I landed my first developer role after polishing my portfolio projects live with my mentor.',
    name: 'Marcus Lee',
    role: 'Frontend Developer, Loop Studios',
  },
  {
    quote:
      'Mentor Bridge helped my startup team train our interns quickly. Personalized tracks beat any video course we tried.',
    name: 'Elena García',
    role: 'CTO, SeedSpark Labs',
  },
];

export function TestimonialSection() {
  return (
    <section id="mentors" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl text-white md:text-4xl">Success stories from learners and teams</h2>
          <p className="mt-4 text-base text-slate-300">
            Trusted by engineers leveling up across the globe.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.blockquote
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left text-sm text-slate-300 shadow-xl backdrop-blur"
            >
              <p className="flex-1 leading-relaxed">“{item.quote}”</p>
              <footer className="mt-6 text-xs uppercase tracking-[0.3em] text-white/60">
                <div className="font-semibold tracking-normal text-white">{item.name}</div>
                <div className="tracking-normal text-slate-400">{item.role}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
