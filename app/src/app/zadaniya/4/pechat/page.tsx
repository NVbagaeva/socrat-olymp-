import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PechatVeroyatnosti } from '@/components/tasks/veroyatnost/PechatVeroyatnosti';
import { generatorPage } from '@/content/generator';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import { bank4Pool } from '@/lib/veroyatnost/pool';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `${generatorPage.student} · ${veroyatnostBySlug('4')?.title ?? ''} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * Лист для ученика: задачи со строкой «Ответ: ____», без ответов.
 * Параметры варианта — в адресе; оболочки сайта нет, только лист.
 */
export default function Page() {
  return (
    /* useSearchParams требует границы ожидания: без неё статический
       экспорт страницы не собирается. */
    <Suspense fallback={null}>
      <PechatVeroyatnosti pool={bank4Pool()} zadanie={4} withAnswers={false} />
    </Suspense>
  );
}
