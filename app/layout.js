import './globals.css';
import { Providers } from './providers';
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
