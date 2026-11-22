/**
 * База, задание №16, раздел II «Преобразование иррациональных
 * выражений»: разборы.
 *
 * Приёмы — как в профильном №8 (lib/vychisleniya/prototypes/korni.ts):
 * корни собираем под один знак (√a·√b = √(ab), √a/√b = √(a/b)),
 * сокращаем под корнем и только потом извлекаем; (k√a)² = k²·a;
 * произведение суммы на разность — разность квадратов.
 */

import { dec, div, mul, powQ, q, sqrtQ, sub, add, texDrobQ, texQ, type Q } from './drob';
import { d, etap, f, hesh, num, pw, vopros, type Resh, type Vid } from './obshchee';

function koren(x: Q, zapis: string): Q {
  const r = sqrtQ(x);
  if (r === null) throw new Error(`корень не извлекается: ${x.n}/${x.d} в «${zapis}»`);
  return r;
}

/** Подкоренное в TeX: целое, десятичная дробь или \dfrac. */
function podKornem(x: Q): string {
  return texDrobQ(x);
}

/** Корень: обыкновенной дробью, а если она не целая — ещё и десятичной. */
function kornyaZnach(r: Q): string {
  const a = texDrobQ(r);
  const b = texQ(r);
  return a === b ? a : `${a} = ${b}`;
}

/* ── Корни собираем под один знак ─────────────────────────────── */

interface Drob {
  /** Множитель перед корнем в числителе и в знаменателе. */
  mVerh: string | null;
  mNiz: string | null;
  /** Подкоренные множители числителя и знаменателя (как в записи). */
  verh: string[][];
  niz: string[][];
}

const proizv = (xs: string[]) => xs.map(d).join(' \\cdot ');

function podOdin(o: Drob, zapis: string, iskhod: string): Resh {
  const val = (xs: string[]) => xs.reduce((acc, x) => mul(acc, dec(x)), q(1));
  const V = o.verh.reduce((acc, xs) => mul(acc, val(xs)), q(1));
  const N = o.niz.reduce((acc, xs) => mul(acc, val(xs)), q(1));
  const X = div(V, N);
  const r = koren(X, zapis);
  const mV = o.mVerh === null ? q(1) : dec(o.mVerh);
  const mN = o.mNiz === null ? q(1) : dec(o.mNiz);
  const mnozh = div(mV, mN);
  const otvet = mul(mnozh, r);
  const verhTex = o.verh.map(proizv).join(' \\cdot ');
  const nizTex = o.niz.map(proizv).join(' \\cdot ');
  const bezMnozh =
    o.niz.length === 0 ? `\\sqrt{${verhTex}}` : `\\sqrt{\\dfrac{${verhTex}}{${nizTex}}}`;
  const mnozhTex =
    o.mVerh === null && o.mNiz === null
      ? ''
      : o.mNiz === null
        ? `${d(o.mVerh ?? '1')}`
        : `\\dfrac{${d(o.mVerh ?? '1')}}{${d(o.mNiz)}}`;
  const sMnozh = (t: string) => (mnozhTex === '' ? t : `${mnozhTex} \\cdot ${t}`);
  const etapy = [
    etap(
      'Собираем под один корень',
      o.niz.length === 0
        ? 'Произведение корней равно корню из произведения: $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$.'
        : 'Корни перемножаются и делятся под одним знаком: $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$, $\\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}$.',
      `${iskhod} = ${sMnozh(bezMnozh)}`,
    ),
    etap(
      o.niz.length === 0 ? 'Перемножаем и извлекаем корень' : 'Сокращаем под корнем и извлекаем',
      `Корень извлекаем только теперь: $\\left(${texDrobQ(r)}\\right)^{2} = ${podKornem(X)}$.`,
      `${sMnozh(bezMnozh)} = ${sMnozh(`\\sqrt{${podKornem(X)}}`)} = ${mnozhTex === '' ? kornyaZnach(r) : sMnozh(texDrobQ(r))}${
        mnozhTex === '' ? '' : ` = ${texQ(otvet)}`
      }`,
    ),
  ];
  const h = hesh(zapis);
  const sum = o.niz.length === 0 ? o.verh.flat().reduce((acc, x) => add(acc, dec(x)), q(0)) : null;
  const hints = [
    vopros(
      'Какое число окажется под общим корнем?',
      f(podKornem(X)),
      [
        ...(sum === null ? [] : [f(texQ(sum))]),
        ...(o.niz.length === 0 ? [] : [f(texQ(mul(V, N)))]),
        f(texQ(mul(X, q(2)))),
      ],
      h,
      `${o.niz.length === 0 ? 'Перемножаем' : 'Делим'} числа под корнями: получается $${podKornem(X)}$.`,
    ),
    vopros(
      `Чему равно $\\sqrt{${podKornem(X)}}$?`,
      f(texQ(r)),
      [f(texQ(div(X, q(2)))), f(texQ(add(r, q(1))))],
      h + 1,
      `$${texQ(r)}^{2} = ${podKornem(X)}$.`,
    ),
  ];
  if (mnozhTex !== '') {
    hints.push(
      vopros(
        'Чему равно значение выражения?',
        f(texQ(otvet)),
        [f(texQ(r)), f(texQ(div(r, mnozh)))],
        h + 2,
        `$${mnozhTex} \\cdot ${texQ(r)} = ${texQ(otvet)}$.`,
      ),
    );
  }
  return { otvet, etapy, hints };
}

