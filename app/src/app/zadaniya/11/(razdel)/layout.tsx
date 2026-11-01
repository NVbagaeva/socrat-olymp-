import { Shell11 } from '@/components/tasks/zadanie11/Shell11';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — слои
   заданий №4 и №12, как у №2: подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '../zadanie11.css';
import '../../komplekt.css';
import '../procenty.css';
import type { Metadata } from 'next';
import { ogRazdela } from '@/content/seo';

/* Картинка ссылки в соцсетях — своя у раздела (public/og/zadanie-11.png). */
export const metadata: Metadata = ogRazdela(11);

/**
 * Оболочка задания №11: крошки, заголовок, кольцо прогресса и лента
 * вкладок. Группа маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie11Layout({ children }: { children: React.ReactNode }) {
  return <Shell11>{children}</Shell11>;
}
