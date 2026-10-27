import type { Metadata } from 'next';
import brandConfig from '@/src/config/brand';
import './globals.css';

export const metadata: Metadata = {
  title: `${brandConfig.name} | ${brandConfig.tagline}`,
  description: brandConfig.description,
  openGraph: {
    title: `${brandConfig.name} | ${brandConfig.tagline}`,
    description: brandConfig.description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brandConfig.name} | ${brandConfig.tagline}`,
    description: brandConfig.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1E1B4B" />
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
