/**
 * База, задание №16, раздел IV «Преобразование тригонометрических
 * выражений»: разборы.
 *
 * Приёмы — как в профильном №8 (lib/vychisleniya/prototypes/trig-*.ts):
 * основное тригонометрическое тождество и знак по четверти; полные
 * обороты отбрасываем по периоду; формулы приведения к острому углу;
 * табличные значения; tg·ctg = 1.
 */

import type { Etap } from '../types';
import { mul, q, sqrtQ, sub, texDrobQ, texQ, type Q } from './drob';
import { etap, f, hesh, num, vopros, type Resh, type Vid } from './obshchee';

const CHETVERT: Record<string, { n: string; sin: 1 | -1; cos: 1 | -1 }> = {
  '0': { n: 'I', sin: 1, cos: 1 },
  '90': { n: 'II', sin: 1, cos: -1 },
  '180': { n: 'III', sin: -1, cos: -1 },
  '270': { n: 'IV', sin: -1, cos: 1 },
};

const znakSlovo = (z: 1 | -1) => (z === 1 ? 'положителен' : 'отрицателен');

function chetvert(ot: string, doo: string) {
  const c = CHETVERT[ot];
  if (c === undefined) throw new Error(`четверть ${ot}–${doo}`);
  return c;
}

/* ── 25–26: синус по косинусу и наоборот ──────────────────────── */

