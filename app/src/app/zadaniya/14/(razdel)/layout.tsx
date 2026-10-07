import { Shell14 } from '@/components/tasks/zadanie14/Shell14';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../zadanie14.css';

/**
 * Оболочка задания №14: крошки, заголовок и лента вкладок.
 * Группа маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie14Layout({ children }: { children: React.ReactNode }) {
  return <Shell14>{children}</Shell14>;
}
