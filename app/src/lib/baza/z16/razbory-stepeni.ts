/**
 * База, задание №16, раздел I «Действия со степенями»: разборы.
 *
 * Приёмы — как в профильном №8 (lib/vychisleniya/prototypes/stepeni.ts):
 * сначала основания к одному числу, степень в степени — показатели
 * перемножаются, при умножении показатели складываются, при делении —
 * вычитаются; большие степени не считаем. Произведение степеней с
 * разными основаниями раскладываем: (bc)^n = b^n c^n.
 */

import type { Etap, HintStep } from '../types';
import { add, dec, div, mul, powQ, q, texQ, type Q } from './drob';
import { d, etap, f, hesh, num, pw, sk, summaTex, vopros, type Resh, type Vid } from './obshchee';
import { poschitat } from './vychislitel';

/** \frac → \dfrac для показа. */
export const pokaz = (t: string): string => t.replace(/\\frac/g, '\\dfrac');

/** g^E числом: с пояснением для отрицательного и нулевого показателя. */
function stepenTex(g: Q, gTex: string, e: number): string {
  const v = powQ(g, e);
  if (e < 0) {
    return `${pw(gTex, e)} = \\dfrac{1}{${pw(gTex, -e)}} = \\dfrac{1}{${texQ(powQ(g, -e))}} = ${texQ(v)}`;
  }
  if (e === 1) return `${pw(gTex, 1)} = ${texQ(v)}`;
  return `${pw(gTex, e)} = ${texQ(v)}`;
}

/** Пояснение к последнему шагу: что значит такой показатель. */
function proStepen(e: number): string | null {
  if (e < 0) return 'Отрицательный показатель — это дробь: $a^{-n} = \\dfrac{1}{a^{n}}$.';
  if (e === 0) return 'Любое число, кроме нуля, в нулевой степени равно $1$.';
  return null;
}

/* ── Степени с одним основанием ───────────────────────────────── */

interface Atom {
  /** Основание как в записи: «8», «0,1». */
  osn: string;
  /** Внутренний показатель у (a^m)^n, иначе null. */
  vnutr: number | null;
  pok: number;
  /** +1 — в числителе (умножаем), −1 — в знаменателе (делим). */
  znak: 1 | -1;
}

const ATOM =
  /\\left\((\d+)\^\{(-?\d+)\}\\right\)\^\{(-?\d+)\}|(?:\\left\(|\()(\d+,\d+)(?:\\right\)|\))\^\{(-?\d+)\}|(\d+)\^\{(-?\d+)\}/g;

/** Записать: шаблон с местами §i§ и сами степени. */
function razlozhit(zapis: string): { shablon: string; atomy: Atom[] } {
  const atomy: Atom[] = [];
  const shablon = zapis.replace(ATOM, (...g: (string | undefined)[]) => {
    const i = atomy.length;
    if (g[1] !== undefined) {
      atomy.push({ osn: g[1], vnutr: num(g[2]), pok: num(g[3]), znak: 1 });
    } else if (g[4] !== undefined) {
      atomy.push({ osn: g[4], vnutr: null, pok: num(g[5]), znak: 1 });
    } else {
      atomy.push({ osn: g[6] ?? '', vnutr: null, pok: num(g[7]), znak: 1 });
    }
    return `§${i}§`;
  });
  /* Где стоит степень — в числителе или в знаменателе: подставляем 2 на её
     место и 1 на остальные, значение шаблона — 2 или 1/2. */
  atomy.forEach((a, i) => {
    const t = shablon.replace(/§(\d+)§/g, (_, j: string) => (Number(j) === i ? '2' : '1'));
    const v = poschitat(t);
    if (Math.abs(v - 2) < 1e-9) a.znak = 1;
    else if (Math.abs(v - 0.5) < 1e-9) a.znak = -1;
    else throw new Error(`не понять место степени в «${zapis}»`);
  });
  return { shablon, atomy };
}

