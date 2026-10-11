/**
 * Задача тренажёра и листа №1 — собирается в браузере.
 *
 * Задача банка приходит числами без ответа (номер, прототип,
 * параметры), аналог — так же, новая задача — прототип и seed. Здесь
 * движок строит чертёж, считает ответ и решение и тут же закрывает
 * ответ отпечатком: в состояние экрана уходят условие, чертёж
 * условия, отпечаток и два закрытых блока — вопросы подсказки (с
 * чертежом нужного шага) и решение по шагам (с чертежом учителя).
 * Числа ответа в открытом виде нигде нет.
 *
 * Задача банка выглядит как в ФИПИ: без поворота и с прежними
 * буквами. Аналог и новая задача — вариант генератора: фигура
 * повёрнута, может быть отражена, точки названы другими буквами —
 * согласованно в чертеже, условии, подсказках и решении.
 *
 * Модуль тяжёлый (движок, решения, KaTeX): экран тренажёра
 * подгружает его только по «Начать тренировку».
 */

import { katex } from '../../graph/katex';
import { typesetKrupno as typeset } from '../../tex';
import { rngOf } from '../../vychisleniya/rng';
import { chertezhChist, GENERATORY, otvetEge } from '../bank/analogi';
import { zadachiPrototipa } from '../bank/fipi';
import { izmerit } from '../bank/proverka';
import { POROG } from '../figury';
import { pustoyOtchet, renderPlan, shagovPodskazki } from '../render';
import { reshenie } from '../reshenie';
import { sealAnswer, sealText } from '../secret';
import { prototip } from '../stseny';
import { chislo, type Params } from '../stseny/dsl';
import type { Rezhim, Scena, Variant } from '../types';
import { BEZ_VARIANTA, pereimenovat, sluchaynyyVariant } from '../variant';
import { klyuchZadachi, protoKlyucha, type UslovieBanka, type ZadachaPlan } from './sessiya';

/* ── Числа и вариант ─────────────────────────────────────────────── */

function klyuchNabora(p: Params): string {
  return Object.keys(p)
    .sort()
    .map((k) => `${k}=${p[k as keyof Params]}`)
    .join(';');
}

/** Числа, которые названы в условии: «$28^\\circ$» → 28. */
function chislaUsloviya(uslovie: string): Set<string> {
  return new Set(
    [...uslovie.matchAll(/\$([^$]*)\$/g)].flatMap((m) =>
      [...(m[1] ?? '').matchAll(/\d+(?:\{,\}\d+)?/g)].map((x) => x[0].replace('{,}', ',')),
    ),
  );
}

/**
 * Числа новой задачи по seed: генератор аналогов прототипа (или
 * случайные числа автотеста), с теми же условиями, что у аналогов, —
 * ответ ЕГЭ, сходится с измерением на фигуре, не повторяет задачу
 * банка, чертёж чист. Не подобралось — null.
 */
export function novyeParams(proto: number, seed: string): Params | null {
  const p = prototip(proto);
  const gen = GENERATORY[proto] ?? ((r) => p.sluchaynye(r));
  const rng = rngOf(`z1-new|${proto}|${seed}`);
  const zanyato = new Set(
    zadachiPrototipa(proto).map((z) => klyuchNabora({ ...p.primer, ...z.params } as Params)),
  );
  for (let i = 0; i < 300; i += 1) {
    const nabor = gen(rng);
    if (nabor === null) continue;
    const params = { ...p.primer, ...nabor } as Params;
    if (zanyato.has(klyuchNabora(params))) continue;
    const o = p.otvet(params);
    if (!otvetEge(o)) continue;
    /* Ответ, равный числу условия, читается с чертежа подсказки как
       данное — такие числа берём, только если других не нашлось. */
    if (i < 200 && chislaUsloviya(p.uslovie(params)).has(chislo(o))) continue;
    const m = izmerit(proto, params);
    if (m === null || Math.abs(m - o) > 1e-6 * Math.max(1, Math.abs(o))) continue;
    try {
      if (!chertezhChist(proto, params)) continue;
    } catch {
      continue;
    }
    return params;
  }
  return null;
}

