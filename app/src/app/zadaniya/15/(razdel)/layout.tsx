import { ShellStereo } from '@/components/stereo/ShellStereo';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — общие
   слои, как у №11 и №16. */
import '../../[task]/[type]/topic.css';
import '../../veroyatnost.css';
import '@/lib/solid/solid.css';
import type { Metadata } from 'next';
import { ogRazdela } from '@/content/seo';

/* Картинка ссылки в соцсетях — своя у раздела (public/og/zadanie-15.png). */
export const metadata: Metadata = ogRazdela(15);

/**
 * Оболочка задания №15: крошки, заголовок, лента вкладок с плашкой
 * «Задание №… ▾». Шаблон один на №3 и №15 (components/stereo).
 */
export default function Zadanie15Layout({ children }: { children: React.ReactNode }) {
  return <ShellStereo no="15">{children}</ShellStereo>;
}
