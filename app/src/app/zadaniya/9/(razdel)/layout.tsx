import { ProizvodnayaShell } from '@/components/tasks/proizvodnaya/ProizvodnayaShell';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Лента вкладок, конфигуратор, экраны тренажёра и подготовки, карточки
   теории — стили тех же маршрутов, что у заданий №2, №4, №8 и №12:
   подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/configurator.css';
import '../../komplekt.css';
import '../../[task]/[type]/trainer.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '../zadanie9.css';
import '../site9.css';

/**
 * Оболочка задания №9: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Proizvodnaya9Layout({ children }: { children: React.ReactNode }) {
  return <ProizvodnayaShell>{children}</ProizvodnayaShell>;
}
