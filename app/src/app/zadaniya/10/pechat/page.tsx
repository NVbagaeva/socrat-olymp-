import type { Metadata } from 'next';
import { List10 } from '@/components/tasks/zadanie10/List10';
import type { IllInfo } from '@/components/tasks/zadanie10/Zadacha10';
import { zadanie10Title } from '@/content/zadanie10';
import { illyustraciya } from '@/lib/zadanie10/illyustracii';
import { PROTOTYPES } from '@/lib/zadanie10/prototypes';
import 'katex/dist/katex.min.css';
import '@/components/tasks/zadanie10/razbor10.css';
import '../zadanie10.css';
import './pechat10.css';

export const metadata: Metadata = {
  title: zadanie10Title('Лист'),
  robots: { index: false, follow: false },
};

/**
 * Печатный лист №10 — генератора (m=g) и урока (m=u); l=uchenik|uchitel.
 * Всё в адресе: ученик и учитель открывают одну ссылку с разным l и
 * получают одни и те же задачи.
 */
export default function Pechat10() {
  const ill: Record<string, IllInfo> = {};
  for (const p of PROTOTYPES) {
    const i = illyustraciya(p.id);
    if (i) {
      ill[p.id] = { webp: i.webp, png: i.png, alt: i.alt, width: i.width, height: i.height };
    }
  }
  return <List10 ill={ill} />;
}
