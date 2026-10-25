import type { Metadata } from 'next';
import { Repetitory13 } from '@/components/tasks/zadanie13/Repetitory13';
import { ZADANIE13, zadanie13Title } from '@/content/zadanie13';
import { BLOKI_13 } from '@/lib/zadanie13/opornye/bloki';
import { PROTOTYPES } from '@/lib/zadanie13/proto';
import { SIGN } from '@/lib/zadanie13/proto/common';
import { TYPE_NAMES } from '@/lib/zadanie13/types';
import { ZADANIYA } from '@/lib/paths';
import '../../../11/zadanie11.css';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'repetitory')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie13Title(VKLADKA),
};

/**
 * Вкладка «Для репетиторов» задания №13: уроки с листами, заметки по
 * типам, карточки «Определи тип», быстрый лист. Вёрстка — общие слои
 * вкладки репетиторов №11.
 */
export default function Repetitory13Tab() {
  const priznaki = Object.fromEntries(
    Object.entries(SIGN).map(([t, s]) => [t, s.charAt(0).toUpperCase() + s.slice(1) + '.']),
  ) as typeof SIGN;
  return (
    <Repetitory13
      base={`${ZADANIYA}/${ZADANIE13.slug}`}
      bloki={BLOKI_13.map((b) => ({ id: b.id, slug: b.slug, nazvanie: b.nazvanie }))}
      prototipy={PROTOTYPES.map((p) => ({
        id: p.id,
        title: p.title,
        hard: p.difficulty === 'hard',
      }))}
      tipy={TYPE_NAMES}
      priznaki={priznaki}
    />
  );
}
