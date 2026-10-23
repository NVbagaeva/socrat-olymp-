/**
 * Решение задачи на проценты по образцу:
 *
 *   1. С чем сравниваем — что принимаем за 100 %;
 *   2. краткая запись (слева проценты, справа величина, неизвестное «?»);
 *   3. вместо «?» вводим x;
 *   4. пропорция (величины прямо или обратно пропорциональны);
 *   5. правило пропорции: крайние и средние, неизвестный член;
 *   6. считаем с умом: сначала сокращаем;
 *   7. ответ на вопрос задачи.
 *
 * Шаги 2–6 одинаковы для всех задач и строятся здесь по «звену» —
 * одной пропорции. Многошаговая задача — несколько звеньев: у каждого
 * своя запись и пропорция, правило пропорции — только у первого.
 * Шаги 1 и 7 пишет сам подтип: они зависят от сюжета.
 */

import { vopros as vybor } from '../kit';
import { d } from '../num';
import type { HintStep } from '../types';
import { type Blok, type Yach, type ZapisStroka, blokStroka } from './bloki';
import { type Sokrashchenie, sokratit } from './sokrashchenie';

/** Клетка звена: число или неизвестное. */
export type Kletka = number | null;

export interface Zveno {
  /**
   * Две строки краткой записи: [проценты, величина]. Ровно одна
   * клетка — null (неизвестное).
   */
  stroki: [[Kletka, Kletka], [Kletka, Kletka]];
  /** Единица правого столбца в скобках: «руб.»; без единицы — пусто. */
  ed?: string;
  /** Правый столбец — тоже проценты (скорость и время в процентах). */
  pravyyPct?: boolean;
  /** Подписи столбцов для пропорции: «проценты», «рубли». */
  podpisi: [string, string];
  /** Пояснения к строкам записи (мелко справа). */
  notes?: [string | undefined, string | undefined];
  /** Обратная пропорциональность (скорость и время). */
  obratnaya?: boolean;
  /** Буква неизвестного. */
  bukva?: 'x' | 'y';
  /** Строки перед краткой записью: «100 % − 13 % = 87 % — …». */
  prelyudiya?: string[];
  /** Почему величины пропорциональны — своими словами под сюжет. */
  pochemu?: string;
  /** Первое звено задачи: полные пояснения, правило, плашка. */
  pervoe?: boolean;
  /** Номер звена в заголовке шагов: «(шаг 1)». */
  nomer?: number;
}

export interface Reshenie {
  etapy: [string, string[]][];
  znachenie: number;
  sokr: Sokrashchenie;
  /** Члены пропорции TeX (a, b, c, d) и неизвестный. */
  chleny: [string, string, string, string];
  neizv: 'a' | 'b' | 'c' | 'd';
  /** Пара, которую перемножаем, и делитель: x = (para₁·para₂)/drugoy. */
  para: number[];
  drugoy: number;
}

const pctTex = (v: number) => `${d(v)}\\%`;

function yach(v: Kletka, levyy: boolean, bukva: '?' | 'x' | 'y', ed?: string): Yach {
  if (v === null) {
    return levyy
      ? { tex: '', neizv: bukva, pct: true }
      : { tex: '', neizv: bukva, ...(ed ? { ed } : {}) };
  }
  return levyy ? { tex: pctTex(v) } : { tex: d(v), ...(ed ? { ed } : {}) };
}

function zapis(z: Zveno, bukva: '?' | 'x' | 'y', zamena: boolean): Blok {
  const stroki: ZapisStroka[] = z.stroki.map(([l, r], i) => {
    const note = z.notes?.[i];
    return {
      l: yach(l, true, bukva),
      r: yach(r, z.pravyyPct === true, bukva, z.ed),
      ...(note ? { note } : {}),
    };
  });
  return zamena ? { vid: 'zapis', stroki, zamena: true } : { vid: 'zapis', stroki };
}

/** Член пропорции TeX: число или буква (в процентах — без знака %). */
const chlenTex = (v: Kletka, bukva: string) => (v === null ? bukva : d(v));

