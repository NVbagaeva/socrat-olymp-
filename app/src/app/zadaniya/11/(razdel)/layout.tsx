import { Shell11 } from '@/components/tasks/zadanie11/Shell11';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — слои
   заданий №4 и №12, как у №2: подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../veroyatnost.css';
import '../zadanie11.css';

/**
 * Оболочка задания №11: крошки, заголовок, кольцо прогресса и лента
 * вкладок. Группа маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie11Layout({ children }: { children: React.ReactNode }) {
  return <Shell11>{children}</Shell11>;
}
