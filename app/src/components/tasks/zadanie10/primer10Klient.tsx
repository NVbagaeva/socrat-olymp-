import { ZAGRUZKA10 } from '@/lib/zadanie10/trening/zagruzka';
import type { Shag } from '../steklo';
import { otvetTekstom, shagiIzResheniya10 } from './shagi10';

/**
 * Разобранный пример прототипа №10, собранный в браузере: задача банка
 * (ключ выбирает сервер — первая задача ФИПИ, нет — первый аналог) и её
 * решение решателем прототипа. Картинку сюжета и чертёж моста рисует
 * сервер. Отдельный кусок сборки: грузится по первому раскрытию карточки.
 */
export interface Primer10 {
  uslovieHtml: string;
  shagi: Shag[];
  otvet: string;
}

export async function primer10(id: string, klyuch: string): Promise<Primer10 | null> {
  await ZAGRUZKA10.zagruzit([id]);
  const z = ZAGRUZKA10.izKesha(klyuch);
  if (z === undefined) {
    return null;
  }
  const s = ZAGRUZKA10.reshenie(z);
  if (s === null) {
    return null;
  }
  return {
    uslovieHtml: ZAGRUZKA10.nabrat(z.text),
    shagi: shagiIzResheniya10(s),
    otvet: otvetTekstom(s.answer),
  };
}
