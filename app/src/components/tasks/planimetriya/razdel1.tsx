'use client';

import { FigureZoom } from '@/components/ui';
import { TRENAZHER1 } from '@/content/planimetriya1';
import { estPi } from '@/lib/zadanie7/otvet';
import { KLYUCH1, prezhnyayaZapis1 } from '@/lib/planimetriya/trening/klyuch';
import { zadachaHref1 } from '@/lib/planimetriya/trening/links';
import { readSealed1 } from '@/lib/planimetriya/trening/otvet1';
import { log1, vybor1 } from '@/lib/planimetriya/trening/progress';
import type { Reshenie1T, Zadacha1T } from '@/lib/planimetriya/trening/sborka';
import { ZAGRUZKA1 } from '@/lib/planimetriya/trening/zagruzka';
import type { Shag } from '../steklo';
import type { RazdelBanka, SostoyaniePod } from '../trening/bank/types';

/** Чертёж движка в окне на весь экран по нажатию (мелкие подписи на телефоне). */
function Chertezh({ svg, label }: { svg: string; label: string }) {
  return (
    <FigureZoom className="z1-trn__chertezh" label={label}>
      <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
    </FigureZoom>
  );
}

/**
 * Под условием задачи №1 — чертёж, как в прежнем тренажёре: на вопросе
 * подсказки он показывает слой этого шага (нужный элемент подсвечен),
 * при открытом решении — все построения, иначе — чертёж условия, как в
 * ФИПИ. Ниже — откуда задача.
 */
function Pod1({ z, sost }: { z: Zadacha1T; sost: SostoyaniePod<Reshenie1T> }) {
  const r = sost.razbor;
  let svg = z.risunokSvg;
  let label = TRENAZHER1.ekran.risunok;
  if (r !== null && sost.reshenie) {
    svg = r.uchitelSvg;
    label = TRENAZHER1.ekran.risunokReshenie;
  } else if (r !== null && sost.podskazka && r.voprosy.length > 0) {
    const i = Math.min(sost.shag, r.voprosy.length) - 1;
    svg = r.voprosy[i]?.risunokSvg ?? svg;
    label = TRENAZHER1.ekran.risunokPodskazka(i + 1);
  }
  return (
    <>
      <div className="trn-risunok z1-trn__risunok" aria-live="polite">
        <Chertezh svg={svg} label={label} />
      </div>
      <p className="trn-istochnik">
        {z.fipi === null ? TRENAZHER1.ekran.neIzBanka : TRENAZHER1.ekran.bank(z.fipi)}
      </p>
    </>
  );
}

/** Разбор №1 → шаги сцены: подпись этапа, пояснения, выкладки и чертёж шага. */
export function shagiIzResheniya1(s: Reshenie1T): Shag[] {
  return s.shagi.map((shag) => ({
    zagolovokHtml: shag.zagolovok,
    chtoHtml: shag.tekst.map((t) => `<p>${t}</p>`).join(''),
    formulaHtml: shag.formuly.join(''),
    ...(shag.risunokSvg === null
      ? {}
      : { risunok: <Chertezh svg={shag.risunokSvg} label={TRENAZHER1.ekran.risunokShaga} /> }),
  }));
}

/** Под шагами: признаки делимости (если сокращали) и сверка с рисунком. */
export function posle1(s: Reshenie1T) {
  const sokr = s.shagi.flatMap((shag) => shag.sokrashchenie);
  return (
    <>
      {sokr.length === 0 ? null : (
        <details className="trn-posle">
          <summary className="stk-summary">
            {TRENAZHER1.ekran.priznaki}
            <span className="stk-shevron" aria-hidden="true" />
          </summary>
          <ul>
            {sokr.map((k, i) => (
              <li key={i}>
                <span dangerouslySetInnerHTML={{ __html: k.tekst }} />
                {k.formula === '' ? null : (
                  <span
                    className="trn-posle__tex"
                    dangerouslySetInnerHTML={{ __html: k.formula }}
                  />
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="z1-trn__sverka">
        <b>{TRENAZHER1.ekran.sverka}.</b>{' '}
        <span dangerouslySetInnerHTML={{ __html: s.sverkaHtml }} />
      </p>
    </>
  );
}

/**
 * №1 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, журнал, загрузчик на движке планиметрии, проверка ответа,
 * чертёж условия по слоям подсказки, разбор шагами с чертежами и
 * подсказки-вопросы. Читает и незаконченную тренировку прежнего
 * тренажёра (панель фильтров).
 */
export const RAZDEL1: RazdelBanka<Zadacha1T, Reshenie1T> = {
  razdel: '1',
  klyuch: KLYUCH1,
  log: log1,
  vybor: vybor1,
  zagruzka: ZAGRUZKA1,
  T: TRENAZHER1,
  proverit: (vvod, seal) => (estPi(vvod) ? { kind: 'pi' } : readSealed1(vvod, seal)),
  pod: (z, _rezhim, sost) => <Pod1 z={z} sost={sost} />,
  shagi: shagiIzResheniya1,
  posle: posle1,
  voprosy: (s) => s.voprosy,
  zadachaHref: zadachaHref1,
  prezhnyayaZapis: prezhnyayaZapis1,
};
