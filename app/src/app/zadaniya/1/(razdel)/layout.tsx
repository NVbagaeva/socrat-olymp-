import { Shell1 } from '@/components/tasks/planimetriya/Shell1';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Лента вкладок, карточки теории (qth-*), разобранные примеры
   (rich-example), плашки типов «О задании» (about-types), экраны
   подготовки (prep, ptask) — стили тех же маршрутов, что у №2, №11 и
   №12: подключаются без правок. Оболочка теории — слой №4 (vteor). */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '@/lib/planimetriya/planimetriya.css';
import '../zadanie1.css';
import '../spravochnik1-web.css';

/**
 * Оболочка задания №1: крошки, заголовок, кольцо прогресса и лента
 * вкладок. Группа маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie1Layout({ children }: { children: React.ReactNode }) {
  return <Shell1>{children}</Shell1>;
}