export function reshitZveno(z: Zveno): Reshenie {
  const x = z.bukva ?? 'x';
  const [[p1, v1], [p2, v2]] = z.stroki;
  // Прямая: p1/p2 = v1/v2; обратная: p1/p2 = v2/v1.
  const [a, b, c, dd] = z.obratnaya ? [p1, p2, v2, v1] : [p1, p2, v1, v2];
  const vals = [a, b, c, dd];
  const pos = vals.indexOf(null);
  if (pos < 0 || vals.filter((v) => v === null).length !== 1) {
    throw new Error('звено: нужно ровно одно неизвестное');
  }
  const neizv = (['a', 'b', 'c', 'd'] as const)[pos] as 'a' | 'b' | 'c' | 'd';
  const T = vals.map((v) => chlenTex(v, x)) as [string, string, string, string];
  const kraniy = neizv === 'a' || neizv === 'd';
  // Неизвестный крайний: (b·c)/(другой крайний); средний: (a·d)/(другой средний).
  const [para, drugoy] = kraniy
    ? [[b, c] as number[], (neizv === 'a' ? dd : a) as number]
    : [[a, dd] as number[], (neizv === 'b' ? c : b) as number];
  const paraTex = para.map(d).join('\\cdot');
  const ravenstvo = `${d(drugoy)}\\cdot ${x}=${paraTex}`;
  const vyrazhenie = `${x}=\\dfrac{${paraTex}}{${d(drugoy)}}`;
  const sokr = sokratit(para, drugoy, x);

  const nomer = z.nomer === undefined ? '' : ` (шаг ${z.nomer})`;
  const etapy: [string, string[]][] = [];

  // Краткая запись.
  etapy.push([
    `Краткая запись${nomer}`,
    [
      ...(z.pervoe
        ? [
            'Краткая запись помогает увидеть задачу целиком: слева — проценты, справа — то, что им соответствует. Когда она составлена правильно, дальше задача решается почти автоматически.',
          ]
        : []),
      ...(z.prelyudiya ?? []),
      blokStroka(zapis(z, '?', false)),
    ],
  ]);

  // Замена «?» на x.
  etapy.push([
    `Вместо «?» вводим $${x}$`,
    [
      z.pervoe
        ? `Для удобства вместо знака вопроса введём $${x}$ — так с неизвестным удобнее работать.`
        : `Неизвестное обозначим $${x}$.`,
      blokStroka(zapis(z, x, true)),
    ],
  ]);

  // Пропорция.
  const pochemu =
    z.pochemu ??
    (z.obratnaya
      ? 'Величины обратно пропорциональны: во сколько раз больше одна, во столько раз меньше другая. Поэтому отношение в одном столбце равно обратному отношению в другом — составляем пропорцию.'
      : 'Величины прямо пропорциональны: чем больше процентов, тем больше величина. Поэтому отношения в столбцах равны — составляем пропорцию.');
  etapy.push([
    'Составляем пропорцию',
    [
      pochemu,
      blokStroka({
        vid: 'proporciya',
        a: T[0],
        b: T[1],
        c: T[2],
        d: T[3],
        neizv,
        podpisi: z.obratnaya
          ? [`столбец «${z.podpisi[0]}»`, `столбец «${z.podpisi[1]}» — перевёрнут`]
          : [`столбец «${z.podpisi[0]}»`, `столбец «${z.podpisi[1]}»`],
      }),
    ],
  ]);

  // Правило пропорции: карточка — у первого звена; выкладка — всегда.
  const kr = `крайние — $${T[0]}$ и $${T[3]}$, средние — $${T[1]}$ и $${T[2]}$`;
  etapy.push([
    'Находим неизвестный член пропорции',
    [
      ...(z.pervoe
        ? [
            blokStroka({
              vid: 'pravilo',
              a: T[0],
              b: T[1],
              c: T[2],
              d: T[3],
              neizv,
              ravenstvo,
              vyrazhenie,
            }),
          ]
        : []),
      `${z.pervoe ? '' : `В пропорции ${kr}. `}Произведение крайних равно произведению средних:`,
      `$${ravenstvo}$, значит, $${vyrazhenie}$.`,
      `${kraniy ? 'Неизвестный крайний' : 'Неизвестный средний'} член — произведение ${kraniy ? 'средних' : 'крайних'}, делённое на ${kraniy ? 'известный крайний' : 'известный средний'}.`,
    ],
  ]);

  // Считаем с умом.
  const big = para.reduce((s, n) => s * n, 1);
  const plashka =
    big >= 10_000
      ? `**Не перемножай всё до конца!** $${paraTex}$ — большое число, а потом делить его на $${d(drugoy)}$ — долго. Сначала ищем, что можно сократить. Дело не в том, что мы не умеем считать столбиком: на экзамене дорого время, и тратить его стоит на решение, а не на лишние вычисления.`
      : '**Не перемножай сразу!** Сначала посмотри, что можно сократить: так считать быстрее и меньше ошибок — на экзамене дорого время.';
  etapy.push([
    sokr.sokratili ? 'Считаем с умом: сначала сокращаем' : 'Считаем: сократить нельзя, делим',
    [
      ...(z.pervoe ? [blokStroka({ vid: 'plashka', tekst: plashka })] : []),
      blokStroka({
        vid: 'sokr',
        shagi: sokr.shagi,
        chislitel: para,
        znamenatel: drugoy,
        itog: sokr.itog,
      }),
      ...(z.pervoe ? [blokStroka({ vid: 'priznaki' })] : []),
    ],
  ]);

  return { etapy, znachenie: sokr.itog, sokr, chleny: T, neizv, para, drugoy };
}

