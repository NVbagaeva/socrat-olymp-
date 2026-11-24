import { Shell21 } from '@/components/tasks/zadanie21/Shell21';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Лента вкладок, экраны тренажёра и опорных, карточки теории — общие
   стили тех же маршрутов, что у №7 и №9. */
import '../../grafiki-funkciy/[type]/topic.css';
import '../../grafiki-funkciy/[type]/trainer.css';
import '../../grafiki-funkciy/[type]/prep.css';
import '../../veroyatnost.css';
import '../zadanie21.css';

/** Оболочка раздела: крошки, заголовок и лента вкладок. */
export default function Zadanie21Layout({ children }: { children: React.ReactNode }) {
  return <Shell21>{children}</Shell21>;
}