function poTozhdestvu(m: RegExpExecArray, zapis: string): Resh {
  const nayti = m[1] === 'sin' ? 'sin' : 'cos';
  const dano = m[2] === 'sin' ? 'sin' : 'cos';
  const minus = m[3] === '-';
  const k = m[4] === undefined || m[4] === '' ? 1 : num(m[4]);
  const r = num(m[5]);
  const den = num(m[6]);
  const ch = chetvert(m[7] ?? '', m[8] ?? '');
  const kvDano = q(k * k * r, den * den);
  const kvNayti = sub(q(1), kvDano);
  const mod = sqrtQ(kvNayti);
  if (mod === null) throw new Error(`не извлекается: «${zapis}»`);
  const zn = ch[nayti];
  const otvet = mul(q(zn), mod);
  const danoTex = `${minus ? '-' : ''}\\dfrac{${k === 1 ? '' : k}\\sqrt{${r}}}{${den}}`;
  const etapy = [
    etap(
      'Основное тригонометрическое тождество',
      `$\\sin^{2}\\alpha + \\cos^{2}\\alpha = 1$, поэтому $\\${nayti}^{2}\\alpha = 1 - \\${dano}^{2}\\alpha$. Знак ${
        minus ? 'минус ' : ''
      }при возведении в квадрат пропадает.`,
      `\\${nayti}^{2}\\alpha = 1 - \\left(${danoTex}\\right)^{2} = 1 - ${texDrobQ(kvDano)} = ${texDrobQ(kvNayti)}`,
    ),
    etap(
      'Извлекаем корень',
      null,
      `|\\${nayti}\\alpha| = \\sqrt{${texDrobQ(kvNayti)}} = ${texDrobQ(mod)} = ${texQ(mod)}`,
    ),
    etap(
      'Выбираем знак по четверти',
      `$${m[7]}^\\circ < \\alpha < ${m[8]}^\\circ$ — ${ch.n} четверть, там ${
        nayti === 'sin' ? 'синус' : 'косинус'
      } ${znakSlovo(zn)}.`,
      `\\${nayti}\\alpha = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равен $\\${nayti}^{2}\\alpha$?`,
      f(texDrobQ(kvNayti)),
      [
        f(texDrobQ(sub(kvDano, q(1)))),
        f(texDrobQ(sub(q(1), q(k * Math.round(Math.sqrt(r)), den)))),
      ],
      h,
      `$1 - ${texDrobQ(kvDano)} = ${texDrobQ(kvNayti)}$.`,
    ),
    vopros(
      `Какой знак у $\\${nayti}\\alpha$ при $${m[7]}^\\circ < \\alpha < ${m[8]}^\\circ$?`,
      zn === 1 ? 'плюс' : 'минус',
      [zn === 1 ? 'минус' : 'плюс'],
      h + 1,
      `${ch.n} четверть: ${nayti === 'sin' ? 'синус' : 'косинус'} ${znakSlovo(zn)}.`,
    ),
    vopros(
      'Чему равен ответ?',
      f(texQ(otvet)),
      [f(texQ(mul(q(-1), otvet))), f(texQ(kvNayti))],
      h + 2,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── 27: тангенс по синусу или косинусу ───────────────────────── */

function tangens(m: RegExpExecArray, zapis: string): Resh {
  const dano = m[1] === 'sin' ? 'sin' : 'cos';
  const drugoe = dano === 'sin' ? 'cos' : 'sin';
  const minus = m[2] === '-';
  const a = num(m[3]);
  const N = num(m[4]);
  const ch = chetvert(m[5] ?? '', m[6] ?? '');
  const b2 = N - a * a;
  const b = Math.round(Math.sqrt(b2));
  if (b * b !== b2) throw new Error(`не извлекается: «${zapis}»`);
  const zDano = ch[dano];
  if ((minus ? -1 : 1) !== zDano) throw new Error(`знак не по четверти: «${zapis}»`);
  const zDrug = ch[drugoe];
  const sinCh = dano === 'sin' ? a * zDano : b * zDrug;
  const cosCh = dano === 'cos' ? a * zDano : b * zDrug;
  const otvet = q(sinCh, cosCh);
  const danoTex = `${minus ? '-' : ''}\\dfrac{${a}}{\\sqrt{${N}}}`;
  const drugTex = `${zDrug === -1 ? '-' : ''}\\dfrac{${b}}{\\sqrt{${N}}}`;
  const sinTex = dano === 'sin' ? danoTex : drugTex;
  const cosTex = dano === 'cos' ? danoTex : drugTex;
  const etapy = [
    etap(
      `Находим $\\${drugoe}\\alpha$ по тождеству`,
      '$\\sin^{2}\\alpha + \\cos^{2}\\alpha = 1$.',
      `\\${drugoe}^{2}\\alpha = 1 - \\left(${danoTex}\\right)^{2} = 1 - \\dfrac{${a * a}}{${N}} = \\dfrac{${b2}}{${N}}`,
    ),
    etap(
      'Знак по четверти',
      `$${m[5]}^\\circ < \\alpha < ${m[6]}^\\circ$ — ${ch.n} четверть, там ${
        drugoe === 'sin' ? 'синус' : 'косинус'
      } ${znakSlovo(zDrug)}.`,
      `\\${drugoe}\\alpha = ${drugTex}`,
    ),
    etap(
      'Делим синус на косинус',
      '$\\mathrm{tg}\\,\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}$, корни $\\sqrt{' +
        N +
        '}$ сокращаются.',
      `\\mathrm{tg}\\,\\alpha = ${sinTex} : \\left(${cosTex}\\right) = \\dfrac{${sinCh}}{${cosCh}} = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равен $\\${drugoe}^{2}\\alpha$?`,
      f(`\\dfrac{${b2}}{${N}}`),
      [f(`\\dfrac{${N + a * a}}{${N}}`), f(`\\dfrac{${N - a}}{${N}}`)],
      h,
      `$1 - \\dfrac{${a * a}}{${N}} = \\dfrac{${b2}}{${N}}$.`,
    ),
    vopros(
      `Какой знак у $\\mathrm{tg}\\,\\alpha$ при $${m[5]}^\\circ < \\alpha < ${m[6]}^\\circ$?`,
      sinCh * cosCh > 0 ? 'плюс' : 'минус',
      [sinCh * cosCh > 0 ? 'минус' : 'плюс'],
      h + 1,
      'Знак тангенса — знак частного синуса и косинуса.',
    ),
    vopros(
      'Чему равен ответ?',
      f(texQ(otvet)),
      [f(texQ(q(-sinCh, cosCh))), f(texQ(q(cosCh, sinCh)))],
      h + 2,
      `$\\mathrm{tg}\\,\\alpha = \\dfrac{${sinCh}}{${cosCh}}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── 28: коэффициент · f(угол) ────────────────────────────────── */

type Fn = 'sin' | 'cos' | 'tg';
/** Значение r·√k. */
interface Tab {
  r: Q;
  k: 1 | 2 | 3;
}

const TABLICA: Record<Fn, Record<number, Tab>> = {
  sin: {
    0: { r: q(0), k: 1 },
    30: { r: q(1, 2), k: 1 },
    45: { r: q(1, 2), k: 2 },
    60: { r: q(1, 2), k: 3 },
    90: { r: q(1), k: 1 },
    180: { r: q(0), k: 1 },
    270: { r: q(-1), k: 1 },
  },
  cos: {
    0: { r: q(1), k: 1 },
    30: { r: q(1, 2), k: 3 },
    45: { r: q(1, 2), k: 2 },
    60: { r: q(1, 2), k: 1 },
    90: { r: q(0), k: 1 },
    180: { r: q(-1), k: 1 },
    270: { r: q(0), k: 1 },
  },
  tg: {
    0: { r: q(0), k: 1 },
    30: { r: q(1, 3), k: 3 },
    45: { r: q(1), k: 1 },
    60: { r: q(1), k: 3 },
  },
};

function tabTex(t: Tab, zn: 1 | -1 = 1): string {
  if (t.k === 1) return texDrobQ(mul(q(zn), t.r));
  const minus = zn === -1 && t.r.n !== BigInt(0) ? '-' : '';
  if (t.r.n === BigInt(1) && t.r.d === BigInt(1)) return `${minus}\\sqrt{${t.k}}`;
  return `${minus}\\dfrac{${t.r.n === BigInt(1) ? '' : String(t.r.n)}\\sqrt{${t.k}}}{${String(t.r.d)}}`;
}

const fnTex = (fn: Fn) => (fn === 'tg' ? '\\mathrm{tg}\\,' : `\\${fn}`);

/** Приведение угла 0…360 (у тангенса 0…180) к углу 0…90 и знак. */
function privedenie(fn: Fn, phi: number): { beta: number; zn: 1 | -1; formula: string | null } {
  /* Острый угол и углы на осях (90°, 180°, 270°) — сразу из таблицы. */
  if (phi <= 90 || phi % 90 === 0) return { beta: phi, zn: 1, formula: null };
  const F = fnTex(fn);
  if (phi <= 180) {
    const beta = 180 - phi;
    const zn = fn === 'sin' ? 1 : -1;
    return {
      beta,
      zn,
      formula: `${F}${phi}^\\circ = ${F}(180^\\circ - ${beta}^\\circ) = ${zn === -1 ? '-' : ''}${F}${beta}^\\circ`,
    };
  }
  if (phi <= 270) {
    const beta = phi - 180;
    return {
      beta,
      zn: -1,
      formula: `${F}${phi}^\\circ = ${F}(180^\\circ + ${beta}^\\circ) = -${F}${beta}^\\circ`,
    };
  }
  const beta = 360 - phi;
  const zn = fn === 'cos' ? 1 : -1;
  return {
    beta,
    zn,
    formula: `${F}${phi}^\\circ = ${F}(360^\\circ - ${beta}^\\circ) = ${zn === -1 ? '-' : ''}${F}${beta}^\\circ`,
  };
}

function koeffUgol(m: RegExpExecArray, zapis: string): Resh {
  const minus = m[1] === '-' ? -1 : 1;
  const c = num(m[2]);
  const K = m[3] === undefined ? 1 : num(m[3]);
  const fn: Fn = m[4] === '\\sin' ? 'sin' : m[4] === '\\cos' ? 'cos' : 'tg';
  const ugol = num(m[5]);
  const per = fn === 'tg' ? 180 : 360;
  const oboroty = Math.floor(ugol / per);
  const phi = ugol - oboroty * per;
  const { beta, zn, formula } = privedenie(fn, phi);
  const t = TABLICA[fn][beta];
  if (t === undefined) throw new Error(`не табличный угол: «${zapis}»`);
  /* c·√K · zn·r·√k */
  let kor: Q;
  if (K === t.k) kor = q(K);
  else if (t.k === 1 && K === 1) kor = q(1);
  else if (t.r.n === BigInt(0)) kor = q(0);
  else throw new Error(`корень не сокращается: «${zapis}»`);
  const otvet = mul(q(minus * c * zn), mul(t.r, kor));
  const F = fnTex(fn);
  const koefTex = `${minus === -1 ? '-' : ''}${c}${K === 1 ? '' : `\\sqrt{${K}}`}`;
  const etapy: Etap[] = [];
  if (oboroty > 0) {
    etapy.push(
      etap(
        'Отбрасываем полные обороты',
        fn === 'tg'
          ? 'Период тангенса — $180^\\circ$: $\\mathrm{tg}(\\alpha + 180^\\circ \\cdot n) = \\mathrm{tg}\\,\\alpha$.'
          : `Период ${fn === 'sin' ? 'синуса' : 'косинуса'} — $360^\\circ$: от полного оборота значение не меняется.`,
        `${F}${ugol}^\\circ = ${F}(${oboroty === 1 ? '' : `${oboroty} \\cdot `}${per}^\\circ + ${phi}^\\circ) = ${F}${phi}^\\circ`,
      ),
    );
  }
  if (formula !== null) {
    etapy.push(
      etap(
        'Формула приведения',
        `Сводим к острому углу; знак — как у $${F}${phi}^\\circ$: угол в ${
          phi < 180 ? 'II' : phi < 270 ? 'III' : 'IV'
        } четверти.`,
        formula,
      ),
    );
  }
  const znach = tabTex(t, zn);
  etapy.push(
    etap(
      'Подставляем табличное значение',
      `$${F}${beta}^\\circ = ${tabTex(t)}$.${K !== 1 && K === t.k ? ` $\\sqrt{${K}} \\cdot \\sqrt{${K}} = ${K}$.` : ''}`,
      `${koefTex} \\cdot ${F}${ugol}^\\circ = ${koefTex} \\cdot ${znach.startsWith('-') ? `\\left(${znach}\\right)` : znach} = ${texQ(otvet)}`,
    ),
  );
  const h = hesh(zapis);
  const drugaya: Fn = fn === 'sin' ? 'cos' : fn === 'cos' ? 'sin' : 'tg';
  const tD = TABLICA[drugaya][fn === 'tg' ? 90 - beta : beta] ?? t;
  const hints = [
    vopros(
      `Чему равен $${F}${ugol}^\\circ$?`,
      f(znach),
      [f(tabTex(t, zn === 1 ? -1 : 1)), f(tabTex(tD, zn))],
      h,
      `$${F}${ugol}^\\circ = ${znach}$.`,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(mul(q(-1), otvet))), f(texQ(mul(q(c), q(minus))))],
      h + 1,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── 29: tg·ctg ───────────────────────────────────────────────── */

function tgCtg(ugol: number, zapis: string): Resh {
  const otvet = q(1);
  const a = `${ugol}^\\circ`;
  const etapy = [
    etap(
      'Вспоминаем определения',
      '$\\mathrm{tg}\\,\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}$, $\\mathrm{ctg}\\,\\alpha = \\dfrac{\\cos\\alpha}{\\sin\\alpha}$ — это взаимно обратные числа. Угол не табличный, но считать его не нужно.',
      `\\mathrm{tg}\\,${a} \\cdot \\mathrm{ctg}\\,${a} = \\dfrac{\\sin ${a}}{\\cos ${a}} \\cdot \\dfrac{\\cos ${a}}{\\sin ${a}}`,
    ),
    etap(
      'Сокращаем',
      null,
      `\\dfrac{\\sin ${a} \\cdot \\cos ${a}}{\\cos ${a} \\cdot \\sin ${a}} = 1`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      'Как связаны тангенс и котангенс одного угла?',
      f('\\mathrm{ctg}\\,\\alpha = \\dfrac{1}{\\mathrm{tg}\\,\\alpha}'),
      [
        f('\\mathrm{ctg}\\,\\alpha = -\\mathrm{tg}\\,\\alpha'),
        f('\\mathrm{ctg}\\,\\alpha = 1 - \\mathrm{tg}\\,\\alpha'),
      ],
      h,
    ),
    vopros(
      'Чему равно произведение?',
      f('1'),
      [f('0'), f('-1')],
      h + 1,
      'Произведение взаимно обратных чисел равно $1$.',
    ),
  ];
  return { otvet, etapy, hints };
}

export const VIDY_TRIG: Vid[] = [
  {
    re: /^Найдите \$\\(sin|cos)\\alpha\$, если \$\\(sin|cos)\\alpha=(-?)\\frac\{(\d*)\\sqrt\{(\d+)\}\}\{(\d+)\}\$, \$(\d+)\^\\circ<\\alpha<(\d+)\^\\circ\$\.$/,
    reshit: (m, z) => poTozhdestvu(m, z),
  },
  {
    re: /^Найдите \$\\mathrm\{tg\}\\,\\alpha\$, если \$\\(sin|cos)\\alpha=(-?)\\frac\{(\d+)\}\{\\sqrt\{(\d+)\}\}\$, \$(\d+)\^\\circ<\\alpha<(\d+)\^\\circ\$\.$/,
    reshit: (m, z) => tangens(m, z),
  },
  {
    re: /^(-?)(\d+)(?:\\sqrt\{(\d+)\})?(?:\\cdot)?(\\sin|\\cos|\\mathrm\{tg\}\\,)\s?(\d+)\^\\circ$/,
    reshit: (m, z) => koeffUgol(m, z),
  },
  {
    re: /^\\mathrm\{tg\}\\,(\d+)\^\\circ\\,\\mathrm\{ctg\}\\,(\d+)\^\\circ$/,
    reshit: (m, z) => {
      if (m[1] !== m[2]) throw new Error(`разные углы: «${z}»`);
      return tgCtg(num(m[1]), z);
    },
  },
];
