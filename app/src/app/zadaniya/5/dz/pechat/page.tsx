import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PechatDz5 } from '@/components/tasks/veroyatnost/dz5/PechatDz5';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/app/zadaniya/[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `Домашнее задание · ${veroyatnostBySlug('5')?.title ?? ''} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * Печатный лист задач-шаблонов задания №5 (вкладка «Домашняя работа»: вид листа — параметр r адреса).
 * Параметры — в адресе; оболочки сайта нет.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PechatDz5 istochnik="dz" />
    </Suspense>
  );
}
