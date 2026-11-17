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

/** Наборы «Проверь себя» теории №17 по разделам. */
export const PROVERKA_17: Record<'lineynye' | 'kvadratnye', ShablonProverki17[]> = {
  lineynye: LINEYNYE,
  kvadratnye: KVADRATNYE,
};
