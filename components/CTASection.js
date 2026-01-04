'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section id="cta" className="pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="overflow-hidden rounded-[2.5rem] border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-[1px]"
        >
          <div className="rounded-[2.45rem] bg-slate-950/80 px-8 py-14 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto max-w-3xl space-y-6">
              <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
                Join Mentor Bridge
              </span>
              <h2 className="font-display text-3xl text-white md:text-4xl">
                Pair with a mentor in under 48 hours and start your next learning sprint.
              </h2>
              <p className="text-base text-slate-300">
                We will handpick mentors based on your goals and availability. No credit card required to start.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button href="/signup">Start free trial</Button>
                <Button href="/login" variant="secondary">
                  I already have an account
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
