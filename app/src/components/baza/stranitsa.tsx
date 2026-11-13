import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { vkladkaBazy } from '@/content/baza/razdely';
import { tasksOf, type ExamTask } from '@/content/tasks';
import type { VkladkaBazy } from '@/lib/baza/types';
import { FormatZadaniya } from './OZadaniiBaza';
import { Pusto } from './Pusto';

/**
 * Страницы вкладок задания базы. Маршрут один на все 21 задание
 * (/baza/zadaniya/[task]/…), поэтому страница вкладки — три строки:
 * параметры сборки, заголовок окна и содержимое берутся отсюда.
 */

export type BazaParams = Promise<{ task: string }>;

/* Статический экспорт: собираются страницы только заявленных заданий. */
export function bazaStaticParams() {
  return tasksOf('base').map((task) => ({ task: task.slug }));
}

export function bazaTask(slug: string): ExamTask {
  const task = tasksOf('base').find((t) => t.slug === slug);
  if (task === undefined) notFound();
  return task;
}

/** «Теория · Теория вероятностей (база) — Будет на ЕГЭ». */
export async function bazaMetadata(params: BazaParams, tab: VkladkaBazy): Promise<Metadata> {
  const task = bazaTask((await params).task);
  return {
    title: `${vkladkaBazy(tab).label} · №${Number(task.no)}. ${task.name} (база) — Будет на ЕГЭ`,
  };
}

/** Содержимое вкладки: наполнение раздела или «Материал готовится». */
export async function VkladkaBazyPage({ params, tab }: { params: BazaParams; tab: VkladkaBazy }) {
  const task = bazaTask((await params).task);
  const pusto = <Pusto vkladka={vkladkaBazy(tab).label} />;
  if (tab === 'o-zadanii') {
    return (
      <>
        <FormatZadaniya task={task} />
        {task.status === 'ready' ? null : pusto}
      </>
    );
  }
  return pusto;
}
