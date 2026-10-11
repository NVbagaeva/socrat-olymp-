import type { Metadata } from 'next';
import { Trenazher10 } from '@/components/tasks/zadanie10/Trenazher10';
import type { IllInfo } from '@/components/tasks/zadanie10/Zadacha10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { illyustraciya } from '@/lib/zadanie10/illyustracii';
import { protoInfo10, gruppy10 } from '@/lib/zadanie10/protoInfo';
import { PROTOTYPES } from '@/lib/zadanie10/prototypes';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie10Title('Тренажёр'),
};

/**
 * Вкладка «Тренажёр» №10. Сервер отдаёт только список прототипов и
 * найденные картинки сюжетов; условия задач тренажёр загружает сам
 * (public/data/zadanie10, без ответов).
 */
export default function Trenazher10Tab() {
  const prototipy = protoInfo10();
  const ill: Record<string, IllInfo> = {};
  for (const p of PROTOTYPES) {
    const i = illyustraciya(p.id);
    if (i) {
      ill[p.id] = { webp: i.webp, png: i.png, alt: i.alt, width: i.width, height: i.height };
    }
  }
  return (
    <Trenazher10
      prototipy={prototipy}
      gruppy={gruppy10()}
      ill={ill}
      base={`${ZADANIYA}/${ZADANIE10.slug}`}
    />
  );
}
