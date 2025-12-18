import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Slop Factory - Automated Ad Generation Pipeline',
  description: 'Automated ad generation pipeline for contractors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


