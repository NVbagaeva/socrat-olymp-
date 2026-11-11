/**
 * Разобранный пример типа №3 для вкладки «О задании»: то, что уезжает
 * в браузер, когда ученик раскрыл карточку типа.
 *
 * Пример — тот же, что на прежней странице разбора
 * (lib/stereo/razbory3.ts): задача открытого банка, модель чертежа с
 * шагами и решение «что делаем — почему — формула». Формулы набраны
 * KaTeX на сборке; первый кадр чертежа нарисован на сборке, дальше
 * чертёж живёт в браузере (вращение, подсветка шага).
 */

import { TIPY3 } from '@/content/zadanie3/gruppy';
import type { Model } from '../solid/model';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '../solid/project';
import { renderSolid } from '../solid/render';
import { RAZBORY_3 } from '../stereo/razbory3';
import { typeset } from '../tex';

export interface PrimerShag3 {
  /** Что делаем и почему: HTML. */
  chtoHtml: string;
  /** Формулы шага: HTML, каждая своей строкой. */
  formulaHtml: string;
}

export interface Primer3 {
  tip: string;
  uslovieHtml: string;
  shagi: PrimerShag3[];
  /** Ответ, HTML. */
  otvetHtml: string;
  /** «Где теряют балл», HTML. */
  opasnoHtml: string;
  model: Model;
  /** Первый кадр чертежа (условие): нарисован на сборке. */
  svg: string;
  azimuth: number;
  elevation: number;
  /** Сколько шагов у чертежа: последние шаги текста бывают чистым вычислением. */
  shagovChertezha: number;
}

function shagovNaChertezhe(m: Model): number {
  const items = [
    ...(m.lines ?? []),
    ...(m.sections ?? []),
    ...(m.angles ?? []),
    ...(m.marks ?? []),
    ...(m.measures ?? []),
    ...(m.notes ?? []),
  ];
  return Math.max(0, ...items.map((x) => x.shag ?? 0));
}

const okruglit = (model: Model): Model =>
  JSON.parse(
    JSON.stringify(model, (_k, v: unknown) =>
      typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v,
    ),
  ) as Model;

export function primer3(tip: string): Primer3 | null {
  const razbor = RAZBORY_3.find((r) => r.tip === tip);
  const teksty = TIPY3[tip];
  if (razbor === undefined || teksty === undefined) {
    return null;
  }
  const model = okruglit(razbor.model());
  const n = shagovNaChertezhe(model);
  return {
    tip,
    uslovieHtml: typeset(razbor.uslovie),
    shagi: razbor.shagi.map((s) => ({
      chtoHtml: `<b>${typeset(s.chto)}.</b> ${s.zachem.map((p) => typeset(p)).join(' ')}`,
      formulaHtml: (s.formuly ?? []).map((f) => `<div>${typeset(`$${f}$`)}</div>`).join(''),
    })),
    otvetHtml: typeset(razbor.otvetTex ?? `$${String(razbor.otvet).replace('.', '{,}')}$`),
    opasnoHtml: typeset(teksty.opasno),
    model,
    svg: renderSolid(model, {
      view: orthoAt(ORTHO_AZIMUTH, ORTHO_ELEVATION),
      ustoychivo: true,
      tema: 'ekran',
      ...(n > 0 ? { shag: 0 } : {}),
    }),
    azimuth: ORTHO_AZIMUTH,
    elevation: ORTHO_ELEVATION,
    shagovChertezha: n,
  };
}
