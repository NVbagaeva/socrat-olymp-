import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Nabor13 } from '@/components/tasks/zadanie13/Nabor13';
import { ONLAYN_13 } from '@/content/generator13';
import { zadanie13Title } from '@/content/zadanie13';

export const metadata: Metadata = {
  title: zadanie13Title(ONLAYN_13.title),
  robots: { index: false },
};

/** Онлайн-набор задания №13 по ссылке или QR с листа ученика. */
export default function Nabor13Page() {
  return (
    <Suspense fallback={null}>
      <Nabor13 />
    </Suspense>
  );
}
