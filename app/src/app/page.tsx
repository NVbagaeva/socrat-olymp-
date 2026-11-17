import type { Metadata } from 'next';
import { ogStranicy } from '@/lib/og';
import { Glavnaya } from '@/components/landing/Glavnaya';
import { landing } from '@/content/landing';
import './landing.css';

export const metadata: Metadata = {
  title: landing.meta.title,
  description: landing.meta.description,
  openGraph: ogStranicy(landing.meta.title, landing.meta.description),
};

export default function HomePage() {
  return <Glavnaya level="profile" />;
}
