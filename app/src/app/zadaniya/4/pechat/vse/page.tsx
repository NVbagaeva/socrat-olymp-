import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PechatVeroyatnosti } from '@/components/tasks/veroyatnost/PechatVeroyatnosti';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import { bank4Pool } from '@/lib/veroyatnost/pool';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../../[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `Всё одним файлом · ${veroyatnostBySlug('4')?.title ?? ''} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * «Всё одним файлом» задания №4: лист ученика, затем лист с ответами
 * тех же задач по тому же адресу, в конце — ответы и краткие решения.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PechatVeroyatnosti pool={bank4Pool()} zadanie={4} vid="vse" />
    </Suspense>
  );
}
