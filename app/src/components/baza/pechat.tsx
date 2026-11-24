import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { vkladkaBazy } from '@/content/baza/razdely';
import { taskBase, tasksOf } from '@/content/tasks';
import { configBazy } from '@/lib/baza/generatorBazy';
import { razdelBazy } from '@/lib/baza/razdely';
import type { ListVid } from '@/lib/sheetList';
import { ListBazy } from './ListBazy';
import { bazaTask, type BazaParams } from './stranitsa';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/app/zadaniya/grafiki-funkciy/[type]/pechat/pechat.css';
import './generatorBazy.css';
import './pechatBazy.css';

/**
 * Страницы печати генератора базы: /baza/zadaniya/[task]/pechat/ (лист
 * ученика), …/pechat/otvety/ (лист учителя), …/pechat/vse/ (оба одним
 * файлом). Маршрут один на все разделы — собираются только разделы с
 * банком задач. Задачи — по адресу набора, лист собирается в браузере.
 */

const NAZVANIE: Record<ListVid | 'vse', string> = {
  uchenik: 'Лист ученика',
  uchitel: 'Лист учителя',
  vse: 'Всё одним файлом',
};

/* Статический экспорт: только разделы базы с прототипами. */
export function pechatBazyParams() {
  return tasksOf('base')
    .filter((task) => razdelBazy(task.slug)?.prototipy !== undefined)
    .map((task) => ({ task: task.slug }));
}

export async function pechatBazyMetadata(
  params: BazaParams,
  vid: ListVid | 'vse',
): Promise<Metadata> {
  const task = bazaTask((await params).task);
  return {
    title: `${NAZVANIE[vid]} · №${Number(task.no)}. ${task.name} (база) — Будет на ЕГЭ`,
    robots: { index: false, follow: false },
  };
}

export async function PechatBazy({ params, vid }: { params: BazaParams; vid: ListVid | 'vse' }) {
  const task = bazaTask((await params).task);
  const razdel = razdelBazy(task.slug);
  if (razdel?.prototipy === undefined) notFound();
  const ekran = `${taskBase(task)}/${vkladkaBazy('generator').tail}`;
  return <ListBazy config={configBazy(task, razdel, ekran)} vid={vid} />;
}
