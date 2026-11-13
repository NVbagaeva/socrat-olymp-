import type { ReactNode } from 'react';
import { ZAGRUZKA6 } from '@/lib/zadanie6/trening/zagruzka';
import type { Shag } from '../steklo';
import { Ris6 } from './Ris6';
import { otvetTekstom, shagiIzResheniya6 } from './shagi6';

/**
 * Разобранный пример прототипа №6, собранный в браузере: задача банка
 * (ключ выбирает сервер — первая исходная, нет — первый аналог), её
 * рисунок, вопрос после рисунка и решение решателем прототипа.
 * Отдельный кусок сборки: грузится по первому раскрытию карточки.
 */
export interface Primer6 {
  uslovieHtml: string;
  risunok?: ReactNode;
  shagi: Shag[];
  otvet: string;
}

export async function primer6(id: string, klyuch: string): Promise<Primer6 | null> {
  await ZAGRUZKA6.zagruzit([id]);
  const proto = ZAGRUZKA6.prototip(id);
  const z = ZAGRUZKA6.izKesha(klyuch);
  if (z === undefined || proto === null) {
    return null;
  }
  const s = ZAGRUZKA6.reshenie(z);
  if (s === null) {
    return null;
  }
  const ris = proto.ris(z.params);
  const posle = z.posle;
  const risunok =
    ris === undefined && posle === undefined ? undefined : (
      <>
        {ris === undefined ? null : <Ris6 ris={ris} />}
        {posle === undefined ? null : (
          <div
            className="kz-uslovie"
            dangerouslySetInnerHTML={{ __html: ZAGRUZKA6.nabrat(posle) }}
          />
        )}
      </>
    );
  return {
    uslovieHtml: ZAGRUZKA6.nabrat(z.text),
    ...(risunok === undefined ? {} : { risunok }),
    shagi: shagiIzResheniya6(s),
    otvet: otvetTekstom(s.answer),
  };
}