function sobrat(shablon: string, chasti: string[]): string {
  return pokaz(shablon.replace(/§(\d+)§/g, (_, j: string) => chasti[Number(j)] ?? '?'));
}

/** Общее основание: наименьшее из оснований, если остальные — его степени. */
function obshcheeOsnovanie(osnovaniya: string[]): { g: number; s: Map<string, number> } {
  const s = new Map<string, number>();
  if (osnovaniya.some((o) => o.includes(',') || o === '10')) {
    for (const o of osnovaniya) {
      if (o === '10') s.set(o, 1);
      else if (o === '0,1') s.set(o, -1);
      else if (o === '0,01') s.set(o, -2);
      else if (o === '0,001') s.set(o, -3);
      else throw new Error(`основание ${o} не степень десяти`);
    }
    return { g: 10, s };
  }
  const chisla = [...new Set(osnovaniya.map(Number))].sort((a, b) => a - b);
  const pokazatel = (x: number, g: number): number | null => {
    let k = 0;
    let y = x;
    while (y > 1 && y % g === 0) {
      y /= g;
      k += 1;
    }
    return y === 1 ? k : null;
  };
  const kandidaty = [chisla[0] ?? 2, ...Array.from({ length: 30 }, (_, i) => i + 2)];
  for (const g of kandidaty) {
    if (chisla.every((x) => pokazatel(x, g) !== null)) {
      for (const o of osnovaniya) s.set(o, pokazatel(Number(o), g) ?? 0);
      return { g, s };
    }
  }
  throw new Error(`нет общего основания у ${osnovaniya.join(', ')}`);
}

function atomTex(a: Atom): string {
  if (a.vnutr !== null) return pw(`\\left(${pw(a.osn, a.vnutr)}\\right)`, a.pok);
  return pw(a.osn, a.pok);
}

