/**
 * База №17: «Проверь себя» в теории — линейные и квадратные уравнения.
 *
 * Компонент и правила общие с теорией №6, №10, №11
 * (components/teoriya/ProverSebya.tsx, lib/teoriya/proverka-server.ts):
 * выбор плиткой, «Проверить», подсказка к каждой ошибке, «Ещё такое
 * же». Неверные варианты — типичные ошибки (перенос без смены знака,
 * деление на $x$, потерянный $-\sqrt{k}$, знак $-b$, деление на $2a$
 * только корня, «$x=0$» из $0\cdot x=b$), к каждой — своя подсказка.
 *
 * У каждого экземпляра есть запись уравнения `ur` (синтаксис
 * разборщика №17) и вопрос: pnpm test:baza решает уравнение перебором
 * (sverka.ts) — независимо от генератора — и сверяет верный вариант.
 * Первый экземпляр (nomer 0) — числа, подобранные для теории.
 */

import type { Rng } from '../../veroyatnost/generator';
import {
  peremeshat,
  type ShablonProverki,
  type VariantZadachi,
  type ZadachaProverki,
} from '../../teoriya/proverka-edinic';

export type VoprosTeorii = 'koren' | 'menshiy' | 'bolshiy';

export interface ZadachaProverki17 extends ZadachaProverki {
  /** Уравнение в записи разборщика №17 — для сверки перебором. */
  ur: string;
  vopros: VoprosTeorii;
}

export interface ShablonProverki17 extends ShablonProverki {
  sozdat(r: Rng, nomer: number): ZadachaProverki17;
}

/** Подписи вариантов без числа. */
export const NET = 'корней нет';
export const LYUBOE = '$x$ — любое число';

/* ── Запись чисел и многочленов ──────────────────────────────── */

const okr = (x: number): number => Math.round(x * 1000) / 1000;
const konechnoe = (x: number): boolean =>
  Number.isFinite(x) && Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-7;

/** Число в TeX: 2{,}5, −0{,}75. */
const t = (x: number): string => String(okr(x) === 0 ? 0 : okr(x)).replace('.', '{,}');
/** Число на плитке: $2{,}5$. */
const ch = (x: number): string => `$${t(x)}$`;
/** Отрицательное — в скобках, для подстановки. */
const ts = (x: number): string => (x < 0 ? `(${t(x)})` : t(x));

/** Многочлен по слагаемым [коэффициент, «x^2» | «x» | «»]. */
function mn(chleny: readonly (readonly [number, string])[]): string {
  let s = '';
  for (const [k, x] of chleny) {
    if (k === 0) continue;
    const a = Math.abs(k);
    const telo = x === '' ? String(a) : a === 1 ? x : `${a}${x}`;
    s += k < 0 ? `-${telo}` : s === '' ? telo : `+${telo}`;
  }
  return s === '' ? '0' : s;
}

const kv = (a: number, b: number, c: number): string =>
  mn([
    [a, 'x^2'],
    [b, 'x'],
    [c, ''],
  ]);
const lin = (k: number, m: number): string =>
  mn([
    [k, 'x'],
    [m, ''],
  ]);

const VOPROS_TEKST: Record<VoprosTeorii, string> = {
  koren: '',
  menshiy: ' Если уравнение имеет более одного корня, в ответ запишите меньший из корней.',
  bolshiy: ' Если уравнение имеет более одного корня, в ответ запишите больший из корней.',
};
const uslovie = (ur: string, v: VoprosTeorii): string =>
  `Решите уравнение $${ur}$.${VOPROS_TEKST[v]}`;

interface Lozhnyy {
  tekst: string;
  podskazka: string;
}

/** Неверный вариант-число; бесконечная дробь в ответе базы не бывает — пропускаем. */
const lch = (x: number, podskazka: string): Lozhnyy | null =>
  konechnoe(x) ? { tekst: ch(x), podskazka } : null;

/** Верный и три неверных варианта: повторы и совпадения с верным выбрасываются. */
function varianty(
  r: Rng,
  verno: string,
  lozhnye: readonly (Lozhnyy | null)[],
  /** Верное число: если типичных ошибок не хватило — соседние числа. */
  okolo?: number,
): VariantZadachi[] {
  const out: VariantZadachi[] = [{ tekst: verno, verno: true }];
  const byli = new Set([verno]);
  const zapas =
    okolo === undefined ? [] : [1, -1, 2, -2].map((d) => lch(okolo + d, PROVERKA_CHISLA));
  for (const l of [...lozhnye, ...zapas]) {
    if (l === null || byli.has(l.tekst)) continue;
    byli.add(l.tekst);
    out.push({ tekst: l.tekst, verno: false, podskazka: l.podskazka });
    if (out.length === 4) break;
  }
  if (out.length < 4) throw new Error('не хватило неверных вариантов');
  return peremeshat(r, out);
}

/** Повторять, пока генератор не даст годные числа. */
function poka<T>(f: () => T | null): T {
  for (let i = 0; i < 1000; i += 1) {
    const v = f();
    if (v !== null) return v;
  }
  throw new Error('числа не подобрались');
}

/** Корни-«красивые» числа: целые и половинки. */
const TSELYE = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const KORNI_LIN = [
  -4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5, -0.75, 0.25, 1.25, -1.2, 0.4, 2.6, -6, -5,
  -4, -3, -2, 2, 3, 4, 5, 6, 7,
];

const PROVERKA_CHISLA = 'Подставь это число в уравнение: левая и правая части не совпадут.';

const NET_LIN =
  'Корней нет, только когда $x$ исчезает и получается $0\\cdot x=b$ с $b\\ne0$. Здесь коэффициент при $x$ после переноса не равен нулю — корень один.';
const PROVERKA = 'Подставь это число в уравнение: левая и правая части не совпадут.';

/* ── Линейные ─────────────────────────────────────────────────── */

