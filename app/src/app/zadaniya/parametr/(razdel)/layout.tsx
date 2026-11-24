import { Shell19 } from '@/components/zadanie19/Shell19';
import 'katex/dist/katex.min.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
/* Оболочка теории с содержанием рядом (vteor, vtab, topic-*), блок
   «Поиграй» (.play) и карточки глав №16 (z16-*) — общие слои: №19
   устроен как №16 и берёт их без правок. Своё — zadanie19.css. */
import '../../grafiki-funkciy/[type]/topic.css';
/* Тренажёр: выбор тренировки и экран заданий — слои №8 и №12. */
import '../../grafiki-funkciy/[type]/configurator.css';
import '../../grafiki-funkciy/[type]/trainer.css';
import '../../grafiki-funkciy/[type]/prep.css';
import '../../veroyatnost.css';
import '../../neravenstvo/zadanie16.css';
import '../zadanie19.css';

/**
 * Оболочка задания №19: крошки, заголовок и лента вкладок. Группа
 * маршрутов (razdel) — все вкладки раздела.
 */
export default function Zadanie19Layout({ children }: { children: React.ReactNode }) {
  return <Shell19>{children}</Shell19>;
}
