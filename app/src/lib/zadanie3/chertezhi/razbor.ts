/**
 * Разбор условия задачи №3 на многогранники — первая, автоматическая
 * половина сценария чертежа.
 *
 * Из текста условия достаётся:
 *   — тело: куб, прямоугольный параллелепипед, правильная или прямая
 *     призма, правильная или произвольная пирамида, тетраэдр,
 *     многогранник «на рисунке» с прямыми двугранными углами;
 *   — имена вершин («ABCDA₁B₁C₁D₁», «SABCD»);
 *   — данные: длины названных отрезков, ребро, сторона основания,
 *     высота, площадь основания, объём, катеты, отношение отрезков;
 *   — названные точки («O — центр основания», «E — середина SB»);
 *   — что ищут: отрезок, угол между прямыми, сечение через три
 *     точки, многогранник с перечисленными вершинами.
 *
 * Размеры тела подбираются по данным: неизвестные измерения (ребро,
 * высота…) решают систему «длины и площади на чертеже равны данным»
 * (см. podbor.ts). Что не удалось понять однозначно, попадает
 * в `somneniya` — оттуда собирается список «на проверку».
 */

export type VidTela =
  | 'kub'
  | 'parallelepiped'
  | 'prizma'
  | 'pryamaya-prizma'
  | 'piramida'
  | 'piramida-proizv'
  | 'tetraedr'
  | 'sostavnoy';

/**
 * Величина из условия. Имя «@» — вершина пирамиды, когда условие
 * говорит «боковое ребро» без имени: её имя знает только сборщик.
 */
export type Mera =
  | { dlina: readonly [string, string] }
  | { otnoshenie: readonly [readonly [string, string], readonly [string, string]] }
  | { ploshchadOsnovaniya: true }
  | { obem: true }
  /** Высота пирамиды или призмы. */
  | { vysota: true };

export interface DannoeUsloviya {
  mera: Mera;
  znachenie: number;
  /** Запись числа в TeX, как в условии: «7», «2{,}5», «\\sqrt{12}». */
  tex: string;
  /** Подписывать ли на чертеже (длины — да, площадь и объём — нет). */
  podpisat: boolean;
}

export type Iskomoe =
  | { otrezok: readonly [string, string] }
  | { vysota: true }
  | { ugolMezhdu: readonly [readonly [string, string], readonly [string, string]] }
  | { sechenie: readonly string[] }
  | { mnogogrannik: readonly string[] };

export interface TochkaUsloviya {
  imya: string;
  gde: { centrOsnovaniya: true } | { seredina: readonly [string, string] };
}

export interface Razbor {
  telo: VidTela | null;
  /** Число сторон основания (призма, пирамида). */
  n: number | null;
  pravilnoe: boolean;
  /** Имена вершин в порядке сборщика; null — условие их не называет. */
  imena: string[] | null;
  dannye: DannoeUsloviya[];
  tochki: TochkaUsloviya[];
  iskomoe: Iskomoe[];
  /** Основание прямой призмы — прямоугольный треугольник с катетами. */
  katety: readonly [number, number] | null;
  /** Все рёбра равны данному числу. */
  vseRebra: number | null;
  somneniya: string[];
}

/** Текст условия без TeX-обёрток: «$A_1$» → «A1», «₁» → «1», «\\sqrt{12}» → «√12». */
export function normalizovat(text: string): string {
  return text
    .replace(/\$/g, '')
    .replace(/₁/g, '1')
    .replace(/_\{(\d+)\}/g, '$1')
    .replace(/_(\d)/g, '$1')
    .replace(/\\sqrt\{(\d+)\}/g, '√$1')
    .replace(/\{,\}/g, ',')
    .replace(/\\,/g, ' ')
    .replace(/\s+/g, ' ');
}

const IMYA = '[A-Z]1?';
const OTREZOK = `(${IMYA})(${IMYA})`;