export function odnoOsnovanie(zapis: string): Resh {
  const { shablon, atomy } = razlozhit(zapis);
  const { g, s } = obshcheeOsnovanie(atomy.map((a) => a.osn));
  const gQ = q(g);
  const st = (a: Atom) => s.get(a.osn) ?? 1;
  const E = atomy.map((a) => st(a) * (a.vnutr ?? 1) * a.pok);
  const itog = atomy.reduce((acc, a, i) => acc + a.znak * (E[i] ?? 0), 0);
  const otvet = powQ(gQ, itog);
  const nado = atomy.filter((a) => st(a) !== 1);
  const etapy: Etap[] = [];
  const iskhod = sobrat(
    shablon,
    atomy.map((a) => atomTex(a)),
  );
  const vG = sobrat(
    shablon,
    atomy.map((_, i) => pw(g, E[i] ?? 0)),
  );
  if (nado.length > 0) {
    const ravenstva = [...new Set(nado.map((a) => a.osn))]
      .map((o) => `$${d(o)} = ${pw(g, s.get(o) ?? 1)}$`)
      .join(', ');
    const sredn = sobrat(
      shablon,
      atomy.map((a) => {
        const m = [st(a), ...(a.vnutr === null ? [] : [a.vnutr]), a.pok];
        return st(a) === 1 && a.vnutr === null ? pw(g, a.pok) : pw(g, m.map(sk).join(' \\cdot '));
      }),
    );
    etapy.push(
      etap(
        `Приводим к основанию $${g}$`,
        `Записываем ${ravenstva}. Степень в степени — показатели перемножаются: $(a^{m})^{n} = a^{m \\cdot n}$.`,
        `${iskhod} = ${sredn} = ${vG}`,
      ),
    );
  } else if (atomy.some((a) => a.vnutr !== null)) {
    const sredn = sobrat(
      shablon,
      atomy.map((a) =>
        a.vnutr === null ? pw(g, a.pok) : pw(g, `${sk(a.vnutr)} \\cdot ${sk(a.pok)}`),
      ),
    );
    etapy.push(
      etap(
        'Возводим степень в степень',
        'Показатели перемножаются: $(a^{m})^{n} = a^{m \\cdot n}$.',
        `${iskhod} = ${sredn} = ${vG}`,
      ),
    );
  }
  const chleny = atomy.map((a, i) => ({ znak: a.znak, e: E[i] ?? 0 }));
  etapy.push(
    etap(
      'Собираем показатели',
      'Основания одинаковые: при умножении показатели складываются, при делении — вычитаются. Большие степени считать не нужно.',
      `${vG} = ${pw(g, summaTex(chleny))} = ${pw(g, itog)}`,
    ),
  );
  etapy.push(etap('Считаем степень', proStepen(itog), stepenTex(gQ, String(g), itog)));

  const h = hesh(zapis);
  const hints: HintStep[] = [];
  const pervyy = nado[0];
  if (pervyy !== undefined) {
    const k = s.get(pervyy.osn) ?? 1;
    hints.push(
      vopros(
        `Как записать $${d(pervyy.osn)}$ степенью числа $${g}$?`,
        f(pw(g, k)),
        [f(pw(g, k + 1)), f(pw(g, k === 2 ? 3 : 2)), f(pw(g, -k))],
        h,
        `$${d(pervyy.osn)} = ${pw(g, k)}$.`,
      ),
    );
  } else {
    const vl = atomy.find((a) => a.vnutr !== null);
    if (vl !== undefined && vl.vnutr !== null) {
      hints.push(
        vopros(
          `Чему равно $${atomTex(vl)}$?`,
          f(pw(g, vl.vnutr * vl.pok)),
          [f(pw(g, vl.vnutr + vl.pok)), f(pw(g, vl.vnutr - vl.pok))],
          h,
          'Степень в степени — показатели перемножаются.',
        ),
      );
    }
  }
  const vsePlyus = E.reduce((acc, e) => acc + e, 0);
  const posledniy = chleny[chleny.length - 1];
  const bezPoslednego = posledniy === undefined ? itog : itog - 2 * posledniy.znak * posledniy.e;
  hints.push(
    vopros(
      `Какая степень числа $${g}$ получится?`,
      f(pw(g, itog)),
      [f(pw(g, vsePlyus)), f(pw(g, bezPoslednego)), f(pw(g, itog + 1))],
      h + 1,
      `При делении показатели вычитаются: $${summaTex(chleny)} = ${itog}$.`,
    ),
  );
  const ot = texQ(otvet);
  const neverno =
    itog > 0
      ? [texQ(q(g * itog)), texQ(powQ(gQ, itog - 1))]
      : itog < 0
        ? [texQ(q(-1 * Number(powQ(gQ, -itog).n))), texQ(powQ(gQ, -itog))]
        : ['0', String(g)];
  hints.push(
    vopros(
      `Чему равно $${pw(g, itog)}$?`,
      f(ot),
      neverno.map(f),
      h + 2,
      proStepen(itog) ?? `$${stepenTex(gQ, String(g), itog)}$.`,
    ),
  );
  return { otvet, etapy, hints };
}

/* ── Произведение степеней с разными основаниями ───────────────── */

