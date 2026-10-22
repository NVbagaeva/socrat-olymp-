import { Shell6 } from '@/components/tasks/zadanie6/Shell6';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — слои
   заданий №4 и №12, как у №7 и №10: подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '../../komplekt.css';
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '../zadanie6.css';

/**
 * Оболочка задания №6: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie6Layout({ children }: { children: React.ReactNode }) {
  return <Shell6>{children}</Shell6>;
}