const LINEYNYE: ShablonProverki17[] = [
  {
    id: 'b17-l-odin',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [k1, m, n, p, x0] = poka(() => {
        if (nomer === 0) return [7, -4, 3, 10, 3.5] as const;
        const x = r.pick(KORNI_LIN);
        const d = r.int(2, 10) * r.pick([1, -1]);
        if (!Number.isInteger(okr(d * x))) return null;
        const nn = r.int(1, 6);
        const kk = nn + d;
        const mm = r.int(-9, 9);
        if (kk === 0 || kk === 1 || mm === 0) return null;
        return [kk, mm, nn, mm + okr(d * x), x] as const;
      });
      const d = k1 - n;
      const ur = `${lin(k1, m)}=${lin(n, p)}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(
              (p + m) / d,
              'Число, перенесённое в другую часть, меняет знак на противоположный. Проверь знак у числа из левой части.',
            ),
            lch(
              (p - m) / (k1 + n),
              'Слагаемое с $x$ из правой части при переносе влево тоже меняет знак.',
            ),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
            { tekst: NET, podskazka: NET_LIN },
          ],
          x0,
        ),
        razbor: [
          `Переносим $x$ влево, числа вправо, меняя знак: $${mn([[d, 'x']])}=${t(p - m)}$.`,
          `Коэффициент $${t(d)}\\ne0$ — случай 1, корень один: $x=\\dfrac{${t(p - m)}}{${t(d)}}=${t(x0)}$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-l-skobki',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [c, m, n, rr, x0] = poka(() => {
        if (nomer === 0) return [2, 3, 4, -9, 2.5] as const;
        const cc = r.int(2, 6);
        const mm = r.int(1, 9);
        const nn = r.int(1, 6);
        const x = r.pick(KORNI_LIN);
        const v = okr(cc * mm - (cc + nn) * x);
        if (!Number.isInteger(v) || v === 0) return null;
        return [cc, mm, nn, v, x] as const;
      });
      const ur = `${c}(${m}-x)=${lin(n, rr)}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            c === n
              ? null
              : lch(
                  (rr - c * m) / (c - n),
                  `Минус перед $x$ в скобке: $${c}\\cdot(-x)=-${c}x$, а не $+${c}x$.`,
                ),
            lch(
              (m - rr) / (c + n),
              `Множитель перед скобкой умножается на **каждое** слагаемое: $${c}\\cdot${m}=${c * m}$.`,
            ),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
            { tekst: NET, podskazka: NET_LIN },
          ],
          x0,
        ),
        razbor: [
          `Раскрываем скобки: $${lin(-c, c * m)}=${lin(n, rr)}$.`,
          `Переносим: $${mn([[-c - n, 'x']])}=${t(rr - c * m)}$, коэффициент не равен нулю. $x=\\dfrac{${t(rr - c * m)}}{${t(-c - n)}}=${t(x0)}$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-l-lyuboe',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const [k, m, n] = poka(() => {
        if (nomer === 0) return [4, -2, 1] as const;
        const kk = r.int(2, 9);
        const mm = r.pick(TSELYE);
        const nn = r.int(-5, 5);
        if (nn === 0 || kk + nn === 0) return null;
        return [kk, mm, nn] as const;
      });
      const ur = `${k}(${lin(1, m)})${n < 0 ? '-' : '+'}${Math.abs(n) === 1 ? '' : Math.abs(n)}x=${lin(k + n, k * m)}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(r, LYUBOE, [
          {
            tekst: NET,
            podskazka:
              'После упрощения получается $0\\cdot x=0$, а не $0\\cdot x=b$ с $b\\ne0$. Равенство $0=0$ верное.',
          },
          {
            tekst: '$0$',
            podskazka:
              '$x=0$ подходит, но не только он: подставь, например, $x=1$ — равенство тоже верное.',
          },
          lch(
            -m,
            'Это число подходит, но оно не единственное: подставь любое другое — равенство тоже выполнится.',
          ),
        ]),
        razbor: [
          `Раскрываем скобки: $${lin(k, k * m)}${n < 0 ? '-' : '+'}${Math.abs(n) === 1 ? '' : Math.abs(n)}x=${lin(k + n, k * m)}$.`,
          'Переносим: $0\\cdot x=0$ — случай 2. При любом $x$ слева и справа $0$: подходит любое число.',
        ],
      };
    },
  },
  {
    id: 'b17-l-net',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const [k, m, n, c] = poka(() => {
        if (nomer === 0) return [3, 2, -1, 1] as const;
        const kk = r.int(2, 9);
        const mm = r.pick(TSELYE);
        const nn = r.int(-5, 5);
        const cc = r.int(-20, 20);
        if (nn === 0 || kk + nn === 0 || cc === kk * mm) return null;
        return [kk, mm, nn, cc] as const;
      });
      const b = c - k * m;
      const ur = `${k}(${lin(1, m)})${n < 0 ? '-' : '+'}${Math.abs(n) === 1 ? '' : Math.abs(n)}x=${lin(k + n, c)}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(r, NET, [
          {
            tekst: LYUBOE,
            podskazka:
              'Любое число подходит, только если получилось $0\\cdot x=0$. Здесь после переноса справа не ноль.',
          },
          {
            tekst: '$0$',
            podskazka: `Подставь $x=0$: слева $${k * m}$, справа $${c}$ — не равны.`,
          },
          lch(
            b,
            `Получилось $0\\cdot x=${t(b)}$. Отсюда не следует $x=${t(b)}$: слева при любом $x$ стоит $0$.`,
          ),
        ]),
        razbor: [
          `Раскрываем скобки и переносим: $0\\cdot x=${t(b)}$ — случай 3.`,
          `Слева при любом $x$ стоит $0$, справа $${t(b)}\\ne0$. Корней нет.`,
        ],
      };
    },
  },
  {
    id: 'b17-l-lovushka',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const [k, p, m] = poka(() => {
        if (nomer === 0) return [6, 1, -1] as const;
        const kk = r.int(2, 9);
        const pp = r.int(-9, 9);
        const mm = r.pick(TSELYE);
        if (kk * mm === pp) return null;
        return [kk, pp, mm] as const;
      });
      const b = k * m - p;
      const ur = `${lin(k, p)}=${k}(${lin(1, m)})`;
      return {
        ur,
        vopros: 'koren',
        uslovie: `Ученик решал уравнение $${ur}$, получил $0\\cdot x=${t(b)}$ и записал ответ $x=0$. Какой ответ верный?`,
        varianty: varianty(r, NET, [
          {
            tekst: '$0$',
            podskazka: `Подставь $x=0$: слева $${t(p)}$, справа $${t(k * m)}$. Ноль — не корень: $0\\cdot x$ равно $0$, а не $${t(b)}$.`,
          },
          lch(
            b,
            `Из $0\\cdot x=${t(b)}$ нельзя получить $x=${t(b)}$: на ноль не делят, а слева при любом $x$ стоит $0$.`,
          ),
          {
            tekst: LYUBOE,
            podskazka:
              'Любое число подходит при $0\\cdot x=0$. Здесь справа не ноль — равенство не выполняется ни при каком $x$.',
          },
        ]),
        razbor: [
          `$0\\cdot x=${t(b)}$ — случай 3: слева всегда $0$, а $0\\ne${t(b)}$.`,
          'Корней нет. Записать $x=0$ — ошибка: подстановка $x=0$ равенства не даёт.',
        ],
      };
    },
  },
];

/* ── Квадратные ───────────────────────────────────────────────── */

const vopr = (r: Rng, nomer: number): 'menshiy' | 'bolshiy' =>
  nomer === 0 ? 'menshiy' : r.pick(['menshiy', 'bolshiy'] as const);
const vybrat = (v: VoprosTeorii, a: number, b: number): number =>
  v === 'bolshiy' ? Math.max(a, b) : Math.min(a, b);
const drugoy = (v: VoprosTeorii, a: number, b: number): number =>
  v === 'bolshiy' ? Math.min(a, b) : Math.max(a, b);
const slovo = (v: VoprosTeorii): string => (v === 'bolshiy' ? 'больший' : 'меньший');
const DRUGOY_KOREN = (v: VoprosTeorii): string =>
  `Это второй корень уравнения. В условии просят ${slovo(v)} — сравни корни на числовой прямой.`;