/** «7», «2,5», «√12», «35√2» → значение и TeX. */
export function chislo(s: string): { znachenie: number; tex: string } | null {
  const m = /^(\d+(?:,\d+)?)?(?:√(\d+))?$/.exec(s.trim());
  if (m === null || (m[1] === undefined && m[2] === undefined)) return null;
  const k = m[1] === undefined ? 1 : Number(m[1].replace(',', '.'));
  const r = m[2] === undefined ? 1 : Math.sqrt(Number(m[2]));
  const kTex = m[1] === undefined ? '' : m[1].replace(',', '{,}');
  const tex = `${kTex}${m[2] === undefined ? '' : `\\sqrt{${m[2]}}`}`;
  return { znachenie: k * r, tex };
}

const CHISLO = '(\\d+(?:,\\d+)?(?:√\\d+)?|√\\d+)';

const N_SLOVA: Record<string, number> = { тре: 3, четырёх: 4, четырех: 4, шести: 6 };

function telo(t: string): Pick<Razbor, 'telo' | 'n' | 'pravilnoe'> & { somnenie?: string } {
  const lower = t.toLowerCase();
  const nIz = (re: RegExp) => {
    const m = re.exec(lower);
    return m ? (N_SLOVA[m[1] as string] ?? null) : null;
  };
  if (
    /изображ[её]нного на рисунке|изображ[её]н на рисунке/.test(lower) &&
    /двугранные углы/.test(lower)
  ) {
    return { telo: 'sostavnoy', n: null, pravilnoe: false };
  }
  if (/тетраэдр/.test(lower) && !/призм|параллелепипед|куб/.test(lower)) {
    return { telo: 'tetraedr', n: 3, pravilnoe: true };
  }
  if (/пирамид/.test(lower) && !/призм|параллелепипед|куб/.test(lower)) {
    const n = nIz(/(тре|четырёх|четырех|шести)угольн\S* пирамид/);
    if (/правильн\S* (тре|четырёх|четырех|шести)угольн\S* пирамид/.test(lower)) {
      return { telo: 'piramida', n, pravilnoe: true };
    }
    return {
      telo: 'piramida-proizv',
      n: n ?? 3,
      pravilnoe: false,
      somnenie:
        'пирамида не правильная: форма основания и положение вершины не заданы, нарисован произвольный вид',
    };
  }
  if (/куб/.test(lower) && !/параллелепипед/.test(lower)) {
    return { telo: 'kub', n: 4, pravilnoe: true };
  }
  if (/параллелепипед/.test(lower)) {
    return { telo: 'parallelepiped', n: 4, pravilnoe: false };
  }
  if (/призм/.test(lower)) {
    const n = nIz(/(тре|четырёх|четырех|шести)угольн\S* призм/);
    if (/правильн\S* (тре|четырёх|четырех|шести)угольн\S* призм/.test(lower)) {
      return { telo: 'prizma', n, pravilnoe: true };
    }
    if (/прямоугольный треугольник/.test(lower)) {
      return { telo: 'pryamaya-prizma', n: 3, pravilnoe: false };
    }
    return {
      telo: 'pryamaya-prizma',
      n: n ?? 3,
      pravilnoe: false,
      somnenie:
        'призма не правильная и основание не задано: нарисована прямая призма с произвольным треугольником',
    };
  }
  return { telo: null, n: null, pravilnoe: false, somnenie: 'тело не распознано' };
}

/** Имена вершин из записи «ABCDA1B1C1D1» / «SABCD» в порядке сборщика. */
function imena(
  t: string,
  r: Pick<Razbor, 'telo' | 'n'>,
): { imena: string[] | null; somnenie?: string } {
  const runs = t.match(/\b(?:[A-Z]1?){4,}\b/g) ?? [];
  const run = runs.sort((a, b) => b.length - a.length)[0];
  if (run === undefined) return { imena: null };
  const bukvy = run.match(/[A-Z]1?/g) ?? [];
  const n = r.n ?? 0;
  if (r.telo === 'piramida' || r.telo === 'piramida-proizv' || r.telo === 'tetraedr') {
    if (bukvy.length !== n + 1)
      return { imena: null, somnenie: `имена «${run}» не подходят к пирамиде` };
    // «SABCD» — вершина первой; в сборщике она последняя.
    return { imena: [...bukvy.slice(1), bukvy[0] as string] };
  }
  if (bukvy.length !== 2 * n) return { imena: null, somnenie: `имена «${run}» не подходят к телу` };
  const niz = bukvy.slice(0, n);
  const verh = bukvy.slice(n);
  if (!verh.every((v, i) => v === `${niz[i]}1`)) {
    return { imena: null, somnenie: `верхнее основание «${run}» названо не по правилу: к букве нижней вершины дописывается индекс 1` };
  }
  return { imena: bukvy };
}

