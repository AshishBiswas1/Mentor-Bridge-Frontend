import '@/app/globals.css';
import { Providers } from '@/app/providers';
import { Inter, Poppins } from 'next/font/google';

export const metadata = {
  title: 'Mentor Bridge | Learn to Code 1-on-1',
  description:
    'Mentor Bridge connects aspiring developers with expert mentors for personalized 1-on-1 coding sessions.',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-poppins' });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 font-sans text-slate-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
