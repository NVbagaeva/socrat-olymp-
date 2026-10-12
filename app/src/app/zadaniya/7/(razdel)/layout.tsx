import { Shell7 } from '@/components/tasks/zadanie7/Shell7';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — слои
   заданий №4 и №12, как у №10 и №11: подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '../../komplekt.css';
import '@/components/tasks/zadanie7/razbor7.css';
import '../zadanie7.css';
import '../irracionalnye7.css';

/**
 * Оболочка задания №7: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie7Layout({ children }: { children: React.ReactNode }) {
  return <Shell7>{children}</Shell7>;
}
