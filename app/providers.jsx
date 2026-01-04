'use client';

import { AuthProvider } from '@/components/AuthProvider';

export function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
