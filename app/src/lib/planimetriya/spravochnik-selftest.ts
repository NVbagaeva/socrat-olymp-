/**
 * Самотест нового справочника задания №1 (content/spravochnik1):
 *
 *   — карточки с уникальными якорями, у каждой есть содержание;
 *     «Как применять» — 2–4 хода, «Пример» — не больше двух разборов;
 *   — «Где на ЕГЭ» ссылается на существующие прототипы и вместе
 *     покрывает все прототипы 1–75;
 *   — старые якоря прежней теории (content/teoriya1.ts) ведут на
 *     новые карточки — ссылки «Повторить теорию» не ломаются;
 *   — ответ каждого разбора совпадает с ответом задачи банка или
 *     аналога, которую он разбирает; прототип этой задачи стоит в
 *     «Где на ЕГЭ» той же карточки;
 *   — обязательные пункты задания (смежные и вертикальные углы,
 *     биссектриса угла и треугольника, параллельные прямые с
 *     нумерацией углов 1–8, «Свойство или признак?», внешний угол,
 *     теоремы косинусов и синусов) собраны полностью;
 *   — все тексты и формулы набираются KaTeX в строгом режиме, в
 *     формулах нет «1x», «+ −» и лишних скобок.
 *
 * Тексты отдаются наружу (tekstySpravochnika): автотест сверяет их со
 * сторонним справочником — не больше восьми слов подряд.
 */

import {
  RAZDELY_SPRAVOCHNIKA_1,
  TEMY_SPRAVOCHNIKA_1,
  novayaTema1,
  type Primer,
  type Tema1,
} from '../../content/spravochnik1';
import { KARTOCHKI_1 } from '../../content/teoriya1';
import { typeset } from '../tex';
import { analogi } from './bank/analogi';
import { BANK_FIPI } from './bank/fipi';
import { gigienaFormuly } from './bank/selftest';
import { PROTOTIPY } from './stseny';
import type { Params } from './stseny/dsl';

type Typeset = (tex: string) => string;

/** Все тексты справочника, которые видит ученик (без формул отдельной строкой). */
export function tekstySpravochnika(): string[] {
  const out: string[] = [];
  for (const r of RAZDELY_SPRAVOCHNIKA_1) {
    out.push(r.title, r.lead);
    for (const t of r.temy) {
      out.push(t.title);
      for (const u of [...(t.opredeleniya ?? []), ...(t.svoystva ?? []), ...(t.priznaki ?? [])])
        out.push(u.tekst);
      for (const th of t.teoremy ?? [])
        out.push(...(th.nazvanie === undefined ? [] : [th.nazvanie]), th.slovami);
      out.push(...(t.primenenie ?? []), ...(t.vazhno ?? []));
      for (const p of t.primery ?? []) {
        out.push(p.title);
        if ('svoy' in p.istochnik) out.push(p.istochnik.svoy.uslovie);
        for (const s of p.shagi) out.push(s.etap, ...(s.tekst === undefined ? [] : [s.tekst]));
      }
    }
  }
  return out;
}

/** Формулы отдельной строкой: утверждения, теоремы, выкладки, ответы. */
function formulySpravochnika(): string[] {
  const out: string[] = [];
  for (const t of TEMY_SPRAVOCHNIKA_1) {
    for (const u of [...(t.opredeleniya ?? []), ...(t.svoystva ?? []), ...(t.priznaki ?? [])])
      if (u.formula !== undefined) out.push(u.formula);
    for (const th of t.teoremy ?? []) out.push(th.formula);
    for (const p of t.primery ?? []) {
      for (const s of p.shagi) out.push(...(s.tex ?? []));
      out.push(p.otvet);
    }
  }
  return out;
}

