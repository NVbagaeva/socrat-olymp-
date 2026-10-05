import { VektoryShell } from '@/components/tasks/vektory/VektoryShell';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Лента вкладок, карточки теории (qth-*), экраны подготовки (prep,
   ptask) — стили тех же маршрутов, что у заданий №4, №8 и №12:
   подключаются без правок. Оболочка теории с содержанием рядом —
   слой задания №4 (vteor, vtab). */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/configurator.css';
import '../../[task]/[type]/trainer.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '@/lib/vektory/vektory.css';
import '../zadanie2.css';

/**
 * Оболочка задания №2: крошки, заголовок, кольцо прогресса и лента
 * вкладок. Группа маршрутов (razdel) — все вкладки раздела.
 */
export default function Vektory2Layout({ children }: { children: React.ReactNode }) {
  return <VektoryShell>{children}</VektoryShell>;
}
