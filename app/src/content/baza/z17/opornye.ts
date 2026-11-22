/**
 * База, №17: опорные задачи — короткие задачи на один-два шага. Из этих
 * шагов складывается любое уравнение номера. Ответ считается по
 * формуле из чисел условия (точными дробями, lib/baza/chisla.ts), а
 * независимый пересчёт — перебором: ищем x вида k/40, при котором обе
 * части уравнения равны. Сверяет pnpm test:baza.
 */

import { tex, zapis as zapisBlanka } from '@/lib/baza/chisla';
import type { BlokOpornyh, MikroZadacha, NavykOpornyh } from '@/lib/baza/types';

const zadachi = (slug: string, spisok: Omit<MikroZadacha, 'id'>[]): MikroZadacha[] =>
  spisok.map((z, i) => ({ ...z, id: `b17-${slug}-${String(i + 1).padStart(2, '0')}` }));

/** m/n в записи бланка при любом знаке знаменателя. */
const zapis = (m: number, n: number): string => (n < 0 ? zapisBlanka(-m, -n) : zapisBlanka(m, n));
const texDrob = (m: number, n: number): string => tex(zapis(m, n));

/* ── Запись в TeX ── */

/** Член kx: 1 → «x», −1 → «-x», 3 → «3x». */
const kx = (k: number, v = 'x'): string => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`);
/** Слагаемое со знаком: 4 → «+4», −4 → «-4», 0 → «». */
const sl = (n: number): string => (n === 0 ? '' : n > 0 ? `+${n}` : `-${-n}`);
/** px + q; при отрицательном p — «q − |p|x», как пишут в задачнике. */
const lin = (p: number, q: number): string =>
  p < 0 && q > 0 ? `${q}${kx(p)}` : `${kx(p)}${sl(q)}`;
/** ax² + bx + c без нулевых членов. */
const kv = (a: number, b: number, c: number): string =>
  `${kx(a, 'x^2')}${b === 0 ? '' : `${b > 0 ? '+' : '-'}${kx(Math.abs(b))}`}${sl(c)}`;
/** Число в скобках, если оно отрицательное. */
const sk = (n: number): string => (n < 0 ? `(${n})` : `${n}`);

/* ── Пересчёт перебором ── */

const ZN = 40;

/** Все x = k/40 из [−250; 250], где обе части равны. Ответ — запись бланка. */
function perebor(levaya: (x: number) => number, pravaya: (x: number) => number): string[] {
  const korni: string[] = [];
  for (let k = -250 * ZN; k <= 250 * ZN; k += 1) {
    const x = k / ZN;
    const l = levaya(x);
    const p = pravaya(x);
    if (Number.isFinite(l) && Number.isFinite(p) && Math.abs(l - p) <= 1e-9 * (1 + Math.abs(p))) {
      korni.push(zapis(k, ZN));
    }
  }
  return korni;
}

const edinstvenny = (l: (x: number) => number, p: (x: number) => number): string => {
  const r = perebor(l, p);
  return r.length === 1 && r[0] !== undefined ? r[0] : `корней ${r.length}`;
};

/** Из записей бланка — меньшая или большая. */
const vybrat = (korni: string[], vopros: 'm' | 'b'): string => {
  const chisla = korni.map((s) => Number(s.replace('−', '-').replace(',', '.')));
  const x = vopros === 'm' ? Math.min(...chisla) : Math.max(...chisla);
  return korni[chisla.indexOf(x)] ?? 'корней нет';
};

const VOPROS = {
  m: { tekst: 'меньший', slovo: 'Меньший' },
  b: { tekst: 'больший', slovo: 'Больший' },
} as const;

/* ═══ Навык 1. Линейные ═══ */

/* Блок 1. ax + b = cx + d */
const PERENOS: [number, number, number, number][] = [
  [7, -4, 3, 8],
  [2, 9, 5, -3],
  [6, 1, -2, -7],
  [3, 7, -5, 5],
  [8, -3, 6, 6],
  [4, 11, 9, -14],
];

const blokPerenos: BlokOpornyh = {
  slug: 'perenos',
  nazvanie: 'Иксы влево, числа вправо',
  opisanie: 'Перенести слагаемые с переменной в одну часть, числа — в другую',
  zapomni: 'При переносе знак меняется. $ax + b = cx + d \\Rightarrow (a - c)x = d - b$.',
  znak: 'ax=b',
  zadachi: zadachi(
    'perenos',
    PERENOS.map(([a, b, c, d]) => ({
      uslovie: `Найдите корень уравнения $${lin(a, b)}=${lin(c, d)}$.`,
      otvet: zapis(d - b, a - c),
      podskazka: `Перенесите $${kx(c)}$ влево, а $${b}$ вправо — со сменой знака.`,
      razbor: [
        `$${kx(a)}${sl(-c)}x=${d}${sl(-b)}$, $${kx(a - c)}=${d - b}$.`,
        `$x=\\dfrac{${Math.sign(a - c) * (d - b)}}{${Math.abs(a - c)}}=${texDrob(d - b, a - c)}$.`,
      ],
      proverka: () =>
        edinstvenny(
          (x) => a * x + b,
          (x) => c * x + d,
        ),
    })),
  ),
};

/* Блок 2. p + q(x + r) = s */
const SKOBKI: [number, number, number, number][] = [
  [5, 3, 4, -1],
  [12, 2, -3, 4],
  [7, 4, 1, 1],
  [3, 5, -2, 18],
  [9, 2, 6, -1],
  [4, 8, -1, 2],
];

const blokSkobki: BlokOpornyh = {
  slug: 'skobki',
  nazvanie: 'Раскрыть скобки',
  opisanie: 'Умножить число перед скобкой на каждое слагаемое в ней',
  zapomni: '$q(x + r) = qx + qr$. Потом числа — в одну часть, $x$ — в другую.',
  znak: 'q(x)',
  zadachi: zadachi(
    'skobki',
    SKOBKI.map(([p, q, r, s]) => ({
      uslovie: `Найдите корень уравнения $${p}+${q}(x${sl(r)})=${s}$.`,
      otvet: zapis(s - p - q * r, q),
      podskazka: `Умножьте $${q}$ на $x$ и на $${r}$.`,
      razbor: [
        `$${p}+${kx(q)}${sl(q * r)}=${s}$, $${kx(q)}=${s - p - q * r}$.`,
        `$x=${texDrob(s - p - q * r, q)}$.`,
      ],
      proverka: () =>
        edinstvenny(
          (x) => p + q * (x + r),
          () => s,
        ),
    })),
  ),
};

/* Блок 3. (x − a)² = x² + c */
const KVADRATY: [number, number][] = [
  [3, -3],
  [4, -8],
  [2, 8],
  [6, 6],
  [5, 45],
  [10, -20],
];

const blokKvadraty: BlokOpornyh = {
  slug: 'kvadraty',
  nazvanie: 'Квадраты сокращаются',
  opisanie: 'Раскрыть квадрат разности, и уравнение станет линейным',
  zapomni: '$(x - a)^2 = x^2 - 2ax + a^2$. Слагаемое $x^2$ есть в обеих частях — оно уходит.',
  znak: '(x)^2',
  zadachi: zadachi(
    'kvadraty',
    KVADRATY.map(([a, c]) => ({
      uslovie: `Найдите корень уравнения $(x-${a})^2=x^2${sl(c)}$.`,
      otvet: zapis(a * a - c, 2 * a),
      podskazka: `$(x-${a})^2=x^2-${2 * a}x+${a * a}$.`,
      razbor: [
        `$x^2-${2 * a}x+${a * a}=x^2${sl(c)}$, $${-2 * a}x=${c - a * a}$.`,
        `$x=${texDrob(a * a - c, 2 * a)}$.`,
      ],
      proverka: () =>
        edinstvenny(
          (x) => (x - a) ** 2,
          (x) => x * x + c,
        ),
    })),
  ),
};

/* ═══ Навык 2. Квадратные ═══ */

/* Блок 4. ax² + bx = 0 */
const NEPOLNYE: [number, number, 'm' | 'b'][] = [
  [1, -9, 'b'],
  [1, 7, 'm'],
  [1, 12, 'b'],
  [2, -7, 'b'],
  [5, 20, 'm'],
  [1, -15, 'm'],
];

const blokNepolnye: BlokOpornyh = {
  slug: 'nepolnye',
  nazvanie: 'Вынести за скобку',
  opisanie: 'Нет свободного члена — выносим переменную, один корень равен нулю',
  zapomni: '$x(ax + b) = 0$: $x = 0$ или $x = -\\dfrac{b}{a}$. На $x$ не делим.',
  znak: 'x(\\,)',
  zadachi: zadachi(
    'nepolnye',
    NEPOLNYE.map(([a, b, v]) => {
      const vtoroy = zapis(-b, a);
      const otvet = vybrat(['0', vtoroy], v);
      return {
        uslovie: `Решите уравнение $${kv(a, b, 0)}=0$. Если уравнение имеет более одного корня, в ответ запишите ${VOPROS[v].tekst} из корней.`,
        otvet,
        podskazka: `Вынесите $x$ за скобку: $x(${lin(a, b)})=0$.`,
        razbor: [
          `$x=0$ или $${lin(a, b)}=0$, то есть $x=${tex(vtoroy)}$.`,
          `${VOPROS[v].slovo} корень — $${tex(otvet)}$.`,
        ],
        proverka: () =>
          vybrat(
            perebor(
              (x) => a * x * x + b * x,
              () => 0,
            ),
            v,
          ),
      };
    }),
  ),
};

/* Блок 5. Дискриминант ax² + bx + c */
const DISKR: [number, number, number][] = [
  [1, -5, 6],
  [1, 4, -21],
  [2, -3, -5],
  [1, 6, 9],
  [3, 1, -2],
  [1, -2, -8],
];

const blokD: BlokOpornyh = {
  slug: 'diskriminant',
  nazvanie: 'Найти дискриминант',
  opisanie: 'Подставить коэффициенты в формулу, не потеряв знаки',
  zapomni: '$D = b^2 - 4ac$. Отрицательное $b$ — в скобках, при $c < 0$ минус на минус даёт плюс.',
  znak: 'D',
  zadachi: zadachi(
    'diskr',
    DISKR.map(([a, b, c]) => ({
      uslovie: `Найдите дискриминант уравнения $${kv(a, b, c)}=0$.`,
      otvet: String(b * b - 4 * a * c),
      podskazka: `$a=${a}$, $b=${b}$, $c=${c}$.`,
      razbor: [
        `$D=${sk(b)}^2-4\\cdot ${a}\\cdot ${sk(c)}=${b * b}${sl(-4 * a * c)}=${b * b - 4 * a * c}$.`,
      ],
      /* Иначе: D = −4a·f(x₀), где x₀ = −b/(2a) — вершина параболы. */
      proverka: () => {
        const x0 = -b / (2 * a);
        return String(Math.round(-4 * a * (a * x0 * x0 + b * x0 + c)));
      },
    })),
  ),
};

/* Блок 6. x² + bx + c = 0, меньший или больший корень */
const KORNI: [number, number, 'm' | 'b'][] = [
  [-2, -15, 'b'],
  [9, 14, 'm'],
  [-1, -12, 'm'],
  [4, -32, 'b'],
  [-11, 24, 'm'],
  [1, -30, 'b'],
];

const blokKorni: BlokOpornyh = {
  slug: 'korni',
  nazvanie: 'Корни через дискриминант',
  opisanie: 'Найти оба корня и выбрать тот, о котором спрашивают',
  zapomni:
    '$x_{1,2} = \\dfrac{-b \\pm \\sqrt{D}}{2a}$. Меньший корень левее на числовой прямой: $-7 < -2$.',
  znak: '\\pm\\sqrt{D}',
  zadachi: zadachi(
    'korni',
    KORNI.map(([b, c, v]) => {
      const D = b * b - 4 * c;
      const s = Math.round(Math.sqrt(D));
      const x1 = zapis(-b + s, 2);
      const x2 = zapis(-b - s, 2);
      const otvet = vybrat([x1, x2], v);
      return {
        uslovie: `Решите уравнение $${kv(1, b, c)}=0$. Если уравнение имеет более одного корня, в ответ запишите ${VOPROS[v].tekst} из корней.`,
        otvet,
        podskazka: `$D=${sk(b)}^2-4\\cdot ${sk(c)}$.`,
        razbor: [
          `$D=${b * b}${sl(-4 * c)}=${D}$, $\\sqrt{D}=${s}$.`,
          `$x=\\dfrac{${-b}\\pm ${s}}{2}$: корни $${tex(x1)}$ и $${tex(x2)}$.`,
          `${VOPROS[v].slovo} корень — $${tex(otvet)}$.`,
        ],
        proverka: () =>
          vybrat(
            perebor(
              (x) => x * x + b * x + c,
              () => 0,
            ),
            v,
          ),
      };
    }),
  ),
};

/* ═══ Навык 3. Показательные ═══ */

/** a^n в TeX: целое или 1/a^|n|. */
const stepenTex = (a: number, n: number): string =>
  n >= 0 ? String(a ** n) : `\\dfrac{1}{${a ** -n}}`;

/* Блок 7. Число как степень: (p/q)^n = m/k */
const STEPEN: [number, number, number, number][] = [
  [2, 1, 64, 1],
  [3, 1, 1, 27],
  [1, 2, 8, 1],
  [5, 1, 1, 1],
  [1, 3, 1, 81],
  [4, 1, 1, 16],
];

const drobTex = (m: number, k: number): string => (k === 1 ? String(m) : `\\dfrac{${m}}{${k}}`);
const osnTex = (p: number, q: number): string =>
  q === 1 ? String(p) : `\\left(\\dfrac{${p}}{${q}}\\right)`;

const blokStepen: BlokOpornyh = {
  slug: 'stepen',
  nazvanie: 'Число как степень',
  opisanie: 'Узнать в числе или дроби степень нужного основания',
  zapomni: '$\\dfrac{1}{a^n} = a^{-n}$, $\\left(\\dfrac{1}{a}\\right)^n = a^{-n}$, $a^0 = 1$.',
  znak: 'a^{-n}',
  zadachi: zadachi(
    'stepen',
    STEPEN.map(([p, q, m, k]) => {
      const n = Math.round(Math.log(m / k) / Math.log(p / q));
      return {
        uslovie: `Найдите $n$, если $${osnTex(p, q)}^n=${drobTex(m, k)}$.`,
        otvet: zapis(n, 1),
        podskazka:
          m === 1 && k === 1
            ? 'Любое число, кроме нуля, в нулевой степени равно 1.'
            : q !== 1
              ? `Переверните основание: $${osnTex(p, q)}^n=${q}^{-n}$.`
              : k === 1
                ? `Сколько раз нужно умножить $${p}$ само на себя, чтобы получить $${m}$?`
                : 'Дробь с единицей в числителе — степень с минусом.',
        razbor: [`$${drobTex(m, k)}=${osnTex(p, q)}^{${n}}$, значит $n=${n}$.`],
        proverka: () => {
          /* Целые: (p/q)^n = m/k ⇔ p^n·k = m·q^n при n ≥ 0, иначе q^|n|·k = m·p^|n|. */
          for (let t = -12; t <= 12; t += 1) {
            const ok = t >= 0 ? p ** t * k === m * q ** t : q ** -t * k === m * p ** -t;
            if (ok) return zapis(t, 1);
          }
          return 'нет';
        },
      };
    }),
  ),
};

/* Блок 8. a^{px+q} = a^n */
const POKAZATEL: [number, number, number, number][] = [
  [2, 1, -3, 4],
  [3, 1, 5, -2],
  [5, 2, -1, 3],
  [2, 4, 1, -3],
  [7, 1, 4, 0],
  [3, 2, 3, 4],
];

const blokPokazatel: BlokOpornyh = {
  slug: 'pokazateli',
  nazvanie: 'Приравнять показатели',
  opisanie: 'Записать правую часть степенью того же основания и сравнить показатели',
  zapomni: '$a^{f(x)} = a^{n} \\Rightarrow f(x) = n$.',
  znak: 'a^f=a^g',
  zadachi: zadachi(
    'pokazatel',
    POKAZATEL.map(([a, p, q, n]) => ({
      uslovie: `Найдите корень уравнения $${a}^{${lin(p, q)}}=${stepenTex(a, n)}$.`,
      otvet: zapis(n - q, p),
      podskazka: `Запишите $${stepenTex(a, n)}$ как степень числа $${a}$.`,
      razbor: [
        `$${stepenTex(a, n)}=${a}^{${n}}$, значит $${lin(p, q)}=${n}$.`,
        `$x=${texDrob(n - q, p)}$.`,
      ],
      proverka: () =>
        edinstvenny(
          (x) => a ** (p * x + q),
          () => a ** n,
        ),
    })),
  ),
};

/* Блок 9. a^{px+q} · a^{rx+s} = a^n */
const PROIZV: [number, number, number, number, number, number][] = [
  [2, 3, 1, -1, 2, 5],
  [3, 1, 4, 2, -3, -2],
  [5, 4, -1, -2, 3, 2],
  [2, 5, 2, -3, 1, -1],
  [7, 1, 6, -3, -1, 2],
  [3, 2, 5, 2, -9, 0],
];

const blokProizv: BlokOpornyh = {
  slug: 'proizvedenie',
  nazvanie: 'Произведение степеней',
  opisanie: 'Сложить показатели множителей и получить одну степень',
  zapomni: '$a^m \\cdot a^n = a^{m+n}$, $a^m : a^n = a^{m-n}$.',
  znak: 'a^m a^n',
  zadachi: zadachi(
    'proizv',
    PROIZV.map(([a, p, q, r, s, n]) => ({
      uslovie: `Найдите корень уравнения $${a}^{${lin(p, q)}}\\cdot ${a}^{${lin(r, s)}}=${stepenTex(a, n)}$.`,
      otvet: zapis(n - q - s, p + r),
      podskazka: 'Основания одинаковые — показатели складываем.',
      razbor: [
        `$(${lin(p, q)})+(${lin(r, s)})=${lin(p + r, q + s)}$, а $${stepenTex(a, n)}=${a}^{${n}}$.`,
        `$${lin(p + r, q + s)}=${n}$, $x=${texDrob(n - q - s, p + r)}$.`,
      ],
      proverka: () =>
        edinstvenny(
          (x) => a ** (p * x + q) * a ** (r * x + s),
          () => a ** n,
        ),
    })),
  ),
};

/* Блок 10. a^x + k·a^x = M */
const MNOZHITEL: [number, number, number][] = [
  [2, 7, 3],
  [3, 2, 2],
  [5, 4, 1],
  [2, 3, 5],
  [3, 8, 3],
  [2, 15, -1],
];

const blokMnozhitel: BlokOpornyh = {
  slug: 'obshchiy-mnozhitel',
  nazvanie: 'Подобные степени',
  opisanie: 'Сложить одинаковые степени, как подобные слагаемые',
  zapomni: '$a^x + k \\cdot a^x = (1 + k) \\cdot a^x$. Потом делим и приводим к одному основанию.',
  znak: 'ka^x',
  zadachi: zadachi(
    'mnozhitel',
    MNOZHITEL.map(([a, k, n]) => {
      /* M = (1 + k)·a^n — целое число. */
      const M = n >= 0 ? (1 + k) * a ** n : (1 + k) / a ** -n;
      return {
        uslovie: `Найдите корень уравнения $${a}^x+${k}\\cdot ${a}^x=${M}$.`,
        otvet: zapis(n, 1),
        podskazka: `$${a}^x+${k}\\cdot ${a}^x=${1 + k}\\cdot ${a}^x$.`,
        razbor: [
          `$${1 + k}\\cdot ${a}^x=${M}$, $${a}^x=${n >= 0 ? a ** n : texDrob(1, a ** -n)}$.`,
          `$${a}^x=${a}^{${n}}$, $x=${n}$.`,
        ],
        proverka: () =>
          edinstvenny(
            (x) => a ** x + k * a ** x,
            () => M,
          ),
      };
    }),
  ),
};

/* ═══ Навык 4. Корень и логарифм ═══ */

/* Блок 11. √(px + q) = c */
const KOREN: [number, number, number][] = [
  [-1, 7, 2],
  [1, 9, 5],
  [2, -3, 3],
  [-1, 20, 4],
  [4, 1, 7],
  [-2, 10, 6],
];

const blokKoren: BlokOpornyh = {
  slug: 'koren',
  nazvanie: 'Убрать корень',
  opisanie: 'Возвести обе части в квадрат и решить линейное уравнение',
  zapomni:
    '$\\sqrt{f(x)} = c \\Rightarrow f(x) = c^2$ при $c \\ge 0$. Корень проверяем подстановкой.',
  znak: '\\sqrt{x}',
  zadachi: zadachi(
    'koren',
    KOREN.map(([p, q, c]) => ({
      uslovie: `Найдите корень уравнения $\\sqrt{${lin(p, q)}}=${c}$.`,
      otvet: zapis(c * c - q, p),
      podskazka: `Возведите обе части в квадрат: справа будет $${c * c}$.`,
      razbor: [
        `$${lin(p, q)}=${c * c}$, ${p === 1 ? '' : `$${kx(p)}=${c * c - q}$, `}$x=${texDrob(c * c - q, p)}$.`,
      ],
      proverka: () =>
        edinstvenny(
          (x) => (p * x + q >= 0 ? Math.sqrt(p * x + q) : NaN),
          () => c,
        ),
    })),
  ),
};

/* Блок 12. log_a(px + q) = c */
const LOG: [number, number, number, number][] = [
  [2, 1, -3, 4],
  [3, 2, 1, 2],
  [10, 4, 20, 2],
  [5, 1, 7, 0],
  [4, 3, 1, 2],
  [2, 4, -2, -1],
];

const logTex = (a: number): string => (a === 10 ? '\\lg' : `\\log_{${a}}`);

const blokLog: BlokOpornyh = {
  slug: 'logarifm',
  nazvanie: 'Логарифм по определению',
  opisanie: 'Аргумент логарифма равен основанию в степени правой части',
  zapomni: '$\\log_a f(x) = c \\Rightarrow f(x) = a^c$. Под логарифмом — положительное число.',
  znak: '\\log_a x',
  zadachi: zadachi(
    'log',
    LOG.map(([a, p, q, c]) => {
      /* a^c = vn/vd. */
      const vn = c >= 0 ? a ** c : 1;
      const vd = c >= 0 ? 1 : a ** -c;
      return {
        uslovie: `Найдите корень уравнения $${logTex(a)}(${lin(p, q)})=${c}$.`,
        otvet: zapis(vn - q * vd, p * vd),
        podskazka: `По определению $${lin(p, q)}=${a}^{${c}}$.`,
        razbor: [
          `$${lin(p, q)}=${a}^{${c}}=${texDrob(vn, vd)}$.`,
          `${p === 1 ? '' : `$${kx(p)}=${texDrob(vn - q * vd, vd)}$, `}$x=${texDrob(vn - q * vd, p * vd)}$.`,
        ],
        proverka: () =>
          edinstvenny(
            (x) => (p * x + q > 0 ? Math.log(p * x + q) / Math.log(a) : NaN),
            () => c,
          ),
      };
    }),
  ),
};

/* Блок 13. log_a(px + q) + log_a k = log_a m */
const SUMMA: [string, number, number, number, number][] = [
  ['3', 1, -4, 2, 18],
  ['5', 2, 1, 3, 27],
  ['2', 1, 5, 4, 12],
  ['7', 2, -1, 5, 15],
  ['6', 1, -2, 4, 10],
  ['0{,}2', 3, -3, 2, 12],
];

const blokSumma: BlokOpornyh = {
  slug: 'summa-logarifmov',
  nazvanie: 'Сумма логарифмов',
  opisanie: 'Собрать сумму логарифмов в один и приравнять аргументы',
  zapomni:
    '$\\log_a m + \\log_a n = \\log_a(mn)$. Из $\\log_a f(x) = \\log_a b$ следует $f(x) = b$.',
  znak: '\\log mn',
  zadachi: zadachi(
    'summa',
    SUMMA.map(([a, p, q, k, m]) => ({
      uslovie: `Найдите корень уравнения $\\log_{${a}}(${lin(p, q)})+\\log_{${a}}${k}=\\log_{${a}}${m}$.`,
      otvet: zapis(m - k * q, k * p),
      podskazka: `Слева $\\log_{${a}}\\bigl(${k}(${lin(p, q)})\\bigr)$.`,
      razbor: [
        `$${k}(${lin(p, q)})=${m}$, $${lin(p, q)}=${texDrob(m, k)}$.`,
        `$x=${texDrob(m - k * q, k * p)}$.`,
      ],
      /* Проверка через сами логарифмы: основание здесь не важно, берём натуральные. */
      proverka: () =>
        edinstvenny(
          (x) => (p * x + q > 0 ? Math.log(p * x + q) + Math.log(k) : NaN),
          () => Math.log(m),
        ),
    })),
  ),
};

export const OPORNYE_17: NavykOpornyh[] = [
  {
    id: 'lineynye',
    nazvanie: 'Линейные уравнения',
    lead: 'Раскрыть скобки, перенести, разделить на коэффициент',
    ton: 'blue',
    bloki: [blokPerenos, blokSkobki, blokKvadraty],
  },
  {
    id: 'kvadratnye',
    nazvanie: 'Квадратные уравнения',
    lead: 'Вынести за скобку или найти дискриминант, выбрать нужный корень',
    ton: 'orange',
    bloki: [blokNepolnye, blokD, blokKorni],
  },
  {
    id: 'pokazatelnye',
    nazvanie: 'Показательные уравнения',
    lead: 'Привести к одному основанию и приравнять показатели',
    ton: 'green',
    bloki: [blokStepen, blokPokazatel, blokProizv, blokMnozhitel],
  },
  {
    id: 'koren-logarifm',
    nazvanie: 'Корень и логарифм',
    lead: 'Возвести в квадрат или убрать логарифм по определению, затем проверить',
    ton: 'navy',
    bloki: [blokKoren, blokLog, blokSumma],
  },
];
