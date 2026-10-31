import { Shell18 } from '@/components/zadanie18/Shell18';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../../[task]/[type]/topic.css';
import '../zadanie18.css';

/**
 * Оболочка задания №18: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie18Layout({ children }: { children: React.ReactNode }) {
  return <Shell18>{children}</Shell18>;
}
