import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PechatVeroyatnosti } from '@/components/tasks/veroyatnost/PechatVeroyatnosti';
import { generatorPage } from '@/content/generator';
import { LIST_5, veroyatnostBySlug } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `${generatorPage.student} · ${veroyatnostBySlug('5')?.title ?? ''} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * Лист для ученика задания №5: задачи со строкой «Ответ: ____», без
 * ответов. Параметры варианта — в адресе; оболочки сайта нет.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PechatVeroyatnosti pool={bank5Pool()} list={LIST_5} withAnswers={false} />
    </Suspense>
  );
}
