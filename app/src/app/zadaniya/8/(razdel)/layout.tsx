import { VychisleniyaShell } from '@/components/tasks/vychisleniya/VychisleniyaShell';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Лента с кнопкой «Для репетиторов», конфигуратор, экраны тренажёра и
   подготовки — стили тех же маршрутов, что у заданий №4 и №12:
   подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/configurator.css';
import '../../[task]/[type]/trainer.css';
import '../../[task]/[type]/prep.css';
import '../zadanie8.css';

/**
 * Оболочка задания №8: крошки, заголовок и лента вкладок.
 * Группа маршрутов (razdel) — все вкладки раздела.
 */
export default function Vychisleniya8Layout({ children }: { children: React.ReactNode }) {
  return <VychisleniyaShell>{children}</VychisleniyaShell>;
}
