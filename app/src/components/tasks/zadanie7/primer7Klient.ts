import { typeset } from '@/lib/tex';
import { zagruzitZadachi } from '@/lib/zadanie7/dannye';
import { prototype } from '@/lib/zadanie7/prototypes';
import type { Shag } from '../steklo';
import { otvetTekstom, shagiIzResheniya } from './shagi7';

/**
 * Разобранный пример прототипа, собранный в браузере: первая задача
 * открытого банка ФИПИ (нет — первый аналог) и её решение решателем
 * прототипа. Тот же пример, что на странице разбора прототипа.
 * Отдельный кусок сборки: грузится по первому раскрытию карточки.
 */
export interface Primer7 {
  uslovieHtml: string;
  shagi: Shag[];
  otvet: string;
}

export async function primer7(id: string): Promise<Primer7 | null> {
  const zadachi = [...(await zagruzitZadachi([id])).values()].filter((z) => z.prototypeId === id);
  const z = zadachi.find((x) => x.source === 'fipi') ?? zadachi[0];
  if (z === undefined) {
    return null;
  }
  const s = prototype(id).solve(z.params);
  return {
    uslovieHtml: typeset(z.text),
    shagi: shagiIzResheniya(s),
    otvet: otvetTekstom(s.answer),
  };
}
