'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const baseClasses =
  'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

export function Button({ as = 'button', href, children, variant = 'primary', className, ...props }) {
  const Component = href ? Link : as;
  const classes = clsx(
    baseClasses,
    variant === 'primary' && 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90',
    variant === 'secondary' &&
      'bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm',
    variant === 'ghost' && 'text-white hover:bg-white/10',
    className,
  );

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Component className={classes} href={href} {...props}>
        {children}
      </Component>
    </motion.div>
  );
}
