import { ZAGRUZKA11 } from '@/lib/zadanie11/trening/zagruzka';
import type { Shag } from '../steklo';
import { otvetPrimera11 } from './otvetPrimera11';
import { shagi11 } from './shagi11';

/**
 * Разобранный пример подтипа №11, собранный в браузере: задача банка
 * (ключ выбирает сервер — первая задача открытого банка или разминки) и
 * её решение функцией подтипа. Отдельный кусок сборки: грузится по
 * первому раскрытию карточки.
 */
export interface Primer11 {
  uslovieHtml: string;
  shagi: Shag[];
  otvet: string;
}

export async function primer11(id: string, klyuch: string): Promise<Primer11 | null> {
  await ZAGRUZKA11.zagruzit([id]);
  const z = ZAGRUZKA11.izKesha(klyuch);
  if (z === undefined) {
    return null;
  }
  const r = ZAGRUZKA11.reshenie(z);
  if (r === null) {
    return null;
  }
  return {
    uslovieHtml: ZAGRUZKA11.nabrat(z.text),
    shagi: shagi11(r),
    otvet: otvetPrimera11(r, z.vybory),
  };
}