/** Условие и ответ задачи, которую разбирает пример. */
export function zadachaPrimera(p: Primer): {
  uslovie: string;
  otvet: number | null;
  proto: number | null;
  metka: string;
} {
  const ist = p.istochnik;
  if ('svoy' in ist)
    return { uslovie: ist.svoy.uslovie, otvet: null, proto: null, metka: 'свой пример' };
  if ('fipi' in ist) {
    const z = BANK_FIPI.find((x) => x.n === ist.fipi);
    if (z === undefined) throw new Error(`нет задачи ${ist.fipi} в банке`);
    const pr = PROTOTIPY.find((x) => x.id === z.proto);
    if (pr === undefined) throw new Error(`нет прототипа ${z.proto}`);
    const params = { ...pr.primer, ...z.params } as Params;
    return {
      uslovie: pr.uslovie(params),
      otvet: pr.otvet(params),
      proto: z.proto,
      metka: `открытый банк, задача ${z.n}`,
    };
  }
  const { proto, no } = ist.analog;
  const pr = PROTOTIPY.find((x) => x.id === proto);
  if (pr === undefined) throw new Error(`нет прототипа ${proto}`);
  const a = analogi(proto).find((x) => x.no === no);
  if (a === undefined) throw new Error(`нет аналога ${no} прототипа ${proto}`);
  const params = { ...pr.primer, ...a.params } as Params;
  return {
    uslovie: pr.uslovie(params),
    otvet: pr.otvet(params),
    proto,
    metka: `аналог ${no} прототипа ${proto}, не из открытого банка`,
  };
}