function raznyeOsnovaniya(
  A: number,
  a: number,
  B: number,
  b: number,
  C: number,
  c: number,
  vChislitele: boolean,
  zapis: string,
): Resh {
  if (B * C !== A) throw new Error(`${A} ≠ ${B}·${C} в «${zapis}»`);
  const x = vChislitele ? a - b : b - a;
  const y = vChislitele ? a - c : c - a;
  const vB = powQ(q(B), x);
  const vC = powQ(q(C), y);
  const otvet = mul(vB, vC);
  const razl = `${pw(A, a)} = ${pw(`(${B} \\cdot ${C})`, a)} = ${pw(B, a)} \\cdot ${pw(C, a)}`;
  const drob = vChislitele
    ? `\\dfrac{${pw(B, a)} \\cdot ${pw(C, a)}}{${pw(B, b)} \\cdot ${pw(C, c)}}`
    : `\\dfrac{${pw(B, b)} \\cdot ${pw(C, c)}}{${pw(B, a)} \\cdot ${pw(C, a)}}`;
  const pokB = vChislitele ? `${a} - ${b}` : `${b} - ${a}`;
  const pokC = vChislitele ? `${a} - ${c}` : `${c} - ${a}`;
  const chastB = x === 0 ? '1' : pw(B, x);
  const chastC = y === 0 ? '1' : pw(C, y);
  const ostatok = [x === 0 ? null : pw(B, x), y === 0 ? null : pw(C, y)].filter((t) => t !== null);
  const etapy = [
    etap(
      `Раскладываем основание $${A}$`,
      `$${A} = ${B} \\cdot ${C}$, а степень произведения равна произведению степеней: $(xy)^{n} = x^{n} y^{n}$.`,
      razl,
    ),
    etap(
      'Сокращаем степени с одинаковыми основаниями',
      'При делении показатели вычитаются: $\\dfrac{x^{m}}{x^{n}} = x^{m - n}$. Большие степени не считаем.',
      `${drob} = ${pw(B, pokB)} \\cdot ${pw(C, pokC)} = ${chastB} \\cdot ${chastC}`,
    ),
    etap(
      'Считаем',
      x === 0 || y === 0 ? 'Степень с нулевым показателем равна $1$.' : null,
      `${ostatok.length === 0 ? '1' : ostatok.join(' \\cdot ')} = ${
        ostatok.length === 2 ? `${texQ(vB)} \\cdot ${texQ(vC)} = ` : ''
      }${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Как записать $${pw(A, a)}$ через основания $${B}$ и $${C}$?`,
      f(`${pw(B, a)} \\cdot ${pw(C, a)}`),
      [f(`${pw(B, a)} + ${pw(C, a)}`), f(`${B} \\cdot ${pw(C, a)}`)],
      h,
      `$${A} = ${B} \\cdot ${C}$, степень произведения — произведение степеней.`,
    ),
    vopros(
      `Какая степень числа $${B}$ останется после сокращения?`,
      f(pw(B, x)),
      [f(pw(B, a + b)), f(pw(B, -x)), f(pw(B, x + 1))],
      h + 1,
      `Показатели вычитаются: $${pokB} = ${x}$.`,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(add(vB, vC))), f(texQ(mul(otvet, q(B))))],
      h + 2,
      `$${texQ(vB)} \\cdot ${texQ(vC)} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── Сумма слагаемых вида m·b^e ───────────────────────────────── */

const CHLEN =
  /([+-]?)(?:(\d+(?:,\d+)?)\\cdot\s?)?(?:\\left\((-?\d+)\\right\)|(\d+))(?:\^\{(-?\d+)\})?/g;

interface Chlen {
  op: 1 | -1;
  m: string | null;
  b: number;
  e: number | null;
}

function chleny(zapis: string): Chlen[] {
  const out: Chlen[] = [];
  let sobrano = '';
  for (const g of zapis.matchAll(CHLEN)) {
    sobrano += g[0];
    out.push({
      op: g[1] === '-' ? -1 : 1,
      m: g[2] ?? null,
      b: num(g[3] ?? g[4]),
      e: g[5] === undefined ? null : num(g[5]),
    });
  }
  if (sobrano !== zapis) throw new Error(`не сумма степеней: «${zapis}»`);
  return out;
}

function stepenChlena(c: Chlen): string {
  return c.e === null ? String(c.b) : pw(c.b, c.e);
}

/** Сумма со знаками: «6 - 2 + 0{,}5». */
function summaZnach(vals: Q[]): string {
  return vals
    .map((v, i) => {
      const t = texQ(v);
      if (i === 0) return t;
      return t.startsWith('-') ? `- ${t.slice(1)}` : `+ ${t}`;
    })
    .join(' ');
}

export function summaStepeney(zapis: string): Resh {
  const cs = chleny(zapis);
  const zn = cs.map((c) => (c.e === null ? q(c.b) : powQ(q(c.b), c.e)));
  const pr = cs.map((c, i) => mul(c.m === null ? q(1) : dec(c.m), zn[i] ?? q(0)));
  const sl = cs.map((c, i) => mul(q(c.op), pr[i] ?? q(0)));
  const otvet = sl.reduce((acc, v) => add(acc, v), q(0));
  const sStepenyu = cs.filter((c) => c.e !== null);
  const dlyaDesyati = cs.every((c) => c.b === 10);
  const minus = cs.some((c) => c.b < 0);
  const pochemu = minus
    ? cs.some((c) => c.b === -1)
      ? '$(-1)$ в чётной степени равна $1$, в нечётной — $-1$.'
      : 'Отрицательное число в чётной степени положительно, в нечётной — отрицательно. $10^{n}$ — единица и $n$ нулей, $(-10)^{0} = 1$.'
    : dlyaDesyati
      ? cs.some((c) => (c.e ?? 1) < 0)
        ? '$10^{-n} = \\dfrac{1}{10^{n}}$: единица стоит на $n$-м месте после запятой, например $10^{-2} = 0{,}01$.'
        : '$10^{n}$ — единица и $n$ нулей.'
      : 'Сначала степени, потом умножение, потом сложение.';
  const etapy = [
    etap(
      'Считаем степени',
      pochemu,
      sStepenyu
        .map((c) => `${stepenChlena(c)} = ${texQ(c.e === null ? q(c.b) : powQ(q(c.b), c.e))}`)
        .join(',\\quad '),
    ),
  ];
  const sMnozh = cs.map((c, i) => ({ c, i })).filter(({ c }) => c.m !== null);
  if (sMnozh.length > 0) {
    etapy.push(
      etap(
        'Умножаем',
        dlyaDesyati
          ? 'Умножить на $10^{n}$ — перенести запятую на $n$ знаков вправо, на $10^{-n}$ — на $n$ знаков влево.'
          : null,
        sMnozh
          .map(
            ({ c, i }) =>
              `${d(c.m ?? '1')} \\cdot ${(zn[i] ?? q(0)).n < BigInt(0) ? `(${texQ(zn[i] ?? q(0))})` : texQ(zn[i] ?? q(0))} = ${texQ(pr[i] ?? q(0))}`,
          )
          .join(',\\quad '),
      ),
    );
  }
  etapy.push(
    etap(
      cs.some((c) => c.op === -1) ? 'Складываем и вычитаем' : 'Складываем',
      null,
      `${summaZnach(sl)} = ${texQ(otvet)}`,
    ),
  );
  const h = hesh(zapis);
  /* Самая «опасная» степень: отрицательное основание или показатель. */
  const glavnyy =
    sStepenyu.find((c) => c.b < 0 && (c.e ?? 0) % 2 !== 0) ??
    sStepenyu.find((c) => (c.e ?? 0) < 0) ??
    sStepenyu.find((c) => c.b < 0) ??
    sStepenyu[0];
  const hints: HintStep[] = [];
  if (glavnyy !== undefined && glavnyy.e !== null) {
    const v = powQ(q(glavnyy.b), glavnyy.e);
    hints.push(
      vopros(
        `Чему равно $${stepenChlena(glavnyy)}$?`,
        f(texQ(v)),
        [
          f(texQ(q(-v.n, v.d))),
          f(texQ(q(glavnyy.b * glavnyy.e))),
          f(texQ(powQ(q(glavnyy.b), glavnyy.e + (glavnyy.e < 0 ? -1 : 1)))),
        ],
        h,
        pochemu,
      ),
    );
  }
  const bezZnaka = cs.reduce(
    (acc, c, i) => add(acc, mul(q(c.op), mul(c.m === null ? q(1) : dec(c.m), absQ(zn[i] ?? q(0))))),
    q(0),
  );
  const bezStepeney = cs.reduce(
    (acc, c) =>
      add(
        acc,
        mul(q(c.op), mul(c.m === null ? q(1) : dec(c.m), q(c.e === null ? c.b : c.b * c.e))),
      ),
    q(0),
  );
  hints.push(
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(bezZnaka)), f(texQ(bezStepeney)), f(texQ(add(otvet, q(10))))],
      h + 1,
      `$${summaZnach(sl)} = ${texQ(otvet)}$.`,
    ),
  );
  if (hints.length < 2) throw new Error('мало подсказок');
  return { otvet, etapy, hints };
}

const absQ = (x: Q): Q => (x.n < BigInt(0) ? q(-x.n, x.d) : x);

/* ── Числа, записанные со степенью десяти ─────────────────────── */

/** Множитель 10^k: перенос запятой — словами. */
function perenos(k: number): string {
  if (k === 0) return '$10^{0} = 1$.';
  const z = Math.abs(k);
  const znakov = z === 1 ? 'знак' : z < 5 ? 'знака' : 'знаков';
  return `Умножить на $10^{${k}}$ — перенести запятую на $${z}$ ${znakov} ${k > 0 ? 'вправо' : 'влево'}.`;
}

const D = '(\\d+(?:,\\d+)?)';
const P10 = '10(?:\\^\\{(-?\\d+)\\})?';

function desyatTex(e: number | null): string {
  return e === null ? '10' : pw(10, e);
}

/** (m·10^p)·(n·10^q) и (m·10^p):(n·10^q), а также дробь. */
function standartnyy(
  m: string,
  p: number | null,
  n: string,
  r: number | null,
  delenie: boolean,
  zapis: string,
  drob: boolean,
): Resh {
  const mQ = dec(m);
  const nQ = dec(n);
  const pp = p ?? 1;
  const rr = r ?? 1;
  const ch = delenie ? div(mQ, nQ) : mul(mQ, nQ);
  const k = delenie ? pp - rr : pp + rr;
  const otvet = mul(ch, powQ(q(10), k));
  const iskhod = drob
    ? `\\dfrac{${d(m)} \\cdot ${desyatTex(p)}}{${d(n)} \\cdot ${desyatTex(r)}}`
    : `\\left(${d(m)} \\cdot ${desyatTex(p)}\\right) ${delenie ? ':' : '\\cdot'} \\left(${d(n)} \\cdot ${desyatTex(r)}\\right)`;
  const gruppy = delenie
    ? `\\dfrac{${d(m)}}{${d(n)}} \\cdot \\dfrac{${desyatTex(p)}}{${desyatTex(r)}}`
    : `(${d(m)} \\cdot ${d(n)}) \\cdot (${desyatTex(p)} \\cdot ${desyatTex(r)})`;
  const sumPok = delenie ? `${pp} - ${sk(rr)}` : `${pp} + ${sk(rr)}`;
  const etapy = [
    etap(
      'Отдельно числа, отдельно степени десяти',
      delenie
        ? 'Частное произведений можно делить по частям: $\\dfrac{ab}{cd} = \\dfrac{a}{c} \\cdot \\dfrac{b}{d}$.'
        : 'Множители можно переставлять и группировать.',
      `${iskhod} = ${gruppy}`,
    ),
    etap(
      'Считаем каждую часть',
      delenie
        ? 'При делении степеней показатели вычитаются.'
        : 'При умножении степеней показатели складываются.',
      `${delenie ? `\\dfrac{${d(m)}}{${d(n)}}` : `${d(m)} \\cdot ${d(n)}`} = ${texQ(ch)},\\quad ${pw(10, sumPok)} = ${pw(10, k)}`,
    ),
    etap('Переносим запятую', perenos(k), `${texQ(ch)} \\cdot ${pw(10, k)} = ${texQ(otvet)}`),
  ];
  const h = hesh(zapis);
  const neK = delenie ? pp + rr : pp - rr;
  const hints = [
    vopros(
      `Какая степень десяти получится?`,
      f(pw(10, k)),
      [f(pw(10, neK)), f(pw(10, -k))],
      h,
      `$${pw(10, sumPok)} = ${pw(10, k)}$.`,
    ),
    vopros(
      `Чему равно ${delenie ? 'частное' : 'произведение'} чисел без степеней десяти?`,
      f(texQ(ch)),
      [f(texQ(delenie ? mul(mQ, nQ) : div(mQ, nQ))), f(texQ(mul(ch, q(10))))],
      h + 1,
      `$${delenie ? `${d(m)} : ${d(n)}` : `${d(m)} \\cdot ${d(n)}`} = ${texQ(ch)}$.`,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(mul(ch, powQ(q(10), neK)))), f(texQ(mul(otvet, q(10))))],
      h + 2,
      perenos(k),
    ),
  ];
  return { otvet, etapy, hints };
}

/** (0,1)^a·10^b·c^d и (0,01)^a·10^b : c^{-d}. */
function desyatichnoeOsnovanie(
  o: string,
  a: number,
  b: number,
  c: number,
  e: number,
  delenie: boolean,
  zapis: string,
): Resh {
  const s = o === '0,1' ? -1 : o === '0,01' ? -2 : 0;
  if (s === 0) throw new Error(`основание ${o}`);
  const k1 = s * a;
  const k = k1 + b;
  const C = powQ(q(c), e);
  const Cpol = delenie ? powQ(q(c), -e) : C;
  const otvet = mul(powQ(q(10), k), Cpol);
  const desyat = powQ(q(10), k);
  const etapy = [
    etap(
      `Записываем $${d(o)}$ степенью десяти`,
      `$${d(o)} = ${pw(10, s)}$, степень в степени — показатели перемножаются.`,
      `${pw(o, a)} = ${pw(`\\left(${pw(10, s)}\\right)`, a)} = ${pw(10, k1)}`,
    ),
    etap(
      'Собираем степени десяти',
      'При умножении показатели складываются.',
      `${pw(10, k1)} \\cdot ${pw(10, b)} = ${pw(10, `${k1} + ${b}`)} = ${pw(10, k)} = ${texQ(desyat)}`,
    ),
    delenie
      ? etap(
          'Делим на степень',
          `Делить на $${pw(c, e)}$ — то же, что умножить на $${pw(c, -e)} = ${texQ(Cpol)}$.`,
          `${texQ(desyat)} : ${pw(c, e)} = ${texQ(desyat)} \\cdot ${texQ(Cpol)} = ${texQ(otvet)}`,
        )
      : etap(
          'Умножаем',
          `$${pw(c, e)} = ${texQ(C)}$. ${perenos(k)}`,
          `${texQ(desyat)} \\cdot ${texQ(C)} = ${texQ(otvet)}`,
        ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $${pw(o, a)}$?`,
      f(pw(10, k1)),
      [f(pw(10, -k1)), f(pw(10, s === -2 ? -a : -2 * a))],
      h,
      `$${d(o)} = ${pw(10, s)}$, показатели перемножаются: $${s} \\cdot ${a} = ${k1}$.`,
    ),
    delenie
      ? vopros(
          `На что умножить вместо деления на $${pw(c, e)}$?`,
          f(texQ(Cpol)),
          [f(texQ(C)), f(texQ(q(-Number(Cpol.n))))],
          h + 1,
          `$a^{-n} = \\dfrac{1}{a^{n}}$, а делить на дробь — умножать на обратную.`,
        )
      : vopros(
          'Чему равно значение выражения?',
          f(texQ(otvet)),
          [f(texQ(mul(C, powQ(q(10), -k)))), f(texQ(mul(otvet, q(10))))],
          h + 1,
          perenos(k),
        ),
  ];
  if (delenie) {
    hints.push(
      vopros(
        'Чему равно значение выражения?',
        f(texQ(otvet)),
        [f(texQ(mul(desyat, C))), f(texQ(mul(otvet, q(10))))],
        h + 2,
        `$${texQ(desyat)} \\cdot ${texQ(Cpol)} = ${texQ(otvet)}$.`,
      ),
    );
  }
  return { otvet, etapy, hints };
}