const ch = '(\\d+(?:,\\d+)?)';
const pod = `(${ch.slice(1, -1)}(?:\\\\cdot ${ch.slice(1, -1)})?)`;
const mnozh = (s: string | undefined) => (s === undefined || s === '' ? null : s);
const razbit = (s: string | undefined) => (s ?? '').split('\\cdot ').map((x) => x.trim());

/* ── (k√a)² и n/(k√a)² ────────────────────────────────────────── */

function kvadrat(k: number, a: number, n: number, kvadratSverhu: boolean, zapis: string): Resh {
  const K = k * k * a;
  const otvet = kvadratSverhu ? q(K, n) : q(n, K);
  const kv = `(${k}\\sqrt{${a}})^{2}`;
  const etapy = [
    etap(
      'Возводим в квадрат',
      'Квадрат произведения — произведение квадратов, а $(\\sqrt{a})^{2} = a$.',
      `${kv} = ${pw(k, 2)} \\cdot (\\sqrt{${a}})^{2} = ${k * k} \\cdot ${a} = ${K}`,
    ),
    etap(
      'Делим',
      null,
      kvadratSverhu
        ? `\\dfrac{${K}}{${n}} = ${texQ(otvet)}`
        : `\\dfrac{${n}}{${K}} = ${texDrobQ(otvet)} = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $${kv}$?`,
      f(String(K)),
      [f(String(k * a)), f(String(2 * k * a)), f(String(k * k + a))],
      h,
      `$${pw(k, 2)} \\cdot ${a} = ${K}$: в квадрат возводится и множитель $${k}$.`,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(kvadratSverhu ? q(k * a, n) : q(n, k * a))), f(texQ(div(q(1), otvet)))],
      h + 1,
      kvadratSverhu ? `$${K} : ${n} = ${texQ(otvet)}$.` : `$${n} : ${K} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── √(x^m · y^n) ─────────────────────────────────────────────── */

function korenStepeney(x: number, m: number, y: number, n: number, zapis: string): Resh {
  if (m % 2 !== 0 || n % 2 !== 0) throw new Error(`нечётный показатель в «${zapis}»`);
  const X = powQ(q(x), m / 2);
  const Y = powQ(q(y), n / 2);
  const otvet = mul(X, Y);
  const etapy = [
    etap(
      'Извлекаем корень из каждого множителя',
      'Корень из произведения — произведение корней, а $\\sqrt{a^{2k}} = a^{k}$: показатель делится пополам.',
      `\\sqrt{${pw(x, m)} \\cdot ${pw(y, n)}} = \\sqrt{${pw(x, m)}} \\cdot \\sqrt{${pw(y, n)}} = ${pw(x, m / 2)} \\cdot ${pw(y, n / 2)}`,
    ),
    etap(
      'Считаем',
      null,
      `${pw(x, m / 2)} \\cdot ${pw(y, n / 2)} = ${texQ(X)} \\cdot ${texQ(Y)} = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $\\sqrt{${pw(x, m)}}$?`,
      f(pw(x, m / 2)),
      [f(pw(x, m - 2)), f(pw(x, m * 2)), f(pw(x, m / 2 + 1))],
      h,
      `$\\left(${pw(x, m / 2)}\\right)^{2} = ${pw(x, m)}$.`,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(add(X, Y))), f(texQ(mul(otvet, q(x))))],
      h + 1,
      `$${texQ(X)} \\cdot ${texQ(Y)} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── (√a − √b)·√b ─────────────────────────────────────────────── */

function raskrytSkobki(a: number, b: number, zapis: string): Resh {
  const N = q(a * b);
  const r = koren(N, zapis);
  const otvet = sub(r, q(b));
  const etapy = [
    etap(
      'Раскрываем скобки',
      `Умножаем каждое слагаемое на $\\sqrt{${b}}$; $\\sqrt{${b}} \\cdot \\sqrt{${b}} = ${b}$.`,
      `\\left(\\sqrt{${a}} - \\sqrt{${b}}\\right) \\cdot \\sqrt{${b}} = \\sqrt{${a}} \\cdot \\sqrt{${b}} - \\sqrt{${b}} \\cdot \\sqrt{${b}} = \\sqrt{${a * b}} - ${b}`,
    ),
    etap(
      'Извлекаем корень и вычитаем',
      `$${texQ(r)}^{2} = ${a * b}$.`,
      `\\sqrt{${a * b}} - ${b} = ${texQ(r)} - ${b} = ${texQ(otvet)}`,
    ),
  ];
  const h = hesh(zapis);
  const hints = [
    vopros(
      `Чему равно $\\sqrt{${b}} \\cdot \\sqrt{${b}}$?`,
      f(String(b)),
      [f(String(b * b)), f(`\\sqrt{${b * 2}}`)],
      h,
      'Корень в квадрате равен подкоренному числу.',
    ),
    vopros(
      `Чему равно $\\sqrt{${a} \\cdot ${b}}$?`,
      f(texQ(r)),
      [f(String(a * b)), f(texQ(add(r, q(1))))],
      h + 1,
      `$\\sqrt{${a * b}} = ${texQ(r)}$.`,
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(texQ(sub(r, q(b * b)))), f(texQ(add(r, q(b))))],
      h + 2,
      `$${texQ(r)} - ${b} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

/* ── Разность квадратов (x − y)(x + y) ────────────────────────── */

interface Chlen {
  k: number | null;
  r: number | null;
  /** Без корня: само число. */
  c: number | null;
}

const CHL = '(?:(\\d*)\\\\sqrt\\{(\\d+)\\}|(\\d+))';

function chlen(k: string | undefined, r: string | undefined, c: string | undefined): Chlen {
  if (c !== undefined) return { k: null, r: null, c: num(c) };
  return { k: k === undefined || k === '' ? null : num(k), r: num(r), c: null };
}

function chlenTex(t: Chlen): string {
  if (t.c !== null) return String(t.c);
  return `${t.k === null ? '' : t.k}\\sqrt{${t.r}}`;
}

function kv(t: Chlen): { tex: string; v: number } {
  if (t.c !== null) return { tex: `${pw(t.c, 2)} = ${t.c * t.c}`, v: t.c * t.c };
  const r = t.r ?? 0;
  if (t.k === null) return { tex: `(\\sqrt{${r}})^{2} = ${r}`, v: r };
  return {
    tex: `(${t.k}\\sqrt{${r}})^{2} = ${pw(t.k, 2)} \\cdot ${r} = ${t.k * t.k * r}`,
    v: t.k * t.k * r,
  };
}

function raznostKvadratov(m: RegExpExecArray, zapis: string): Resh {
  const x1 = chlen(m[1], m[2], m[3]);
  const z1 = m[4];
  const y1 = chlen(m[5], m[6], m[7]);
  const x2 = chlen(m[8], m[9], m[10]);
  const z2 = m[11];
  const y2 = chlen(m[12], m[13], m[14]);
  if (
    JSON.stringify(x1) !== JSON.stringify(x2) ||
    JSON.stringify(y1) !== JSON.stringify(y2) ||
    z1 === z2
  ) {
    throw new Error(`не разность квадратов: «${zapis}»`);
  }
  const X = kv(x1);
  const Y = kv(y1);
  const otvet = q(X.v - Y.v);
  const xt = chlenTex(x1);
  const yt = chlenTex(y1);
  const iskhod = `\\left(${xt} ${z1} ${yt}\\right) \\cdot \\left(${xt} ${z2} ${yt}\\right)`;
  const etapy = [
    etap(
      'Узнаём разность квадратов',
      'Скобки отличаются только знаком: $(x - y)(x + y) = x^{2} - y^{2}$. Раскрывать скобки по одному слагаемому не нужно.',
      `${iskhod} = \\left(${xt}\\right)^{2} - \\left(${yt}\\right)^{2}`,
    ),
    etap(
      'Возводим в квадрат',
      '$(\\sqrt{a})^{2} = a$, а у $k\\sqrt{a}$ в квадрат возводится и множитель: $(k\\sqrt{a})^{2} = k^{2} \\cdot a$.',
      `${X.tex},\\quad ${Y.tex}`,
    ),
    etap('Вычитаем', null, `${X.v} - ${Y.v} = ${texQ(otvet)}`),
  ];
  const h = hesh(zapis);
  const nepolnyy = (t: Chlen) =>
    t.c !== null ? t.c * t.c : t.k === null ? (t.r ?? 0) : t.k * (t.r ?? 0);
  const hints = [
    vopros(
      'Какую формулу удобно применить?',
      f('(x - y)(x + y) = x^{2} - y^{2}'),
      [f('(x - y)(x + y) = (x - y)^{2}'), f('(x - y)(x + y) = x^{2} + y^{2}')],
      h,
      'Скобки отличаются только знаком — это разность квадратов.',
    ),
    vopros(
      `Чему равно $\\left(${x1.c !== null || x1.k === null ? yt : xt}\\right)^{2}$?`,
      f(String(x1.c !== null || x1.k === null ? Y.v : X.v)),
      [
        f(String(x1.c !== null || x1.k === null ? nepolnyy(y1) : nepolnyy(x1))),
        f(String(2 * (x1.c !== null || x1.k === null ? Y.v : X.v))),
      ],
      h + 1,
      'В квадрат возводится и множитель перед корнем, и сам корень.',
    ),
    vopros(
      'Чему равно значение выражения?',
      f(texQ(otvet)),
      [f(String(X.v + Y.v)), f(String(Y.v - X.v))],
      h + 2,
      `$${X.v} - ${Y.v} = ${texQ(otvet)}$.`,
    ),
  ];
  return { otvet, etapy, hints };
}

const SK_L = '(?:\\\\left\\(|\\()';
const SK_R = '(?:\\\\right\\)|\\))';

export const VIDY_KORNI: Vid[] = [
  /* √a·√b */
  {
    re: new RegExp(`^\\\\sqrt\\{${ch}\\}\\\\cdot\\\\sqrt\\{${ch}\\}$`),
    reshit: (m, z) =>
      podOdin(
        { mVerh: null, mNiz: null, verh: [[m[1] ?? ''], [m[2] ?? '']], niz: [] },
        z,
        `\\sqrt{${d(m[1] ?? '')}} \\cdot \\sqrt{${d(m[2] ?? '')}}`,
      ),
  },
  /* m/n·√a·√b */
  {
    re: /^\\frac\{(\d+)\}\{(\d+)\}\\sqrt\{(\d+)\}\\cdot\\sqrt\{(\d+)\}$/,
    reshit: (m, z) =>
      podOdin(
        { mVerh: m[1] ?? '', mNiz: m[2] ?? '', verh: [[m[3] ?? ''], [m[4] ?? '']], niz: [] },
        z,
        `\\dfrac{${m[1]}}{${m[2]}}\\sqrt{${m[3]}} \\cdot \\sqrt{${m[4]}}`,
      ),
  },
  /* (m√a)/(n√b), √(p·q)/√(r·s) */
  {
    re: new RegExp(`^\\\\frac\\{(\\d*)\\\\sqrt\\{${pod}\\}\\}\\{(\\d*)\\\\sqrt\\{${pod}\\}\\}$`),
    reshit: (m, z) =>
      podOdin(
        { mVerh: mnozh(m[1]), mNiz: mnozh(m[3]), verh: [razbit(m[2])], niz: [razbit(m[4])] },
        z,
        `\\dfrac{${m[1] ?? ''}\\sqrt{${proizv(razbit(m[2]))}}}{${m[3] ?? ''}\\sqrt{${proizv(razbit(m[4]))}}}`,
      ),
  },
  /* √a·√b/√c */
  {
    re: /^\\frac\{\\sqrt\{(\d+)\}\\cdot\\sqrt\{(\d+)\}\}\{\\sqrt\{(\d+)\}\}$/,
    reshit: (m, z) =>
      podOdin(
        { mVerh: null, mNiz: null, verh: [[m[1] ?? ''], [m[2] ?? '']], niz: [[m[3] ?? '']] },
        z,
        `\\dfrac{\\sqrt{${m[1]}} \\cdot \\sqrt{${m[2]}}}{\\sqrt{${m[3]}}}`,
      ),
  },
  {
    re: /^\\frac\{\((\d+)\\sqrt\{(\d+)\}\)\^2\}\{(\d+)\}$/,
    reshit: (m, z) => kvadrat(num(m[1]), num(m[2]), num(m[3]), true, z),
  },
  {
    re: /^\\frac\{(\d+)\}\{\((\d+)\\sqrt\{(\d+)\}\)\^2\}$/,
    reshit: (m, z) => kvadrat(num(m[2]), num(m[3]), num(m[1]), false, z),
  },
  {
    re: /^\\sqrt\{(\d+)\^(\d+)\\cdot (\d+)\^(\d+)\}$/,
    reshit: (m, z) => korenStepeney(num(m[1]), num(m[2]), num(m[3]), num(m[4]), z),
  },
  {
    re: /^\\left\(\\sqrt\{(\d+)\}-\\sqrt\{(\d+)\}\\right\)\\cdot\\sqrt\{(\d+)\}$/,
    reshit: (m, z) => {
      if (m[2] !== m[3]) throw new Error(`не тот множитель: «${z}»`);
      return raskrytSkobki(num(m[1]), num(m[2]), z);
    },
  },
  {
    re: new RegExp(`^${SK_L}${CHL}([+-])${CHL}${SK_R}\\\\cdot${SK_L}${CHL}([+-])${CHL}${SK_R}$`),
    reshit: (m, z) => raznostKvadratov(m, z),
  },
];
