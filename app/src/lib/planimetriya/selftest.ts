/**
 * Самотест движка планиметрических чертежей. Запускает
 * scripts/check-planimetriya.mjs.
 *
 * 1. Образцы: сцена каждого прототипа на числах первой задачи
 *    открытого банка во всех режимах — лист ученика, каждый шаг
 *    подсказки, лист учителя.
 * 2. Стресс-тест: N случайных генераций (параметры, поворот,
 *    отражение, переименование букв), все режимы.
 *
 * На каждом рисунке:
 *   — движок не записал нарушений (подписи, вырожденность, углы
 *     меньше порога, ответ на рисунке, проверки условия);
 *   — подписи заново проверены по линиям из отчёта: ни одна не
 *     касается линии, кривой, точки и другой подписи (зазор ≥ PL.gap);
 *   — в SVG нет NaN и Infinity;
 *   — на листе ученика нет элементов подсказок и решения, нет
 *     пунктира вспомогательных построений и нет значений;
 *   — переименование букв согласовано: на рисунке ровно новые буквы,
 *     условие после замены не содержит старых имён.
 */

import { rngOf } from '../vychisleniya/rng';
import { POROG } from './figury';
import { blizhayshee, rectGap } from './kollizii';
import { PL, pustoyOtchet, renderPlan, shagovPodskazki } from './render';
import { PROTOTIPY, type PrototipChertezha } from './stseny';
import type { Params } from './stseny/dsl';
import type { Otchet, Rezhim, Scena, Variant } from './types';
import { pereimenovat, sluchaynyyVariant } from './variant';

export interface Itog {
  risunkov: number;
  problems: string[];
}

function rezhimy(scena: Scena): Rezhim[] {
  const n = shagovPodskazki(scena);
  return [
    { rezhim: 'uchenik' },
    ...Array.from({ length: n }, (_, i) => ({ rezhim: 'podskazka' as const, shag: i + 1 })),
    { rezhim: 'uchitel' },
  ];
}

function imyaRezhima(r: Rezhim): string {
  return r.rezhim === 'podskazka'
    ? `подсказка ${r.shag}`
    : r.rezhim === 'uchenik'
      ? 'ученик'
      : 'учитель';
}

/** Независимая проверка подписей по линиям из отчёта. */
export function proveritPodpisi(o: Otchet): string[] {
  const out: string[] = [];
  const pr = (r: Otchet['ramki'][number]) => ({
    left: r.x,
    top: r.y,
    right: r.x + r.w,
    bottom: r.y + r.h,
  });
  for (let i = 0; i < o.ramki.length; i += 1) {
    const r = o.ramki[i]!;
    const b = blizhayshee(pr(r), o.prepyatstviya);
    if (b.min < PL.gap - 1e-6)
      out.push(`подпись ${r.id} ближе ${PL.gap} px к: ${b.chto} (${b.min.toFixed(2)})`);
    for (let j = i + 1; j < o.ramki.length; j += 1) {
      const g = rectGap(pr(r), pr(o.ramki[j]!));
      if (g < PL.gap - 1e-6) out.push(`подписи ${r.id} и ${o.ramki[j]!.id} перекрываются`);
    }
  }
  return out;
}

function proveritRisunok(
  svg: string,
  o: Otchet,
  scena: Scena,
  rezhim: Rezhim,
  variant: Variant | undefined,
): string[] {
  const out = [...o.problems, ...proveritPodpisi(o)];
  if (/NaN|Infinity/.test(svg)) out.push('в SVG есть NaN или Infinity');
  if (rezhim.rezhim === 'uchenik') {
    if (/pl-shag|pl-reshenie|pl-novoe/.test(svg))
      out.push('на листе ученика элементы подсказки или решения');
    if (svg.includes(`stroke-dasharray="${PL.dash.punktir}"`))
      out.push('на листе ученика пунктир построения');
    if (o.ramki.some((r) => r.kind === 'znachenie')) out.push('на листе ученика числа на чертеже');
  }
  if (variant) {
    const bukvy = o.ramki
      .filter((r) => r.kind === 'tochka')
      .map((r) => variant.bukvy[r.id] ?? r.id);
    const teksty = new Set(o.teksty);
    for (const b of bukvy)
      if (!teksty.has(b)) out.push(`буква ${b} не выведена после переименования`);
  }
  void scena;
  return out;
}