/* ── Подсказки тренажёра — тем же путём ───────────────────────── */

const zapisTekst = (rows: [string, string][]) => rows.map(([l, r]) => `${l} — ${r}`).join(';  ');

function kletkaT(v: Kletka, levyy: boolean, ed?: string): string {
  if (v === null) return levyy ? '$?\\,\\%$' : `$?$${ed ? ` ${ed}` : ''}`;
  return levyy ? `$${pctTex(v)}$` : `$${d(v)}$${ed ? ` ${ed}` : ''}`;
}

/** Подсказки по звену: запись, пропорция, крайние, сокращение. */
export function podskazkiZvena(z: Zveno, r: Reshenie): HintStep[] {
  const [[p1, v1], [p2, v2]] = z.stroki;
  const L = (v: Kletka) => kletkaT(v, true);
  const R = (v: Kletka) => kletkaT(v, z.pravyyPct === true, z.ed);
  const pravilno = zapisTekst([
    [L(p1), R(v1)],
    [L(p2), R(v2)],
  ]);
  const pereputano = zapisTekst([
    [L(p1), R(v2)],
    [L(p2), R(v1)],
  ]);
  const steps: HintStep[] = [];
  steps.push(vybor('Заполни краткую запись: что чему соответствует?', pravilno, [pereputano]));

  const [a, b, c, dd] = r.chleny;
  const prop = (p: string, q: string, s: string, t: string) =>
    `$\\dfrac{${p}}{${q}}=\\dfrac{${s}}{${t}}$`;
  steps.push(
    vybor('Какая пропорция верная?', prop(a, b, c, dd), [prop(a, b, dd, c), prop(a, dd, c, b)]),
  );
  steps.push(
    vybor(`Какие члены пропорции ${prop(a, b, c, dd)} крайние?`, `$${a}$ и $${dd}$`, [
      `$${b}$ и $${c}$`,
      `$${a}$ и $${b}$`,
    ]),
  );

  // Сократить: верное — первый делитель цепочки (или «нельзя»).
  const first = r.sokr.shagi.find((s) => s.na > 1)?.na;
  const mozhno = (g: number) =>
    r.drugoy % g === 0 && r.para.some((n) => Number.isInteger(n) && n % g === 0);
  const lishnie = [2, 3, 5, 7, 11, 13, 17, 19, 23]
    .filter((g) => !mozhno(g))
    .slice(0, 2)
    .map((g) => `на $${g}$`);
  steps.push(
    vybor(
      'С какого числа удобно начать сокращение?',
      first === undefined ? 'сократить нельзя' : `на $${d(first)}$`,
      first === undefined ? lishnie : [...lishnie, 'сократить нельзя'],
    ),
  );
  return steps;
}

/* ── Шаги 1 и 7 ───────────────────────────────────────────────── */

export const SHAG_100 = 'С чем сравниваем — что принимаем за $100\\%$';

/** Шаг 1: главный вопрос — что за 100 %; пояснение под сюжет. */
export function shag100(...poyasnenie: string[]): [string, string[]] {
  return [
    SHAG_100,
    [
      'Сначала решаем главный вопрос: что принимаем за $100\\%$. За $100\\%$ принимаем ту величину, с которой сравниваем, — то, что стоит после слова «чем» или «от».',
      ...poyasnenie,
      blokStroka({ vid: 'spravka100' }),
    ],
  ];
}

/** Краткая запись без неизвестного — для шагов-переходов (новые 100 %). */
export function zapisBezNeizvestnogo(stroki: [string, string, string?][]): string {
  return blokStroka({
    vid: 'zapis',
    stroki: stroki.map(([l, r, note]) => ({
      l: { tex: l },
      r: { tex: r },
      ...(note ? { note } : {}),
    })),
  });
}

/** Проверка: звено посчитало то же, что формула подтипа. */
export function sverit(r: Reshenie, want: number, gde: string): void {
  if (Math.abs(r.znachenie - want) > 1e-9 * Math.max(1, Math.abs(want))) {
    throw new Error(`${gde}: пропорция дала ${r.znachenie}, а нужно ${want}`);
  }
}
