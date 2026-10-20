import { ShellStereo } from '@/components/stereo/ShellStereo';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*) — общие
   слои, как у №11 и №16. */
import '../../[task]/[type]/topic.css';
import '../../veroyatnost.css';
import '@/lib/solid/solid.css';
import '../trenazher3.css';

/**
 * Оболочка задания №3: крошки, заголовок, лента вкладок с плашкой
 * «Задание №… ▾». Шаблон один на №3 и №15 (components/stereo).
 */
export default function Zadanie3Layout({ children }: { children: React.ReactNode }) {
  return <ShellStereo no="3">{children}</ShellStereo>;
}