/** Число из ответа в TeX: «118^\circ» → 118, «1{,}5» → 1.5; null — не число. */
export function chisloOtveta(tex: string): number | null {
  const s = tex
    .replace(/\^\\circ/g, '')
    .replace(/\{,\}/g, '.')
    .trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function blokov(t: Tema1): number {
  return (
    (t.opredeleniya?.length ?? 0) +
    (t.svoystva?.length ?? 0) +
    (t.priznaki?.length ?? 0) +
    (t.teoremy?.length ?? 0)
  );
}

/** Обязательные пункты задания: что должно быть в карточке. */
function proveritObyazatelnoe(problems: string[]): void {
  const t = (id: string) => TEMY_SPRAVOCHNIKA_1.find((x) => x.id === id);
  const nuzhno = (id: string, chto: string, ok: (x: Tema1) => boolean) => {
    const x = t(id);
    if (x === undefined) problems.push(`нет обязательной карточки «${id}»`);
    else if (!ok(x)) problems.push(`карточка «${id}»: ${chto}`);
  };
  const est = (s: readonly { tekst: string }[] | undefined, re: RegExp) =>
    (s ?? []).some((u) => re.test(u.tekst));

  nuzhno(
    'smezhnye',
    'нужны определение и свойство «сумма 180°»',
    (x) => est(x.opredeleniya, /общая/) && est(x.svoystva, /180/),
  );
  nuzhno(
    'vertikalnye',
    'нужны определение и свойство «равны»',
    (x) => (x.opredeleniya?.length ?? 0) > 0 && est(x.svoystva, /равны/),
  );
  nuzhno(
    'bissektrisa-ugla',
    'нужны оба определения: луч и отрезок',
    (x) =>
      est(x.opredeleniya, /\*\*Биссектриса угла\*\* — луч/) &&
      est(x.opredeleniya, /\*\*Биссектриса треугольника\*\* — отрезок/),
  );
  nuzhno(
    'parallelnye',
    'нумерация пар углов не та',
    (x) =>
      est(x.opredeleniya, /накрест лежащие\*\*.*\$3\$ и \$5\$, \$4\$ и \$6\$/i) &&
      est(x.opredeleniya, /\$1\$ и \$5\$, \$2\$ и \$6\$, \$3\$ и \$7\$, \$4\$ и \$8\$/) &&
      est(x.opredeleniya, /односторонние\*\*.*\$4\$ и \$5\$, \$3\$ и \$6\$/i),
  );
  nuzhno(
    'parallelnye',
    'нужны три свойства и три признака',
    (x) =>
      (x.svoystva?.length ?? 0) === 3 && (x.priznaki?.length ?? 0) === 3 && x.shirokaya === true,
  );
  nuzhno(
    'svoystvo-ili-priznak',
    'нужны оба определения и пример на параллельных',
    (x) =>
      est(x.opredeleniya, /\*\*Признак\*\*/) &&
      est(x.opredeleniya, /\*\*Свойство\*\*/) &&
      (x.primery?.length ?? 0) > 0,
  );
  nuzhno(
    'vneshniy-ugol',
    'нужны определение, теорема, три хода и два примера',
    (x) =>
      (x.opredeleniya?.length ?? 0) > 0 &&
      (x.teoremy?.length ?? 0) > 0 &&
      (x.primenenie?.length ?? 0) === 3 &&
      (x.primery?.length ?? 0) === 2,
  );
  nuzhno(
    'teorema-kosinusov',
    'нужны теорема словами и три хода',
    (x) => (x.teoremy?.[0]?.slovami.length ?? 0) > 40 && (x.primenenie?.length ?? 0) >= 3,
  );
  nuzhno(
    'teorema-sinusov',
    'нужны 2R в формуле, три хода и «Важно» про синусы смежных углов',
    (x) =>
      /2R/.test(x.teoremy?.[0]?.formula ?? '') &&
      (x.primenenie?.length ?? 0) >= 2 &&
      (x.vazhno ?? []).some((v) => v.includes('180^\\circ - \\alpha')),
  );
}

export interface ItogSpravochnika {
  razdelov: number;
  kartochek: number;
  primerov: number;
  problems: string[];
}

export function checkSpravochnik(katex: Typeset): ItogSpravochnika {
  const problems: string[] = [];
  const ids = new Set<string>();
  let primerov = 0;

  for (const t of TEMY_SPRAVOCHNIKA_1) {
    if (ids.has(t.id)) problems.push(`карточка «${t.id}» повторяется`);
    ids.add(t.id);
    if (!/^[a-z0-9-]+$/.test(t.id)) problems.push(`карточка «${t.id}»: якорь не латиницей`);
    if (blokov(t) === 0)
      problems.push(`карточка «${t.id}»: нет ни определения, ни свойства, ни теоремы`);
    if (t.chertezh === undefined) problems.push(`карточка «${t.id}»: нет описания чертежа`);
    const n = t.primenenie?.length;
    if (n !== undefined && (n < 2 || n > 4))
      problems.push(`карточка «${t.id}»: «Как применять» — ${n} ходов, нужно 2–4`);
    if ((t.primery?.length ?? 0) > 2) problems.push(`карточка «${t.id}»: больше двух примеров`);
    for (const p of t.prototipy)
      if (!PROTOTIPY.some((x) => x.id === p))
        problems.push(`карточка «${t.id}»: нет прототипа ${p}`);

    for (const p of t.primery ?? []) {
      primerov += 1;
      const metka = `карточка «${t.id}», пример «${p.title}»`;
      let z: ReturnType<typeof zadachaPrimera>;
      try {
        z = zadachaPrimera(p);
      } catch (e) {
        problems.push(`${metka}: ${(e as Error).message}`);
        continue;
      }
      if (p.shagi.length === 0) problems.push(`${metka}: нет шагов`);
      const chislo = p.znachenie ?? chisloOtveta(p.otvet);
      if (z.otvet !== null) {
        if (chislo === null) problems.push(`${metka}: ответ «${p.otvet}» не число`);
        else if (Math.abs(chislo - z.otvet) > 1e-6)
          problems.push(`${metka}: ответ ${chislo}, а у задачи (${z.metka}) — ${z.otvet}`);
        if (z.proto !== null && !t.prototipy.includes(z.proto))
          problems.push(`${metka}: прототипа ${z.proto} нет в «Где на ЕГЭ» карточки`);
      }
    }
  }

  for (const p of PROTOTIPY)
    if (!TEMY_SPRAVOCHNIKA_1.some((t) => t.prototipy.includes(p.id)))
      problems.push(`прототип ${p.id}: ни одна карточка не ссылается на него («Где на ЕГЭ»)`);

  for (const k of KARTOCHKI_1)
    if (novayaTema1(k.id) === undefined)
      problems.push(`старая карточка «${k.id}»: нет новой, на которую вести её якорь`);

  proveritObyazatelnoe(problems);

  for (const f of formulySpravochnika()) {
    try {
      katex(f);
    } catch (e) {
      problems.push(`формула «${f}»: ${(e as Error).message}`);
    }
    const g = gigienaFormuly(f);
    if (g !== null) problems.push(`формула «${f}»: ${g}`);
  }
  for (const s of tekstySpravochnika()) {
    try {
      typeset(s, true);
    } catch (e) {
      problems.push(`текст «${s}»: ${(e as Error).message}`);
    }
  }

  return {
    razdelov: RAZDELY_SPRAVOCHNIKA_1.length,
    kartochek: TEMY_SPRAVOCHNIKA_1.length,
    primerov,
    problems,
  };
}
