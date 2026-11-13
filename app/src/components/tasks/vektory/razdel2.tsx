'use client';

import { ShagiResheniya, type Shag } from '../steklo';
import type { RazdelBanka } from '../trening/bank/types';
import { TRENAZHER2 } from '@/content/vektory2';
import { zadachaHref2 } from '@/lib/vektory/links';
import { readSealed2 } from '@/lib/vektory/trening/otvet2';
import { log2, vybor2 } from '@/lib/vektory/trening/progress';
import { KLYUCH2 } from '@/lib/vektory/trening/session';
import { ZAGRUZKA2, type Reshenie2, type Zadacha2 } from '@/lib/vektory/trening/zagruzka';
import { RisunokSvg, shagiIz2 } from './shagi2';

const T = TRENAZHER2;

/** Шаг, к которому ставится рисунок с катетами: координаты с рисунка, иначе первый. */
function sRisunkom(shagi: Shag[], risunokSvg: string | null): Shag[] {
  if (risunokSvg === null || shagi.length === 0) {
    return shagi;
  }
  const k = Math.max(
    0,
    shagi.findIndex((s) => /по рисунку|по проекциям/.test(s.zagolovok ?? '')),
  );
  return shagi.map((s, i) => (i === k ? { ...s, risunok: <RisunokSvg svg={risunokSvg} /> } : s));
}

/** Решение по шагам: шаги генератора дословно, рисунок с катетами — в шаге с координатами. */
function shagi2(s: Reshenie2): Shag[] {
  return sRisunkom(shagiIz2(s.shagi), s.risunokSvg);
}

/**
 * Подсказка №2 — как была: шаги решения по одному, с первым шагом —
 * рисунок с катетами. Шаг «Ответ» в подсказку не входит: его даёт
 * решение.
 */
function Podskazka2({
  s,
  otkryto,
  dalshe,
}: {
  s: Reshenie2;
  otkryto: number;
  dalshe: () => void;
}) {
  const vse = sRisunkom(shagiIz2(s.shagi, { bezOtveta: true }), s.risunokSvg);
  const n = Math.min(Math.max(otkryto, 1), vse.length);
  return (
    <div className="z2-podskazka">
      <p className="stk-podpis">{T.ekran.shagPodskazki(n, vse.length)}</p>
      <ShagiResheniya shagi={vse.slice(0, n)} />
      {n < vse.length ? (
        <button type="button" className="stk-btn stk-btn--tihaya" onClick={dalshe}>
          {T.ekran.sleduyushchiyShag}
        </button>
      ) : null}
    </div>
  );
}

/**
 * №2 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, генератор в браузере вместо файлов задач,
 * проверка ответа по отпечатку, рисунок условия без катетов, решение и
 * подсказка шагами. Источника задач нет — все задачи строит генератор.
 */
export const RAZDEL2: RazdelBanka<Zadacha2, Reshenie2> = {
  razdel: '2',
  klyuch: KLYUCH2,
  log: log2,
  vybor: vybor2,
  zagruzka: ZAGRUZKA2,
  T,
  proverit: readSealed2,
  pod: (z) =>
    z.risunokSvg === null ? null : (
      <div className="trn-risunok trn-risunok--vektory">
        <RisunokSvg svg={z.risunokSvg} />
      </div>
    ),
  shagi: shagi2,
  voprosy: () => [],
  podskazka: (s, ui) => <Podskazka2 s={s} otkryto={ui.otkryto} dalshe={ui.dalshe} />,
  zadachaHref: zadachaHref2,
  bezIstochnika: true,
};
