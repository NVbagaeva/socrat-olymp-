import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Плоскости и линии пересечения — витрина задания №15',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
