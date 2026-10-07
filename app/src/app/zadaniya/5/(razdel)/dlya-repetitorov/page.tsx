import type { Metadata } from 'next';
import { veroyatnostBySlug, veroyatnostMeta } from '@/content/veroyatnost';
import Teoriya5Tab from '../page';

export const metadata: Metadata = {
  ...veroyatnostMeta('5', veroyatnostBySlug('5')?.tutors?.title ?? 'Для репетиторов'),
};

/**
 * Прямой заход на материалы для репетиторов задания №5 — как у №12:
 * та же страница раздела, меню материалов раскрыто сразу
 * (VeroyatnostTabs смотрит на адрес). Содержимое — первая вкладка,
 * «Теория».
 */
export default function Repetitoram5Page() {
  return <Teoriya5Tab />;
}