/* ── Виды записей раздела I ────────────────────────────────────── */

export const VIDY_STEPENI: Vid[] = [
  {
    re: /^\\frac\{(\d+)\^\{(\d+)\}\}\{(\d+)\^\{(\d+)\}\\cdot (\d+)\^\{(\d+)\}\}$/,
    reshit: (m, z) =>
      raznyeOsnovaniya(num(m[1]), num(m[2]), num(m[3]), num(m[4]), num(m[5]), num(m[6]), true, z),
  },
  {
    re: /^\\frac\{(\d+)\^\{(\d+)\}\\cdot (\d+)\^\{(\d+)\}\}\{(\d+)\^\{(\d+)\}\}$/,
    reshit: (m, z) => {
      const B = num(m[1]);
      const C = num(m[3]);
      const A = num(m[5]);
      return raznyeOsnovaniya(A, num(m[6]), B, num(m[2]), C, num(m[4]), false, z);
    },
  },
  {
    re: /^\\left\((0,0?1)\\right\)\^\{(\d+)\}\\cdot 10\^\{(\d+)\}\\cdot (\d+)\^\{(\d+)\}$/,
    reshit: (m, z) =>
      desyatichnoeOsnovanie(m[1] ?? '', num(m[2]), num(m[3]), num(m[4]), num(m[5]), false, z),
  },
  {
    re: /^\\left\((0,0?1)\\right\)\^\{(\d+)\}\\cdot 10\^\{(\d+)\}:(\d+)\^\{(-\d+)\}$/,
    reshit: (m, z) =>
      desyatichnoeOsnovanie(m[1] ?? '', num(m[2]), num(m[3]), num(m[4]), num(m[5]), true, z),
  },
  {
    re: new RegExp(`^\\\\frac\\{${D}\\\\cdot ${P10}\\}\\{${D}\\\\cdot ${P10}\\}$`),
    reshit: (m, z) =>
      standartnyy(
        m[1] ?? '',
        m[2] === undefined ? null : num(m[2]),
        m[3] ?? '',
        m[4] === undefined ? null : num(m[4]),
        true,
        z,
        true,
      ),
  },
  {
    re: new RegExp(
      `^\\\\left\\(${D}\\\\cdot ${P10}\\\\right\\)(\\\\cdot |:)\\\\left\\(${D}\\\\cdot ${P10}\\\\right\\)$`,
    ),
    reshit: (m, z) =>
      standartnyy(
        m[1] ?? '',
        m[2] === undefined ? null : num(m[2]),
        m[4] ?? '',
        m[5] === undefined ? null : num(m[5]),
        m[3] === ':',
        z,
        false,
      ),
  },
  /* Сумма степеней: m·b^e ± …, (−1)^n, (−10)^n. */
  {
    re: /^(?:[+-]?(?:\d+(?:,\d+)?\\cdot\s?)?(?:\\left\(-?\d+\\right\)|\d+)(?:\^\{-?\d+\})?)+$/,
    reshit: (_m, z) => summaStepeney(z),
  },
  /* Всё остальное в разделе — степени одного основания. */
  { re: /^.*\^\{.*$/, reshit: (_m, z) => odnoOsnovanie(z) },
];
