import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Awesome Video Prompts',
    default: 'Awesome Video Prompts',
  },
  description: 'An open-source collection of awesome AI video generation prompts',
  openGraph: {
    type: 'website',
    siteName: 'Awesome Video Prompts',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
