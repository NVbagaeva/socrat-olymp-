'use client';

import { useMemo } from 'react';
import { ShagiResheniya } from '../../steklo';
import type { TekstyTrenazhera45 } from '@/content/veroyatnost45';
import { otkrytRazbor } from '@/lib/veroyatnost/razbor';
import { openText } from '@/lib/veroyatnost/secret';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { useSRazborami } from '../razboryKlient';
import type { SessiyaZadacha } from '../sessiyaPayload';
import { risunok45, shagi45 } from './shagi45';

/**
 * Разбор задачи на итогах: ответ, решение по шагам и рисунок метода —
 * те же, что на экране задачи. Разбор запечатан и догружается файлом
 * прототипа (обычно он уже в кеше экрана тренировки).
 */
export function RazborItog45({
  task,
  zadanie,
  versiya,
  T,
}: {
  task: SessiyaZadacha;
  zadanie: Zadanie45;
  versiya: string;
  T: TekstyTrenazhera45;
}) {
  const odna = useMemo(() => [task], [task]);
  const { sostoyanie, povtorit } = useSRazborami(odna, zadanie, versiya);
  const gotovaya = typeof sostoyanie === 'object' ? sostoyanie.gotovo[0] : undefined;
  const razbor = useMemo(
    () => (gotovaya === undefined ? null : otkrytRazbor(gotovaya.steps, gotovaya.seal)),
    [gotovaya],
  );
  if (sostoyanie === 'oshibka') {
    return (
      <div role="alert">
        <p>{T.ekran.oshibkaZagruzki}</p>
        <button type="button" className="stk-btn stk-btn--tihaya" onClick={povtorit}>
          {T.ekran.povtorit}
        </button>
      </div>
    );
  }
  if (razbor === null) {
    return <p role="status">{T.ekran.zagruzka}</p>;
  }
  return (
    <div className="z45-itog-razbor">
      <p className="kz-otvet">
        {T.itogi.otvet}: <b>{razbor.otvet}</b>
      </p>
      <ShagiResheniya
        shagi={shagi45(razbor)}
        posle={
          <>
            {razbor.metod === '' ? null : (
              <p className="z45-metod">
                <b>{T.ekran.metod}:</b> {razbor.metod}
              </p>
            )}
            {risunok45(razbor, true, T.ekran.risunok)}
          </>
        }
      />
    </div>
  );
}

/** Разбор «Узнай метод» на итогах: верный метод и признаки в условии. */
export function UznayItog45({
  task,
  verny,
  T,
}: {
  task: SessiyaZadacha;
  verny: string;
  T: TekstyTrenazhera45;
}) {
  const priznaki = useMemo(() => {
    try {
      return JSON.parse(openText(task.hints, task.metodSeal)) as string[];
    } catch {
      return [];
    }
  }, [task]);
  return (
    <div className="z45-priznaki">
      <p>
        {T.uznay.pravilnyy} <b>{verny}</b>
      </p>
      <p className="stk-podpis">{T.uznay.priznaki}</p>
      <ul>
        {priznaki.map((p) => (
          <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </ul>
    </div>
  );
}