/** Все режимы чертежа: ученик, шаги подсказки, учитель. */
function vseRezhimy(scena: Scena): Rezhim[] {
  const n = shagovPodskazki(scena);
  return [
    { rezhim: 'uchenik' },
    ...Array.from({ length: n }, (_, i) => ({ rezhim: 'podskazka' as const, shag: i + 1 })),
    { rezhim: 'uchitel' },
  ];
}

/** Вариант генератора, при котором чертёж чист во всех режимах; нет — без варианта. */
export function variantDlya(proto: number, scena: Scena, seed: string): Variant {
  const p = prototip(proto);
  const rng = rngOf(`z1-variant|${proto}|${seed}`);
  for (let i = 0; i < 8; i += 1) {
    const v = sluchaynyyVariant(rng, Object.keys(scena.tochki), p.diapazon);
    const chist = vseRezhimy(scena).every((rezhim) => {
      const o = pustoyOtchet();
      try {
        renderPlan(scena, { rezhim, variant: v, chisla: true }, o);
      } catch {
        return false;
      }
      return o.problems.length === 0;
    });
    if (chist) return v;
  }
  return BEZ_VARIANTA;
}

export interface RazreshennayaZadacha {
  proto: number;
  params: Params;
  variant: Variant;
  /** Номер задачи Блока 1 ФИПИ (только у задачи банка). */
  fipi: number | null;
}

/** План → числа и вариант. Новая задача без чисел берёт числа образца. */
export function razreshit(plan: ZadachaPlan, bank: readonly UslovieBanka[]): RazreshennayaZadacha {
  const proto = protoKlyucha(plan.id);
  const p = prototip(proto);
  if (plan.vid === 'new') {
    const params = novyeParams(proto, plan.seed) ?? (p.primer as Params);
    const scena = p.stsena(params, POROG);
    return { proto, params, variant: variantDlya(proto, scena, plan.seed), fipi: null };
  }
  const b = bank.find((x) => x.no === plan.no);
  if (b === undefined) {
    throw new Error(`Нет задачи банка №${plan.no}`);
  }
  const params = { ...p.primer, ...b.params } as Params;
  if (plan.vid === 'bank') {
    return { proto, params, variant: BEZ_VARIANTA, fipi: b.no };
  }
  const scena = p.stsena(params, POROG);
  return { proto, params, variant: variantDlya(proto, scena, `a${b.no}`), fipi: null };
}

/* ── Закрытые блоки ──────────────────────────────────────────────── */

export interface VoprosHtml {
  vopros: string;
  varianty: string[];
  verno: number;
  poyasnenie: string;
  /** Чертёж шага подсказки: нужный элемент подсвечен. */
  risunokSvg: string;
}

export interface Podskazki1 {
  voprosy: VoprosHtml[];
}

export interface ShagHtml {
  zagolovok: string;
  tekst: string[];
  formuly: string[];
  sokrashchenie: { tekst: string; formula: string }[];
}

export interface Razbor1 {
  shagi: ShagHtml[];
  sverka: string;
  /** Ответ, набранный KaTeX. */
  otvetHtml: string;
  /** Чертёж со всеми построениями и ответом — лист учителя. */
  risunokSvg: string;
}

export interface Zadacha1 {
  /** Ключ: прототип и откуда задача. */
  key: string;
  id: string;
  proto: number;
  vid: ZadachaPlan['vid'];
  fipi: number | null;
  /** Название прототипа с формулами в $…$. */
  title: string;
  uslovieHtml: string;
  risunokSvg: string;
  seal: string;
  /** Вопросы подсказки: JSON Podskazki1, закрыт отпечатком. */
  podskazki: string;
  /** Решение по шагам: JSON Razbor1, закрыт отпечатком. */
  razbor: string;
}

