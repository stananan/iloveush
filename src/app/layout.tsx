import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'I ❤️ USH',
  description: 'Describe the term. Don\'t say it. Beat the class.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink font-sans">{children}</body>
    </html>
  );
}
