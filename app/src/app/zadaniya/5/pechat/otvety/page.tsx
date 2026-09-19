import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PechatVeroyatnosti } from '@/components/tasks/veroyatnost/PechatVeroyatnosti';
import { generatorPage } from '@/content/generator';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../../[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `${generatorPage.teacher} · ${veroyatnostBySlug('5')?.title ?? ''} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * Лист с ответами задания №5: те же задачи, что у ученика по тому же
 * адресу, таблица «Ответы» и «Краткие решения» с новой страницы.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PechatVeroyatnosti pool={bank5Pool()} zadanie={5} withAnswers />
    </Suspense>
  );
}
