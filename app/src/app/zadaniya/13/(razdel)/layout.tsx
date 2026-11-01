import { Shell13 } from '@/components/tasks/zadanie13/Shell13';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — общие
   слои, как у №2 и №11: подключаются без правок. */
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/prep.css';
import '../../veroyatnost.css';
import '../zadanie13.css';
import '../reshenie13.css';
import '../../komplekt.css';
import type { Metadata } from 'next';
import { ogRazdela } from '@/content/seo';

/* Картинка ссылки в соцсетях — своя у раздела (public/og/zadanie-13.png). */
export const metadata: Metadata = ogRazdela(13);

/**
 * Оболочка задания №13: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie13Layout({ children }: { children: React.ReactNode }) {
  return <Shell13>{children}</Shell13>;
}