function display(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: true });
}

/** Ответ числом: 4.5 → «4,5». */
export function otvetTex(x: number): string {
  return chislo(x).replace(',', '{,}');
}

/** Всё содержимое задачи: тексты с новыми буквами, чертежи во всех режимах. */
export function sostavZadachi(z: RazreshennayaZadacha) {
  const p = prototip(z.proto);
  const b = z.variant.bukvy;
  const ren = (t: string) => pereimenovat(t, b);
  const scena = p.stsena(z.params, POROG);
  const r = reshenie(z.proto, z.params);
  const otvet = p.otvet(z.params);
  const alt = `Чертёж к задаче: ${ren(p.nazvanie).replace(/\$/g, '')}`;
  const risunok = (rezhim: Rezhim) =>
    renderPlan(scena, { rezhim, variant: z.variant, alt, chisla: rezhim.rezhim !== 'uchenik' });
  const nShagov = shagovPodskazki(scena);
  const razbor: Razbor1 = {
    shagi: r.shagi.map((s) => ({
      zagolovok: typeset(ren(s.zagolovok)),
      tekst: s.tekst.filter((t) => t !== '').map((t) => typeset(ren(t))),
      formuly: (s.formuly ?? []).map((f) => display(ren(f))),
      sokrashchenie: (s.sokrashchenie ?? []).map((k) => ({
        tekst: typeset(ren(k.tekst)),
        formula: k.tex === '' ? '' : display(ren(k.tex)),
      })),
    })),
    sverka: typeset(ren(r.sverka)),
    otvetHtml: typeset(`$${otvetTex(otvet)}$`),
    risunokSvg: risunok({ rezhim: 'uchitel' }),
  };
  const podskazki: Podskazki1 = {
    voprosy: r.voprosy.map((v) => ({
      vopros: typeset(ren(v.vopros)),
      varianty: v.varianty.map((x) => typeset(ren(x))),
      verno: v.verno,
      poyasnenie: typeset(ren(v.poyasnenie)),
      risunokSvg:
        v.sloy === undefined || v.sloy > nShagov
          ? risunok({ rezhim: 'uchenik' })
          : risunok({ rezhim: 'podskazka', shag: v.sloy, vopros: true }),
    })),
  };
  /* Решение для листа учителя: шаг — строка, выкладки в тексте. */
  const reshenieLista = `<ol class="sheet-steps z1-sheet-steps">${r.shagi
    .map((s) => {
      const tekst = s.tekst.filter((t) => t !== '').map((t) => typeset(ren(t)));
      const formuly = (s.formuly ?? []).map((f) => typeset(`$${ren(f)}$`));
      return `<li class="sheet-step"><b>${typeset(ren(s.zagolovok))}.</b> ${[...tekst, ...formuly].join(' ')}</li>`;
    })
    .join('')}</ol>`;
  return {
    title: ren(p.nazvanie),
    uslovie: ren(p.uslovie(z.params)),
    reshenieLista,
    risunokSvg: risunok({ rezhim: 'uchenik' }),
    otvet,
    razbor,
    podskazki,
  };
}

export function sobratZadachu(plan: ZadachaPlan, bank: readonly UslovieBanka[]): Zadacha1 {
  const z = razreshit(plan, bank);
  const s = sostavZadachi(z);
  const seal = sealAnswer(s.otvet);
  return {
    key: klyuchZadachi(plan),
    id: plan.id,
    proto: z.proto,
    vid: plan.vid,
    fipi: z.fipi,
    title: s.title,
    uslovieHtml: typeset(s.uslovie),
    risunokSvg: s.risunokSvg,
    seal,
    podskazki: sealText(JSON.stringify(s.podskazki), seal),
    razbor: sealText(JSON.stringify(s.razbor), seal),
  };
}
