import { Shell16 } from '@/components/zadanie16/Shell16';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — общие
   слои, как у №11. */
import '../../[task]/[type]/topic.css';
import '../../veroyatnost.css';
import '../zadanie16.css';

/**
 * Оболочка задания №16: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie16Layout({ children }: { children: React.ReactNode }) {
  return <Shell16>{children}</Shell16>;
}