function spisokImen(s: string): string[] {
  return s.match(/[A-Z]1?/g) ?? [];
}

export function razobrat(uslovie: string): Razbor {
  const t = normalizovat(uslovie);
  const somneniya: string[] = [];
  const tl = telo(t);
  if (tl.somnenie) somneniya.push(tl.somnenie);
  const im = imena(t, tl);
  if (im.somnenie) somneniya.push(im.somnenie);
  const r: Razbor = {
    telo: tl.telo,
    n: tl.n,
    pravilnoe: tl.pravilnoe,
    imena: im.imena,
    dannye: [],
    tochki: [],
    iskomoe: [],
    katety: null,
    vseRebra: null,
    somneniya,
  };
  const dannoe = (mera: Mera, s: string, podpisat = true) => {
    const c = chislo(s);
    if (c) r.dannye.push({ mera, ...c, podpisat });
  };

  // Отношение «BD1=2AD».
  const zanyato: [number, number][] = [];
  for (const m of t.matchAll(
    new RegExp(`\\b${OTREZOK}\\s*=\\s*(\\d+(?:,\\d+)?)\\s*${OTREZOK}\\b`, 'g'),
  )) {
    r.dannye.push({
      mera: {
        otnoshenie: [
          [m[1] as string, m[2] as string],
          [m[4] as string, m[5] as string],
        ],
      },
      znachenie: Number((m[3] as string).replace(',', '.')),
      tex: (m[3] as string).replace(',', '{,}'),
      podpisat: false,
    });
    zanyato.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  // Длины «AB=7», «SC равно 37», «боковое ребро SC равно 37».
  for (const m of t.matchAll(new RegExp(`\\b${OTREZOK}\\s*(?:=|равн[аоы])\\s*${CHISLO}`, 'g'))) {
    const at = m.index ?? 0;
    if (zanyato.some(([a, b]) => at >= a && at < b)) continue;
    dannoe({ dlina: [m[1] as string, m[2] as string] }, m[3] as string);
  }
  // Словами.
  const slovami: [RegExp, Mera, boolean][] = [
    [new RegExp(`площадь основания[^.]*?равна ${CHISLO}`), { ploshchadOsnovaniya: true }, false],
    [new RegExp(`(?:^|[^и] )высота(?: пирамиды)? равна ${CHISLO}`), { vysota: true }, true],
    [
      new RegExp(
        `[оО]б[ъь][её]м (?:куба|пирамиды|призмы|[а-я ]*?пирамиды [A-Z1]+|[а-я ]*?призмы|[а-я ]*?параллелепипеда)? ?равен ${CHISLO}`,
      ),
      { obem: true },
      false,
    ],
    [new RegExp(`которой равен ${CHISLO}`), { obem: true }, false],
  ];
  for (const [re, mera, podpisat] of slovami) {
    const m = re.exec(t);
    if (m) dannoe(mera, m[1] as string, podpisat);
  }
  // Ребро, сторона основания, боковое ребро без имени — на типичное ребро.
  const bokovoe = new RegExp(`боковое ребро(?: призмы)? равно ${CHISLO}`).exec(t);
  if (bokovoe && !new RegExp(`боковое ребро ${OTREZOK}`).test(t)) {
    dannoe(
      { dlina: r.telo === 'piramida' || r.telo === 'piramida-proizv' ? ['B', '@'] : ['A', 'A1'] },
      bokovoe[1] as string,
    );
  }
  const storona = new RegExp(`сторона основания(?: равна)? ${CHISLO}`).exec(t);
  if (storona) dannoe({ dlina: ['A', 'B'] }, storona[1] as string);
  const vse = new RegExp(`все р[её]бра[^,.]*? равны ${CHISLO}`).exec(t);
  if (vse) {
    const c = chislo(vse[1] as string);
    if (c) {
      r.vseRebra = c.znachenie;
      dannoe({ dlina: ['A', 'B'] }, vse[1] as string);
      // Боковое ребро тоже равно этому числу; подпись одна — на AB.
      const piramida = r.telo === 'piramida' || r.telo === 'piramida-proizv';
      dannoe({ dlina: piramida ? ['B', '@'] : ['A', 'A1'] }, vse[1] as string, false);
    }
  }
  const diagKuba = new RegExp(`[Дд]иагональ куба равна ${CHISLO}`).exec(t);
  if (diagKuba) dannoe({ dlina: ['A', 'C1'] }, diagKuba[1] as string);
  const kat = new RegExp(`катетами ${CHISLO} и ${CHISLO}`).exec(t);
  if (kat) {
    const [a, b] = [chislo(kat[1] as string), chislo(kat[2] as string)];
    if (a && b) {
      r.katety = [a.znachenie, b.znachenie];
      r.dannye.push({ mera: { dlina: ['C', 'A'] }, ...a, podpisat: true });
      r.dannye.push({ mera: { dlina: ['C', 'B'] }, ...b, podpisat: true });
    }
  }

  // Названные точки.
  for (const m of t.matchAll(/(?:точка|Точка) ([A-Z]1?) — центр основания/g)) {
    r.tochki.push({ imya: m[1] as string, gde: { centrOsnovaniya: true } });
  }
  for (const m of t.matchAll(
    new RegExp(`(?:точка|Точка) (${IMYA}) — середина ребра ${OTREZOK}`, 'g'),
  )) {
    r.tochki.push({ imya: m[1] as string, gde: { seredina: [m[2] as string, m[3] as string] } });
  }

  // Что ищут.
  const ugol = new RegExp(
    `(?:угол|угла) между (?:прямыми|диагоналями) ${OTREZOK} и ${OTREZOK}`,
  ).exec(t);
  if (ugol) {
    r.iskomoe.push({
      ugolMezhdu: [
        [ugol[1] as string, ugol[2] as string],
        [ugol[3] as string, ugol[4] as string],
      ],
    });
  }
  const dlina = new RegExp(`[Нн]айдите (?:длину )?(?:диагонали|отрезка) ${OTREZOK}`).exec(t);
  if (dlina) r.iskomoe.push({ otrezok: [dlina[1] as string, dlina[2] as string] });
  if (/найдите высоту пирамиды/i.test(t)) r.iskomoe.push({ vysota: true });
  const sech = new RegExp(
    `(?:сечени[яе][^.]*?через|проходящей через) (?:точки|вершины) (${IMYA}), (${IMYA}),? и (${IMYA})`,
  ).exec(t);
  if (sech) r.iskomoe.push({ sechenie: [sech[1] as string, sech[2] as string, sech[3] as string] });
  const mn =
    /вершинами которого являются (?:вершины |точки )?([A-Z1, ]+?)(?: правильной| прямоугольного|\.|$)/.exec(
      t,
    );
  if (mn) r.iskomoe.push({ mnogogrannik: spisokImen(mn[1] as string) });

  // Сверка имён: всё названное должно быть вершиной или точкой.
  const izvestno = new Set([...(r.imena ?? []), ...r.tochki.map((x) => x.imya)]);
  const upom: string[] = [];
  for (const d of r.dannye) {
    if ('dlina' in d.mera) upom.push(...d.mera.dlina);
    if ('otnoshenie' in d.mera) upom.push(...d.mera.otnoshenie.flat());
  }
  for (const i of r.iskomoe) {
    if ('otrezok' in i) upom.push(...i.otrezok);
    if ('ugolMezhdu' in i) upom.push(...i.ugolMezhdu.flat());
    if ('sechenie' in i) upom.push(...i.sechenie);
    if ('mnogogrannik' in i) upom.push(...i.mnogogrannik);
  }
  const chuzhie = upom.filter((x) => x !== '@' && r.imena !== null && !izvestno.has(x));
  if (chuzhie.length > 0)
    somneniya.push(`в условии названы точки не тела: ${[...new Set(chuzhie)].join(', ')}`);
  return r;
}
