import { Shell12 } from '@/components/tasks/zadanie12/Shell12';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';

/**
 * Оболочка задания №12: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела, как у №9–11. Листы для
 * печати и онлайн-режим зачётной работы живут вне группы.
 */
export default function Zadanie12Layout({ children }: { children: React.ReactNode }) {
  return <Shell12>{children}</Shell12>;
}