function proverkaPrototipa(
  p: PrototipChertezha,
  params: Params,
  variant: Variant | undefined,
  metka: string,
): Itog {
  const problems: string[] = [];
  let risunkov = 0;
  let scena: Scena;
  try {
    scena = p.stsena(params, POROG);
  } catch (e) {
    return { risunkov: 0, problems: [`${metka}: сцена не строится: ${(e as Error).message}`] };
  }
  for (const r of rezhimy(scena)) {
    const o = pustoyOtchet();
    let svg: string;
    try {
      svg = renderPlan(scena, { rezhim: r, variant }, o);
    } catch (e) {
      problems.push(`${metka}, ${imyaRezhima(r)}: ошибка движка: ${(e as Error).message}`);
      continue;
    }
    risunkov += 1;
    for (const x of proveritRisunok(svg, o, scena, r, variant))
      problems.push(`${metka}, ${imyaRezhima(r)}: ${x}`);
  }
  if (variant) {
    const usl = pereimenovat(p.uslovie(params), variant.bukvy);
    const novye = new Set(Object.values(variant.bukvy));
    for (const [star] of Object.entries(variant.bukvy)) {
      /* Старая буква могла остаться только если она же — чья-то новая. */
      const vne = usl
        .replace(/\\[a-zA-Z]+/g, '')
        .match(new RegExp(`\\b${star}\\b|${star}(?=[A-Z])|(?<=[A-Z])${star}`));
      if (vne && !novye.has(star))
        problems.push(`${metka}: в условии осталась старая буква ${star}`);
    }
  }
  return { risunkov, problems };
}

/** Образцы: первая задача открытого банка каждого прототипа. */
export function checkObraztsy(): Itog {
  const itog: Itog = { risunkov: 0, problems: [] };
  const id = new Set<number>();
  for (const p of PROTOTIPY) {
    if (id.has(p.id)) itog.problems.push(`прототип ${p.id} повторяется`);
    id.add(p.id);
    const r = proverkaPrototipa(p, p.primer as Params, undefined, `прототип ${p.id} (образец)`);
    itog.risunkov += r.risunkov;
    itog.problems.push(...r.problems);
    const otvet = p.otvet(p.primer as Params);
    if (!Number.isFinite(otvet)) itog.problems.push(`прототип ${p.id}: ответ образца не число`);
  }
  for (let i = 1; i <= 49; i += 1)
    if (!id.has(i)) itog.problems.push(`нет прототипа ${i} из Блока 1`);
  return itog;
}

/** Стресс-тест: n случайных генераций по всем прототипам. */
export function checkStress(n: number, seed = 'planimetriya'): Itog {
  const itog: Itog = { risunkov: 0, problems: [] };
  const rng = rngOf(seed);
  for (let i = 0; i < n; i += 1) {
    const p = PROTOTIPY[i % PROTOTIPY.length]!;
    const params = { ...(p.primer as Params), ...p.sluchaynye(rng) } as Params;
    let scena: Scena;
    try {
      scena = p.stsena(params, POROG);
    } catch (e) {
      itog.problems.push(
        `генерация ${i}, прототип ${p.id} ${JSON.stringify(params)}: ${(e as Error).message}`,
      );
      continue;
    }
    const variant = sluchaynyyVariant(rng, Object.keys(scena.tochki), p.diapazon);
    const r = proverkaPrototipa(
      p,
      params,
      variant,
      `генерация ${i}, прототип ${p.id} ${JSON.stringify(params)} поворот ${variant.povorot}${variant.otrazhenie ? ' отражение' : ''}`,
    );
    itog.risunkov += r.risunkov;
    itog.problems.push(...r.problems);
  }
  return itog;
}