const KVADRATNYE: ShablonProverki17[] = [
  {
    id: 'b17-k-delenie',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, k] = poka(() => {
        if (nomer === 0) return [2, 4.5] as const;
        const aa = r.int(1, 5);
        const kk = r.pick(TSELYE) + r.pick([0, 0, 0.5]);
        if (kk === 0 || !Number.isInteger(okr(aa * kk))) return null;
        return [aa, kk] as const;
      });
      /* Ноль — меньший корень при k > 0 и больший при k < 0. */
      const v: VoprosTeorii = k > 0 ? 'menshiy' : 'bolshiy';
      const ur = `${mn([[a, 'x^2']])}=${mn([[okr(a * k), 'x']])}`;
      return {
        ur,
        vopros: v,
        uslovie: uslovie(ur, v),
        varianty: varianty(r, '$0$', [
          lch(
            k,
            'Похоже, обе части разделили на $x$ — так теряется корень $x=0$. Перенеси всё влево и вынеси $x$ за скобку.',
          ),
          lch(-k, 'Проверь знак второго корня: из $ax-b=0$ получается $x=\\dfrac{b}{a}$.'),
          {
            tekst: NET,
            podskazka: 'Корни есть: вынеси $x$ за скобку — произведение равно нулю, когда $x=0$.',
          },
        ]),
        razbor: [
          `Переносим всё влево и выносим $x$: $x(${lin(a, -okr(a * k))})=0$, то есть $x=0$ или $x=${t(k)}$.`,
          `${slovo(v) === 'больший' ? 'Больший' : 'Меньший'} из корней $0$ и $${t(k)}$ — это $0$. Делить на $x$ было нельзя: корень $0$ потерялся бы.`,
        ],
        znachenie: 0,
      };
    },
  },
  {
    id: 'b17-k-kvadrat',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, s] = poka(() => {
        if (nomer === 0) return [3, 5] as const;
        const aa = r.int(1, 5);
        const ss = r.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 0.5, 1.5, 2.5, 3.5]);
        if (!Number.isInteger(okr(aa * ss * ss))) return null;
        return [aa, ss] as const;
      });
      const v = vopr(r, nomer);
      const c = okr(a * s * s);
      const ur =
        nomer === 0 || r.int(0, 1) === 0 ? `${kv(a, 0, -c)}=0` : `${mn([[a, 'x^2']])}=${c}`;
      const otvet = v === 'bolshiy' ? s : -s;
      return {
        ur,
        vopros: v,
        uslovie: uslovie(ur, v),
        varianty: varianty(
          r,
          ch(otvet),
          [
            lch(
              -otvet,
              v === 'menshiy'
                ? 'У уравнения $x^2=k$ при $k>0$ два корня: $\\sqrt{k}$ и $-\\sqrt{k}$. Меньший — отрицательный.'
                : 'Больший из двух противоположных чисел — положительный.',
            ),
            lch(
              v === 'bolshiy' ? s * s : -s * s,
              'Ты нашёл $x^2$, а нужен $x$: извлеки квадратный корень.',
            ),
            {
              tekst: NET,
              podskazka: `Корней нет, только когда $x^2$ равен отрицательному числу. Здесь $x^2=${t(s * s)}>0$.`,
            },
          ],
          otvet,
        ),
        razbor: [
          `Переносим число вправо и делим на $${a}$: $x^2=${t(s * s)}$. Справа положительное число — корней два: $x=\\pm${t(s)}$.`,
          `${v === 'bolshiy' ? 'Больший' : 'Меньший'} корень — $${t(otvet)}$.`,
        ],
        znachenie: otvet,
      };
    },
  },
  {
    id: 'b17-k-nol',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, c] = poka(() => {
        if (nomer === 0) return [4, 7] as const;
        const aa = r.int(2, 9);
        const cc = r.pick(TSELYE);
        return [aa, cc] as const;
      });
      const ur = `${kv(a, 0, c)}=${c}`;
      return {
        ur,
        vopros: 'menshiy',
        uslovie: uslovie(ur, 'menshiy'),
        varianty: varianty(r, '$0$', [
          {
            tekst: NET,
            podskazka:
              'После переноса $ax^2=0$, то есть $x^2=0$. Квадрат равен нулю у числа $0$ — корень есть.',
          },
          {
            tekst: LYUBOE,
            podskazka: `Подставь $x=1$: слева $${a + c}$, справа $${c}$. Подходит только $x=0$.`,
          },
          lch(
            c,
            'Число без $x$ стоит в обеих частях — при переносе оно сокращается, и остаётся $ax^2=0$.',
          ),
        ]),
        razbor: [
          `Переносим $${c}$ влево: $${a}x^2=0$. Делим на $${a}\\ne0$: $x^2=0$.`,
          'Квадрат равен нулю только у нуля: корень один, $x=0$.',
        ],
        znachenie: 0,
      };
    },
  },
  {
    id: 'b17-k-dplus',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, x1, x2] = poka(() => {
        if (nomer === 0) return [2, -2, 1.5] as const;
        const aa = r.pick([1, 1, 2]);
        const p = r.pick(TSELYE);
        const q = r.pick(TSELYE) + (aa === 2 ? r.pick([0, 0.5]) : 0);
        if (p === q || p + q === 0) return null;
        return [aa, Math.min(p, q), Math.max(p, q)] as const;
      });
      const v = vopr(r, nomer);
      const b = okr(-a * (x1 + x2));
      const c = okr(a * x1 * x2);
      const D = okr(b * b - 4 * a * c);
      const sD = okr(Math.sqrt(D));
      const otvet = vybrat(v, x1, x2);
      const ur = `${kv(a, b, c)}=0`;
      const plohoy = v === 'bolshiy' ? Math.max(-x1, -x2) : Math.min(-x1, -x2);
      return {
        ur,
        vopros: v,
        uslovie: uslovie(ur, v),
        varianty: varianty(
          r,
          ch(otvet),
          [
            lch(drugoy(v, x1, x2), DRUGOY_KOREN(v)),
            lch(
              plohoy,
              'Похоже, ошибка в знаке $-b$: если $b<0$, то $-b>0$. Подставь ответ в уравнение.',
            ),
            lch(
              -b + (v === 'bolshiy' ? sD : -sD) / (2 * a),
              'На $2a$ делится **весь** числитель $-b\\pm\\sqrt{D}$, а не только $\\sqrt{D}$.',
            ),
            { tekst: NET, podskazka: `Посчитай дискриминант: $D=${t(D)}>0$ — корней два.` },
          ],
          otvet,
        ),
        razbor: [
          `$a=${t(a)}$, $b=${t(b)}$, $c=${t(c)}$; $D=${ts(b)}^2-4\\cdot${t(a)}\\cdot${ts(c)}=${t(D)}$, $\\sqrt{D}=${t(sD)}$.`,
          `$x_{1,2}=\\dfrac{${t(-b)}\\pm${t(sD)}}{${t(2 * a)}}$: $x_1=${t(x1)}$, $x_2=${t(x2)}$. ${v === 'bolshiy' ? 'Больший' : 'Меньший'} — $${t(otvet)}$.`,
        ],
        znachenie: otvet,
      };
    },
  },
  {
    id: 'b17-k-dnol',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, x0] = poka(() => {
        if (nomer === 0) return [1, 7] as const;
        const aa = r.pick([1, 1, 4]);
        const x = r.pick(TSELYE) + (aa === 4 ? r.pick([0, 0.5]) : 0);
        if (x === 0) return null;
        return [aa, x] as const;
      });
      const b = okr(-2 * a * x0);
      const c = okr(a * x0 * x0);
      const ur = `${kv(a, b, c)}=0`;
      return {
        ur,
        vopros: 'menshiy',
        uslovie: uslovie(ur, 'menshiy'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(-x0, 'Проверь знак: $x=-\\dfrac{b}{2a}$, и минус перед дробью меняет знак $b$.'),
            { tekst: NET, podskazka: 'При $D=0$ корень есть — один: $x=-\\dfrac{b}{2a}$.' },
            lch(2 * x0, 'Делить нужно на $2a$, а не на $a$.'),
          ],
          x0,
        ),
        razbor: [
          `$D=${ts(b)}^2-4\\cdot${t(a)}\\cdot${t(c)}=${t(b * b)}-${t(4 * a * c)}=0$ — корень один.`,
          `$x=-\\dfrac{b}{2a}=-\\dfrac{${t(b)}}{${t(2 * a)}}=${t(x0)}$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-k-dminus',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const [b, c] = poka(() => {
        if (nomer === 0) return [-6, 10] as const;
        const bb = r.int(-8, 8);
        const cc = r.int(1, 25);
        if (bb === 0 || bb * bb - 4 * cc >= 0) return null;
        return [bb, cc] as const;
      });
      const D = b * b - 4 * c;
      const ur = `${kv(1, b, c)}=0`;
      return {
        ur,
        vopros: 'menshiy',
        uslovie: uslovie(ur, 'menshiy'),
        varianty: varianty(r, NET, [
          lch(
            -b / 2,
            'Это $-\\dfrac{b}{2a}$ — корень бывает таким, только когда $D=0$. Посчитай $D$.',
          ),
          lch(
            -b,
            'Сумма корней равна $-b$ по Виете, только если корни есть. Начни с дискриминанта.',
          ),
          {
            tekst: LYUBOE,
            podskazka: `Подставь $x=0$: получится $${c}=0$ — неверно. Посчитай дискриминант.`,
          },
        ]),
        razbor: [
          `$D=${ts(b)}^2-4\\cdot1\\cdot${c}=${b * b}-${4 * c}=${D}<0$.`,
          'Из отрицательного числа квадратный корень не извлекается — корней нет.',
        ],
      };
    },
  },
  {
    id: 'b17-k-vieta',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [x1, x2] = poka(() => {
        if (nomer === 0) return [4, 5] as const;
        const p = r.pick(TSELYE);
        const q = r.pick(TSELYE);
        if (p === q || p + q === 0) return null;
        return [Math.min(p, q), Math.max(p, q)] as const;
      });
      const v: VoprosTeorii = nomer === 0 ? 'bolshiy' : vopr(r, nomer);
      const p = -(x1 + x2);
      const q = x1 * x2;
      const ur = `${kv(1, p, q)}=0`;
      const otvet = vybrat(v, x1, x2);
      return {
        ur,
        vopros: v,
        uslovie: `Подберите корни по теореме Виета. ${uslovie(ur, v)}`,
        varianty: varianty(
          r,
          ch(otvet),
          [
            lch(drugoy(v, x1, x2), DRUGOY_KOREN(v)),
            lch(-otvet, 'Сумма корней равна $-p$ — второму коэффициенту с обратным знаком.'),
            lch(-p, 'Это сумма корней $x_1+x_2=-p$, а нужен сам корень.'),
            lch(q, 'Это произведение корней $x_1\\cdot x_2=q$, а нужен сам корень.'),
          ],
          otvet,
        ),
        razbor: [
          `$x_1+x_2=${t(-p)}$, $x_1\\cdot x_2=${t(q)}$ — подходят $${t(x1)}$ и $${t(x2)}$.`,
          `Проверка: $${ts(x1)}+${ts(x2)}=${t(-p)}$, $${ts(x1)}\\cdot${ts(x2)}=${t(q)}$. ${v === 'bolshiy' ? 'Больший' : 'Меньший'} — $${t(otvet)}$.`,
        ],
        znachenie: otvet,
      };
    },
  },
  {
    id: 'b17-k-abc',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, x1, x2] = poka(() => {
        if (nomer === 0) return [4, 1, -0.75] as const;
        const aa = r.int(2, 8);
        const odin = r.pick([1, -1]);
        const vtoroy = r.int(-20, 20) / aa;
        if (!konechnoe(vtoroy) || vtoroy === 0 || Math.abs(vtoroy) === 1) return null;
        return [aa, odin, okr(vtoroy)] as const;
      });
      const v = vopr(r, nomer);
      const b = okr(-a * (x1 + x2));
      const c = okr(a * x1 * x2);
      const ur = `${kv(a, b, c)}=0`;
      const otvet = vybrat(v, x1, x2);
      const plyus = x1 === 1;
      return {
        ur,
        vopros: v,
        uslovie: uslovie(ur, v),
        varianty: varianty(
          r,
          ch(otvet),
          [
            lch(drugoy(v, x1, x2), DRUGOY_KOREN(v)),
            lch(
              -x2,
              plyus
                ? 'При $a+b+c=0$ второй корень $\\dfrac{c}{a}$ — со знаком $c$.'
                : 'При $a-b+c=0$ второй корень $-\\dfrac{c}{a}$ — проверь знак.',
            ),
            lch(-x1, `Подставь $x=${t(-x1)}$: получится $a${plyus ? '-' : '+'}b+c\\ne0$.`),
            lch(c, 'Произведение корней равно $\\dfrac{c}{a}$, а не $c$: раздели на $a$.'),
          ],
          otvet,
        ),
        razbor: [
          plyus
            ? `$a+b+c=${t(a)}${b < 0 ? '' : '+'}${t(b)}${c < 0 ? '' : '+'}${t(c)}=0$, значит $x_1=1$, $x_2=\\dfrac{c}{a}=${t(x2)}$.`
            : `$a-b+c=${t(a)}${-b < 0 ? '' : '+'}${t(-b)}${c < 0 ? '' : '+'}${t(c)}=0$, значит $x_1=-1$, $x_2=-\\dfrac{c}{a}=${t(x2)}$.`,
          `${v === 'bolshiy' ? 'Больший' : 'Меньший'} из корней $${t(x1)}$ и $${t(x2)}$ — $${t(otvet)}$.`,
        ],
        znachenie: otvet,
      };
    },
  },
];

/* ── Уравнение с корнем ───────────────────────────────────────── */

/** «kx» без единицы: 1 → «x», 3 → «3x». */
const kx = (k: number): string => (k === 1 ? 'x' : `${k}x`);

const KOREN: ShablonProverki17[] = [
  {
    id: 'b17-r-odin',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [k, m, c, x0] = poka(() => {
        if (nomer === 0) return [3, 10, 4, -2] as const;
        const kk = r.int(1, 7);
        const cc = r.int(2, 9);
        const x = r.pick(TSELYE);
        const mm = cc * cc + kk * x;
        if (mm <= 0 || mm > 99) return null;
        return [kk, mm, cc, x] as const;
      });
      const ur = `\\sqrt{${m}-${kx(k)}}=${c}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(
              (m - c) / k,
              `Возвести в квадрат нужно и правую часть: под корнем должно получиться $${c}^2=${c * c}$, а не $${c}$.`,
            ),
            lch(
              (m - 2 * c) / k,
              `Квадрат числа — не удвоение: $${c}^2=${c * c}$, а не $${2 * c}$.`,
            ),
            lch(-x0, `Проверь знак: перед $x$ стоит минус. ${PROVERKA}`),
            {
              tekst: NET,
              podskazka: `Корней нет, только когда справа отрицательное число. Здесь $${c}>0$ — возводим в квадрат.`,
            },
          ],
          x0,
        ),
        razbor: [
          `Справа $${c}\\ge0$ — случай 2, возводим в квадрат: $${m}-${kx(k)}=${c * c}$.`,
          `$${mn([[-k, 'x']])}=${t(c * c - m)}$, $x=${t(x0)}$. Проверка: под корнем $${m}-${k}\\cdot${ts(x0)}=${c * c}=${c}^2$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-r-drob',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, b, c, x0] = poka(() => {
        if (nomer === 0) return [4, 3, 5, 5.5] as const;
        const aa = r.pick([2, 4, 5, 8]);
        const cc = r.int(2, 9);
        const bb = r.int(-20, 20);
        const x = (cc * cc - bb) / aa;
        if (bb === 0 || Number.isInteger(x) || !konechnoe(x)) return null;
        return [aa, bb, cc, okr(x)] as const;
      });
      const ur = `\\sqrt{${lin(a, b)}}=${c}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(
              (c - b) / a,
              `Правую часть тоже возводят в квадрат: $${lin(a, b)}=${c * c}$, а не $${c}$.`,
            ),
            lch(
              (c * c + b) / a,
              'Число, перенесённое в другую часть, меняет знак на противоположный.',
            ),
            lch(a / (c * c - b), `Делят правую часть на $${a}$, а не $${a}$ на правую часть.`),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
          ],
          x0,
        ),
        razbor: [
          `Справа $${c}\\ge0$ — возводим в квадрат: $${lin(a, b)}=${c * c}$, $${a}x=${t(c * c - b)}$.`,
          `$x=\\dfrac{${t(c * c - b)}}{${a}}=${t(x0)}$ — в бланк пишем десятичную дробь.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-r-nol',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [k, m, x0] = poka(() => {
        if (nomer === 0) return [5, 10, 2] as const;
        const kk = r.int(2, 9);
        const x = r.pick(TSELYE) + r.pick([0, 0, 0.5]);
        const mm = okr(kk * x);
        if (!Number.isInteger(mm) || mm === 0) return null;
        return [kk, mm, x] as const;
      });
      const ur = `\\sqrt{${lin(k, -m)}}=0`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            {
              tekst: NET,
              podskazka:
                'Ноль не отрицателен — это случай $c\\ge0$. Корень равен нулю, когда под ним ноль.',
            },
            lch(m, `Получилось $${k}x=${m}$ — осталось разделить на $${k}$.`),
            lch(-x0, `Проверь знак: подставь число под корень — должен получиться $0$.`),
          ],
          x0,
        ),
        razbor: [
          `Справа $0$ — случай $c\\ge0$: $${lin(k, -m)}=0^2=0$.`,
          `$${k}x=${m}$, $x=${t(x0)}$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-r-net',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const [a, b, c, x1] = poka(() => {
        if (nomer === 0) return [2, 3, 5, 11] as const;
        const aa = r.int(1, 5);
        const cc = r.int(2, 9);
        const x = r.pick(TSELYE);
        const bb = cc * cc - aa * x;
        if (bb === 0 || Math.abs(bb) > 60) return null;
        return [aa, bb, cc, x] as const;
      });
      const ur = `\\sqrt{${lin(a, b)}}=-${c}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          NET,
          [
            lch(
              x1,
              `Это посторонний корень: подставь — слева $\\sqrt{${c * c}}=${c}$, а справа $-${c}$. Возводить в квадрат при отрицательной правой части нельзя.`,
            ),
            {
              tekst: '$0$',
              podskazka: `Корень не бывает отрицательным: слева число $\\ge0$ при любом $x$, справа $-${c}$.`,
            },
            {
              tekst: LYUBOE,
              podskazka: `Подставь любое число: слева неотрицательное число, справа $-${c}$ — равенства нет.`,
            },
          ],
          x1,
        ),
        razbor: [
          `Справа $-${c}<0$ — случай 1. Арифметический корень не бывает отрицательным.`,
          `Корней нет. Возведение в квадрат дало бы посторонний корень $x=${t(x1)}$.`,
        ],
      };
    },
  },
];

/* ── Показательные ────────────────────────────────────────────── */

/** Наибольший показатель степени основания, который встречается в №17. */
const STEPENI: Record<number, number> = { 2: 8, 3: 5, 5: 4, 7: 3 };
const OSNOVANIYA = [2, 3, 5, 7] as const;

/** Число a^k записью условия: целое, 1 или \frac{1}{a^{|k|}}. */
const stepenChislo = (a: number, k: number): string =>
  k >= 0 ? String(a ** k) : `\\frac{1}{${a ** -k}}`;
/** «x+3», «x-5». */
const xm = (m: number): string => lin(1, m);

const POKAZATELNYE: ShablonProverki17[] = [
  {
    id: 'b17-p-chislo',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, m, k] = poka(() => {
        if (nomer === 0) return [3, -1, -3] as const;
        const aa = r.pick(OSNOVANIYA);
        const kk = r.int(1, STEPENI[aa] ?? 3) * r.pick([1, -1]);
        const mm = r.int(-9, 9);
        if (mm === 0) return null;
        return [aa, mm, kk] as const;
      });
      const x0 = k - m;
      const N = stepenChislo(a, k);
      const ur = `${a}^{${xm(m)}}=${N}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            k < 0
              ? lch(
                  -k - m,
                  `Дробь $\\dfrac{1}{a^n}$ — степень с отрицательным показателем: $${N.replace('\\frac', '\\dfrac')}=${a}^{${k}}$.`,
                )
              : lch(-k - m, `Число $${N}$ — степень $${a}^{${k}}$ с положительным показателем.`),
            lch(k + m, 'Число из левой части переносят вправо с противоположным знаком.'),
            lch(
              a ** Math.abs(k) - m,
              `Справа число, а не показатель: сначала запиши его степенью числа $${a}$.`,
            ),
            {
              tekst: NET,
              podskazka:
                'Корней нет, только когда справа ноль или отрицательное число. Здесь справа положительное число.',
            },
          ],
          x0,
        ),
        razbor: [
          `$${N.replace('\\frac', '\\dfrac')}=${a}^{${k}}$, значит, $${xm(m)}=${k}$.`,
          `$x=${t(x0)}$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-p-drob-osn',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, m, k] = poka(() => {
        if (nomer === 0) return [2, 3, 4] as const;
        const aa = r.pick(OSNOVANIYA);
        const kk = r.int(1, STEPENI[aa] ?? 3);
        const mm = r.int(1, 15);
        if (mm === kk) return null;
        return [aa, mm, kk] as const;
      });
      const x0 = m - k;
      const ur = `\\left(\\frac{1}{${a}}\\right)^{x-${m}}=${a ** k}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(
              m + k,
              `Основание $\\dfrac{1}{${a}}$, а справа степень числа $${a}$: переверни основание, $\\left(\\dfrac{1}{${a}}\\right)^{t}=${a}^{-t}$.`,
            ),
            lch(-m - k, `Минус относится ко всему показателю: $-(x-${m})=-x+${m}$.`),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
            {
              tekst: NET,
              podskazka: 'Справа положительное число — корень есть.',
            },
          ],
          x0,
        ),
        razbor: [
          `$\\left(\\dfrac{1}{${a}}\\right)^{x-${m}}=${a}^{-(x-${m})}$, $${a ** k}=${a}^{${k}}$.`,
          `$-(x-${m})=${k}$, $-x+${m}=${k}$, $x=${t(x0)}$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-p-proizv',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, p, m, q, n, x0, K] = poka(() => {
        if (nomer === 0) return [2, 3, -1, -1, 4, -3, -3] as const;
        const aa = r.pick(OSNOVANIYA);
        const pp = r.int(-7, 7);
        const qq = r.int(-7, 7);
        const d = pp + qq;
        const mm = r.int(-12, 12);
        const nn = r.int(-12, 12);
        const x = r.pick(TSELYE);
        const kk = d * x + mm + nn;
        const L = STEPENI[aa] ?? 3;
        if (pp === 0 || qq === 0 || d === 0 || Math.abs(d) > 3 || mm === 0 || nn === 0) return null;
        if (Math.abs(kk) > L) return null;
        return [aa, pp, mm, qq, nn, x, kk] as const;
      });
      const d = p + q;
      const N = stepenChislo(a, K);
      const ur = `${a}^{${lin(p, m)}}\\cdot ${a}^{${lin(q, n)}}=${N}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            p === q
              ? null
              : lch(
                  (K - m + n) / (p - q),
                  'При умножении степеней с одинаковым основанием показатели складываются, а не вычитаются.',
                ),
            K === 0
              ? lch(-m - n, `$1=${a}^0$: показатель справа равен нулю.`)
              : lch(
                  (-K - m - n) / d,
                  `Проверь показатель справа: $${N.replace('\\frac', '\\dfrac')}=${a}^{${K}}$.`,
                ),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
          ],
          x0,
        ),
        razbor: [
          `Складываем показатели: $(${lin(p, m)})+(${lin(q, n)})=${lin(d, m + n)}$; справа $${a}^{${K}}$.`,
          `$${lin(d, m + n)}=${K}$, $x=${t(x0)}$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-p-net',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const [a, m, k, nol] = poka(() => {
        if (nomer === 0) return [5, -2, 2, false] as const;
        const aa = r.pick(OSNOVANIYA);
        const kk = r.int(1, STEPENI[aa] ?? 3);
        const mm = r.int(-9, 9);
        if (mm === 0 || kk === mm) return null;
        return [aa, mm, kk, r.int(0, 3) === 0] as const;
      });
      const prav = nol ? '0' : `-${a ** k}`;
      const ur = `${a}^{${xm(m)}}=${prav}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          NET,
          [
            nol
              ? lch(-m, `$${a}^0=1$, а не $0$. Степень положительного числа нулём не бывает.`)
              : lch(
                  k - m,
                  `$-${a ** k}$ — не степень числа $${a}$: это $-(${a}^{${k}})$. Степень положительного основания всегда положительна.`,
                ),
            {
              tekst: '$0$',
              podskazka: `Подставь $x=0$: слева $${a}^{${m}}>0$, справа $${prav}$.`,
            },
            {
              tekst: LYUBOE,
              podskazka: `Слева при любом $x$ положительное число, справа $${prav}$ — равенства нет ни при каком $x$.`,
            },
          ],
          nol ? -m : k - m,
        ),
        razbor: [
          `Степень $${a}^{t}$ положительна при любом $t$, а справа $${prav}${nol ? '' : '<0'}$.`,
          'Корней нет.',
        ],
      };
    },
  },
  {
    id: 'b17-p-mnozhitel',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, k, e] = poka(() => {
        if (nomer === 0) return [2, 7, 3] as const;
        const aa = r.pick(OSNOVANIYA);
        const kk = r.int(2, 9);
        const ee = r.int(1, (STEPENI[aa] ?? 3) - 1);
        if ((1 + kk) * aa ** ee > 1000) return null;
        return [aa, kk, ee] as const;
      });
      const N = (1 + k) * a ** e;
      const ur = `${a}^x+${k}\\cdot ${a}^x=${N}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(e),
          [
            lch(
              a ** e,
              `Это значение $${a}^x$, а нужен показатель: запиши $${a ** e}$ степенью числа $${a}$.`,
            ),
            lch(N / k, `$${a}^x=1\\cdot${a}^x$: в скобке $1+${k}=${1 + k}$, а не $${k}$.`),
            {
              tekst: NET,
              podskazka: 'Справа положительное число — корень есть. Вынеси $a^x$ за скобку.',
            },
          ],
          e,
        ),
        razbor: [
          `Выносим $${a}^x$: $${1 + k}\\cdot${a}^x=${N}$, $${a}^x=${a ** e}=${a}^{${e}}$.`,
          `$x=${e}$.`,
        ],
        znachenie: e,
      };
    },
  },
];

/* ── Логарифмические ──────────────────────────────────────────── */

/** «\log_{5}», «\lg». */
const logT = (a: number): string => (a === 10 ? '\\lg' : `\\log_{${a}}`);

const LOGARIFMY: ShablonProverki17[] = [
  {
    id: 'b17-g-opr',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, n, k, m, x0] = poka(() => {
        if (nomer === 0) return [5, 2, 2, -1, 13] as const;
        const aa = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const nn = aa === 10 ? 2 : r.int(1, aa <= 3 ? 4 : 2);
        const kk = r.int(1, 9);
        const x = r.pick(TSELYE);
        const mm = aa ** nn - kk * x;
        if (mm === 0 || Math.abs(mm) > 99 || aa * nn === aa ** nn) return null;
        return [aa, nn, kk, mm, x] as const;
      });
      const ur = `${logT(a)}(${lin(k, m)})=${n}`;
      const st = a ** n;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(
              (a * n - m) / k,
              `Число справа — показатель степени, а не множитель: $${a}^{${n}}=${st}$, а не $${a}\\cdot${n}$.`,
            ),
            lch((n - m) / k, `Логарифм не «снимают»: по определению $${lin(k, m)}=${a}^{${n}}$.`),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
            {
              tekst: NET,
              podskazka: `По определению $${lin(k, m)}=${a}^{${n}}>0$ — корень есть и сразу входит в ОДЗ.`,
            },
          ],
          x0,
        ),
        razbor: [
          `По определению логарифма: $${lin(k, m)}=${a}^{${n}}=${st}$.`,
          `$${kx(k)}=${t(st - m)}$, $x=${t(x0)}$. ОДЗ выполнена: $${st}>0$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-g-ravn',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, k, m, b, x0] = poka(() => {
        if (nomer === 0) return [3, 4, 5, 17, 3] as const;
        const aa = r.pick([2, 3, 5, 6, 7, 11, 13]);
        const kk = r.int(1, 7);
        const x = r.pick(TSELYE);
        const bb = r.int(1, 40);
        const mm = bb - kk * x;
        if (mm === 0 || bb === aa) return null;
        return [aa, kk, mm, bb, x] as const;
      });
      const ur = `\\log_{${a}}(${lin(k, m)})=\\log_{${a}}${b}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch((b + m) / k, 'Число, перенесённое в другую часть, меняет знак.'),
            k === 1 ? null : lch(b - m, `Осталось разделить обе части на $${k}$.`),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
            {
              tekst: NET,
              podskazka: `Проверь ОДЗ: при найденном $x$ под логарифмом $${b}>0$ — корень подходит.`,
            },
          ],
          x0,
        ),
        razbor: [
          `Логарифмы с одним основанием равны — равны выражения: $${lin(k, m)}=${b}$.`,
          `$x=${t(x0)}$; ОДЗ: $${b}>0$.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-g-odz',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const [a, p, m, q, n, x0, v] = poka(() => {
        if (nomer === 0) return [2, 3, 4, 1, -2, -3, -5] as const;
        const aa = r.pick([2, 3, 5, 7]);
        const pp = r.int(1, 5);
        const qq = r.int(1, 5);
        const x = r.pick(TSELYE);
        const vv = r.int(-15, 0);
        const mm = vv - pp * x;
        const nn = vv - qq * x;
        if (pp === qq || mm === 0 || nn === 0) return null;
        return [aa, pp, mm, qq, nn, x, vv] as const;
      });
      const ur = `\\log_{${a}}(${lin(p, m)})=\\log_{${a}}(${lin(q, n)})`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          NET,
          [
            lch(
              x0,
              `Подставь это число под логарифмы: получится $${v}$, а логарифм определён только для положительных чисел. Это посторонний корень.`,
            ),
            lch(-x0, `Приравняй выражения под логарифмами и проверь корень по ОДЗ.`),
            {
              tekst: LYUBOE,
              podskazka: `Выражения $${lin(p, m)}$ и $${lin(q, n)}$ равны только при одном $x$ — и он не входит в ОДЗ.`,
            },
          ],
          x0,
        ),
        razbor: [
          `$${lin(p, m)}=${lin(q, n)}$, $x=${t(x0)}$.`,
          `ОДЗ: под логарифмами $${t(v)}${v === 0 ? '' : '<0'}$ — логарифм не определён. Корней нет.`,
        ],
      };
    },
  },
  {
    id: 'b17-g-summa',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, m, k, w, summa] = poka(() => {
        if (nomer === 0) return [2, 3, 4, 5, true] as const;
        const aa = r.pick([2, 3, 5, 7]);
        const mm = r.int(1, 15);
        const kk = r.int(2, 6);
        const ww = r.int(1, 12);
        if (kk === aa) return null;
        return [aa, mm, kk, ww, r.int(0, 1) === 0] as const;
      });
      const lg = `\\log_{${a}}`;
      if (summa) {
        const M = k * w;
        const x0 = m + w;
        const ur = `${lg}(x-${m})+${lg}${k}=${lg}${M}`;
        return {
          ur,
          vopros: 'koren',
          uslovie: uslovie(ur, 'koren'),
          varianty: varianty(
            r,
            ch(x0),
            [
              lch(
                m + M - k,
                'Сумма логарифмов — логарифм произведения, а не разности: $\\log_a m+\\log_a n=\\log_a(mn)$.',
              ),
              lch(m + M * k, `Из $${k}(x-${m})=${M}$ делят на $${k}$, а не умножают.`),
              lch(w - m, `Из $x-${m}=${w}$ число $${m}$ переносят со знаком «плюс».`),
            ],
            x0,
          ),
          razbor: [
            `ОДЗ: $x-${m}>0$. Сумма — логарифм произведения: $${k}(x-${m})=${M}$.`,
            `$x-${m}=${w}$, $x=${x0}$; $${w}>0$ — входит в ОДЗ.`,
          ],
          znachenie: x0,
        };
      }
      const x0 = k * w - m;
      const ur = `${lg}(x+${m})-${lg}${k}=${lg}${w}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(
              w + k - m,
              'Разность логарифмов — логарифм частного: $\\log_a m-\\log_a n=\\log_a\\dfrac{m}{n}$.',
            ),
            lch(w / k - m, `Из $\\dfrac{x+${m}}{${k}}=${w}$ обе части умножают на $${k}$.`),
            lch(k * w + m, `Из $x+${m}=${k * w}$ число $${m}$ переносят со знаком «минус».`),
          ],
          x0,
        ),
        razbor: [
          `ОДЗ: $x+${m}>0$. Разность — логарифм частного: $\\dfrac{x+${m}}{${k}}=${w}$.`,
          `$x+${m}=${k * w}$, $x=${t(x0)}$; $${k * w}>0$ — входит в ОДЗ.`,
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-g-drob',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [p, q, k, m, x0] = poka(() => {
        if (nomer === 0) return [2, 5, 2, 1, 0.75] as const;
        const pp = r.pick([2, 4, 5, 8]);
        const qq = r.int(1, 19);
        const kk = r.pick([1, 2]);
        const mm = r.int(1, 15);
        const x = (qq / pp - mm) / kk;
        const nod = (u: number, w: number): number => (w === 0 ? u : nod(w, u % w));
        if (qq === pp || nod(pp, qq) !== 1 || !konechnoe(x)) return null;
        return [pp, qq, kk, mm, okr(x)] as const;
      });
      const ur = `\\log_{\\frac{${p}}{${q}}}(${lin(k, m)})=-1`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            lch(
              (p / q - m) / k,
              `Степень $-1$ переворачивает дробь: $\\left(\\dfrac{${p}}{${q}}\\right)^{-1}=\\dfrac{${q}}{${p}}$.`,
            ),
            lch(
              (-p / q - m) / k,
              'Степень $-1$ — не минус перед числом: она переворачивает дробь, а знак не меняет.',
            ),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
          ],
          x0,
        ),
        razbor: [
          `По определению: $${lin(k, m)}=\\left(\\dfrac{${p}}{${q}}\\right)^{-1}=\\dfrac{${q}}{${p}}=${t(q / p)}$.`,
          `$x=${t(x0)}$; ОДЗ: $${t(q / p)}>0$.`,
        ],
        znachenie: x0,
      };
    },
  },
];

/* ── Запись ответа ────────────────────────────────────────────── */

const nodT = (u: number, w: number): number => (w === 0 ? Math.abs(u) : nodT(w, u % w));
/** Обыкновенная дробь u/w сокращённой записью: «-\dfrac{3}{4}». */
function drobTex(u: number, w: number): string {
  const g = nodT(u, w);
  const [a, b] = [Math.abs(u) / g, Math.abs(w) / g];
  return `${u * w < 0 ? '-' : ''}\\dfrac{${a}}{${b}}`;
}

const OTVET: ShablonProverki17[] = [
  {
    id: 'b17-o-otric',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [x1, x2] = poka(() => {
        if (nomer === 0) return [-6, -2] as const;
        const u = r.int(-9, -1);
        const w = r.int(-9, -1);
        if (u === w) return null;
        return [Math.min(u, w), Math.max(u, w)] as const;
      });
      const v = vopr(r, nomer);
      const ur = `${kv(1, -(x1 + x2), x1 * x2)}=0`;
      const otvet = vybrat(v, x1, x2);
      return {
        ur,
        vopros: v,
        uslovie: uslovie(ur, v),
        varianty: varianty(
          r,
          ch(otvet),
          [
            lch(
              drugoy(v, x1, x2),
              `Среди отрицательных чисел ${v === 'menshiy' ? 'меньше' : 'больше'} то, что ${v === 'menshiy' ? 'левее' : 'правее'} на прямой: $${x1}<${x2}$, хотя $${-x1}>${-x2}$.`,
            ),
            lch(-otvet, 'Корни отрицательные — минус в ответе не теряем.'),
            lch(
              -drugoy(v, x1, x2),
              'Корни отрицательные: подставь это число — равенства не будет.',
            ),
          ],
          otvet,
        ),
        razbor: [
          `Корни: $${x1}$ и $${x2}$ (по Виете: сумма $${x1 + x2}$, произведение $${x1 * x2}$).`,
          `$${x1}<${x2}$: ${v === 'menshiy' ? 'меньший' : 'больший'} — $${t(otvet)}$.`,
        ],
        znachenie: otvet,
      };
    },
  },
  {
    id: 'b17-o-drob',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, b] = poka(() => {
        if (nomer === 0) return [4, -3] as const;
        const aa = r.pick([2, 4, 5, 8, 20, 25]);
        const bb = r.int(-30, 30);
        if (bb === 0 || nodT(aa, bb) !== 1 || Math.abs(bb) === 1) return null;
        return [aa, bb] as const;
      });
      const x0 = okr(b / a);
      const ur = `${a}x=${b}`;
      return {
        ur,
        vopros: 'koren',
        uslovie: uslovie(ur, 'koren'),
        varianty: varianty(
          r,
          ch(x0),
          [
            {
              tekst: `$${drobTex(b, a)}$`,
              podskazka:
                'Число верное, но в бланк пишут конечную десятичную дробь: переведи обыкновенную дробь.',
            },
            lch(
              a / b,
              `Делят правую часть на коэффициент: $x=\\dfrac{${b}}{${a}}$, а не наоборот.`,
            ),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
          ],
          x0,
        ),
        razbor: [`$x=\\dfrac{${b}}{${a}}=${drobTex(b, a)}$.`, `В десятичной записи: $x=${t(x0)}$.`],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-o-odin',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [k1, m, n, p, x0] = poka(() => {
        if (nomer === 0) return [5, 9, 2, -3, -4] as const;
        const x = r.pick(TSELYE);
        const d = r.int(2, 6) * r.pick([1, -1]);
        const nn = r.int(1, 6);
        const kk = nn + d;
        const mm = r.int(-9, 9);
        if (kk === 0 || kk === 1 || mm === 0) return null;
        return [kk, mm, nn, mm + d * x, x] as const;
      });
      const d = k1 - n;
      const ur = `${lin(k1, m)}=${lin(n, p)}`;
      return {
        ur,
        vopros: 'menshiy',
        uslovie: uslovie(ur, 'menshiy'),
        varianty: varianty(
          r,
          ch(x0),
          [
            {
              tekst: NET,
              podskazka:
                'Слова «если корней больше одного» — не повод писать «корней нет». Корень один — его и пишем.',
            },
            lch((p + m) / d, 'Число, перенесённое в другую часть, меняет знак на противоположный.'),
            lch(-x0, `Проверь знак ответа. ${PROVERKA}`),
          ],
          x0,
        ),
        razbor: [
          `$${mn([[d, 'x']])}=${t(p - m)}$, корень один: $x=${t(x0)}$.`,
          'Корень один — его и пишем, хотя в условии сказано про меньший.',
        ],
        znachenie: x0,
      };
    },
  },
  {
    id: 'b17-o-dvadrob',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [a, x1, rr] = poka(() => {
        if (nomer === 0) return [2, 1, -3] as const;
        const aa = r.pick([2, 4, 5]);
        const x = r.pick(TSELYE);
        const rv = r.int(-19, 19);
        if (rv % aa === 0 || nodT(aa, rv) !== 1) return null;
        if (Math.abs(a0(aa, x, rv).b) > 40 || Math.abs(x * rv) > 60) return null;
        return [aa, x, rv] as const;
      });
      const x2 = okr(rr / a);
      const { b, c } = a0(a, x1, rr);
      const ur = `${kv(a, b, c)}=0`;
      const v = vopr(r, nomer);
      const otvet = vybrat(v, x1, x2);
      const drobnyy = otvet === x2;
      return {
        ur,
        vopros: v,
        uslovie: uslovie(ur, v),
        varianty: varianty(
          r,
          ch(otvet),
          [
            drobnyy
              ? {
                  tekst: `$${drobTex(rr, a)}$`,
                  podskazka:
                    'Число верное, но в бланк пишут десятичную дробь: переведи обыкновенную дробь.',
                }
              : null,
            lch(drugoy(v, x1, x2), DRUGOY_KOREN(v)),
            lch(-otvet, `Проверь знак. ${PROVERKA}`),
          ],
          otvet,
        ),
        razbor: [
          `Корни: $${t(x1)}$ и $${drobTex(rr, a)}=${t(x2)}$.`,
          `${v === 'bolshiy' ? 'Больший' : 'Меньший'} — $${t(otvet)}$, в бланк — десятичной записью.`,
        ],
        znachenie: otvet,
      };
    },
  },
];

/** Коэффициенты $ax^2+bx+c$ с корнями $x_1$ и $\frac{r}{a}$: $(x-x_1)(ax-r)$. */
function a0(a: number, x1: number, r: number): { b: number; c: number } {
  return { b: -(a * x1 + r), c: x1 * r };
}

/** Наборы «Проверь себя» теории №17 по разделам. */
export const PROVERKA_17: Record<
  'lineynye' | 'kvadratnye' | 'koren' | 'pokazatelnye' | 'logarifmy' | 'otvet',
  ShablonProverki17[]
> = {
  lineynye: LINEYNYE,
  kvadratnye: KVADRATNYE,
  koren: KOREN,
  pokazatelnye: POKAZATELNYE,
  logarifmy: LOGARIFMY,
  otvet: OTVET,
};
