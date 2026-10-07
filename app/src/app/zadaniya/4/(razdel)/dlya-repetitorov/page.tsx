import type { Metadata } from 'next';
import { OZadanii4 } from '@/components/tasks/veroyatnost/OZadanii4';
import { veroyatnostBySlug, veroyatnostMeta } from '@/content/veroyatnost';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  ...veroyatnostMeta('4', veroyatnostBySlug('4')?.tutors?.title ?? 'Для репетиторов'),
};

/**
 * Прямой заход на материалы для репетиторов — как у задания №12:
 * та же страница раздела с той же лентой вкладок, только меню
 * материалов раскрыто сразу (VeroyatnostTabs смотрит на адрес).
 * Содержимое — первая вкладка, «О задании».
 */
export default function Repetitoram4Page() {
  return <OZadanii4 base={`${ZADANIYA}/4`} />;
}
