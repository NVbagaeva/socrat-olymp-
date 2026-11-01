import { Shell10 } from '@/components/tasks/zadanie10/Shell10';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — слои
   заданий №4 и №12, как у №2 и №11: подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '@/components/tasks/zadanie10/razbor10.css';
import '../zadanie10.css';
import type { Metadata } from 'next';
import { ogRazdela } from '@/content/seo';

/* Картинка ссылки в соцсетях — своя у раздела (public/og/zadanie-10.png). */
export const metadata: Metadata = ogRazdela(10);

/**
 * Оболочка задания №10: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie10Layout({ children }: { children: React.ReactNode }) {
  return <Shell10>{children}</Shell10>;
}
