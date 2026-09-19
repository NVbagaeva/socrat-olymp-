import { notFound } from 'next/navigation';
import { VeroyatnostShell } from '@/components/tasks/veroyatnost/VeroyatnostShell';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Лента с кнопкой «Для репетиторов», конфигуратор тренировки, экран
   генератора, кружки подхода и итог тренировки — те же, что у задания
   №12, со своими стилями маршрута: подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/configurator.css';
import '../../[task]/[type]/trainer.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '@/components/probability/probability.css';
import '@/components/tasks/card/problem-card.css';
import '../zadanie4.css';

/**
 * Оболочка задания №4: крошки, заголовок и лента вкладок.
 *
 * Группа маршрутов (razdel) — все вкладки раздела. Страницы печати
 * лежат рядом, вне группы: у листа для принтера оболочки сайта нет.
 *
 * Разметка общая с заданием №5 и живёт в VeroyatnostShell — здесь
 * только выбор раздела по адресу.
 */
export default function Veroyatnost4Layout({ children }: { children: React.ReactNode }) {
  const section = veroyatnostBySlug('4');
  if (section === undefined) {
    notFound();
  }
  return <VeroyatnostShell section={section}>{children}</VeroyatnostShell>;
}
