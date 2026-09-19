import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatorPage } from '@/content/generator';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import { bank4Pool } from '@/lib/veroyatnost/pool';
import { Sheet4Page } from '../Sheet4Page';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../../[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `${generatorPage.teacher} · ${veroyatnostBySlug('4')?.title ?? ''} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * Лист с ответами: те же задачи, что у ученика по тому же адресу,
 * и таблица «Ответы» с новой страницы. Свой адрес: с листа ученика
 * сюда ссылки нет.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Sheet4Page pool={bank4Pool()} withAnswers />
    </Suspense>
  );
}
