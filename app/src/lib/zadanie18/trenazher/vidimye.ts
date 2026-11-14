/**
 * Видимые параметры чертежей тренажёра №18 (lib/skhemy/vidimye.ts):
 * тип задачи → параметры, по которым рисуется сцена. Подписи на
 * чертеже — настоящие числа задачи (sceny.ts, sPodpisyamiIz).
 *
 * Здесь только типы, у которых числа задачи дают нечитаемый рисунок;
 * остальные рисуются по своим числам. Что сглажено и почему — у
 * каждой строки; пороги проверяет scripts/check-chertezhi-18.mjs.
 */

import { POROGI_CHERTEZHA as P, szhat, vPredelah } from '@/lib/skhemy/vidimye';
import type { Parametry } from './sceny';

/** Отношение подписанных отрезков, к которому сжимаем: с запасом до порога. */
const OTR = 2.5;
/** Отношение радиусов — порог (25 : 4 → 2,5 : 1). */
const RAD = P.otnoshenieRadiusov;

/** Видимые параметры типа — одни или кандидаты по порядку предпочтения. */
const VIDIMYE: Readonly<Record<string, (p: Parametry) => Parametry | readonly Parametry[]>> = {
  /* cos C = 0,8 — угол C 37°: высоты почти сливаются со сторонами. Угол
     рисуется не острее 53°, треугольник остаётся остроугольным. */
  'vysoty-cos': (p) => ({ ...p, cosC: Math.min(p.cosC!, 0.6) }),
  /* AP = 2 при PC = 8: подпись «2» не помещается. */
  'vpis-hordy': (p) => {
    /* Треугольник APB — как есть (его тупой угол при P — свойство задачи);
       сжимается коэффициент подобия k = DP : AP треугольников DPC и APB. */
    const k = p.DP! / p.AP!;
    return k <= 1.5 ? p : { ...p, DP: p.AP! * 1.5 };
  },
  /* AK = 3, BK = 10. */
  'vpis-pryam': (p) => szhat(p, ['AK', 'BK'], OTR),
  /* Части хорд 3 и 10: AP·PB = CP·PD сохраняется (сжатие степенью). */
  hordy: (p) => szhat(p, ['AP', 'PB', 'CP'], OTR, (x) => [(x.AP! * x.PB!) / x.CP!]),
  /* Части сторон 3 : 1 и 1 : 3 — малая часть в 6 мм. */
  'obshchiy-ugol': (p) => szhat(szhat(p, ['m', 'n'], 2), ['p', 'q'], 1.8),
  /* BL : LC = 3 : 1 — часть «y» в 7 мм: на чертеже L делит BC как 2,3 : 1. */
  'menelay-pl': (p) => ({ ...p, dolyaL: 0.7 }),
  /* AB = 4, AC = 12: треугольник — щель, чертёж теряется в кадре. */
  'bis-par': (p) => szhat(p, ['AB', 'AC'], OTR),
  /* PA = 3 при PD = 12: секущие, BD — вместе (треугольник PBD тот же по типу). */
  'ok-sekushchie': (p) => {
    /* Треугольник PAC — как есть (при PA = 3, PC = 4 он прямоугольный),
       сжимается коэффициент подобия k = PB : PC треугольников PDB и PAC:
       угол P, форма треугольников и PA·PB = PC·PD — те же. */
    const k = p.PB! / p.PC!;
    const ac = p.BD! / k;
    const dlina = (kk: number) => [p.PA!, p.PC!, kk * p.PC!, kk * ac];
    let kk = k;
    /* C между P и D — с зазором: PD не короче 1,35·PC. */
    while (
      kk > 1.05 &&
      kk * p.PA! > 1.35 * p.PC! &&
      Math.max(...dlina(kk)) / Math.min(...dlina(kk)) > 2.9
    )
      kk -= 0.05;
    return kk === k ? p : { ...p, PB: kk * p.PC!, BD: kk * ac };
  },
  /* KA : KB = 1 : 2 и AC = 3: хорда и отрезки — не больше 2,5 : 1. */
  'ks-vnutr-kasanie': (p) =>
    szhat(p, ['KA', 'KB', 'AC'], OTR, (x) => [x.AC! + (x.KB! * x.AC!) / x.KA!]),
  /* Основания 2 и 8: трапеция почти треугольник, диагонали сливаются. */
  'tp-babochka': (p) => szhat(p, ['BC', 'AD'], 2),
  /* Основания 20 и 5: AD = BC + (AD − BC), AB < AD − BC — сохраняются. */
  'tp-ugol-90': (p) => {
    const q = szhat({ BC: p.BC!, d: p.AD! - p.BC!, AB: p.AB! }, ['BC', 'd', 'AB'], 1.4);
    return { ...p, BC: q.BC!, AD: q.BC! + q.d!, AB: q.AB! };
  },
  /* BA₁ : A₁C = 1 : 4. */
  'ot-cheva': (p) => szhat(p, ['m', 'n'], 2),
  /* AB = 4, AC = 12 при угле 120°: угол C 14°. */
  'pl-bissektrisa': (p) => szhat(p, ['AB', 'AC'], 2),
  /* Диагонали 7 и 24 (основания 16 и 9): диагонали перпендикулярны, сумма
     оснований — гипотенуза по диагоналям; отношения сжаты отдельно. */
  'diag-trap': (p) => {
    /* Диагонали и основания сжимаются отдельно — так, чтобы порядок
       четырёх чисел остался тем же (больший отрезок длиннее). */
    const poryadok = (x: Parametry) => ['a', 'b', 'd1', 'd2'].sort((u, v) => x[u]! - x[v]!).join();
    for (const md of [2, 2.4, 2.8])
      for (const mab of [2, 1.7, 1.4, 1.2, 1.1]) {
        const d = szhat(p, ['d1', 'd2'], md);
        const ab = szhat(p, ['a', 'b'], mab);
        const s = Math.hypot(d.d1!, d.d2!) / (ab.a! + ab.b!);
        const x = { ...p, d1: d.d1!, d2: d.d2!, a: ab.a! * s, b: ab.b! * s };
        if (poryadok(x) === poryadok(p)) return x;
      }
    return p;
  },
  /* Радиусы 25 и 4: маленькая окружность — точка. */
  'kas-ef': (p) => szhat(p, ['R1', 'R2'], RAD),
  /* Угол C = 150°: углы A и B вместе — 30°; при AC : BC = 3 : 5 угол A —
     11°. Стороны при C — ближе к равным (меньшая остаётся меньшей), насколько
     позволяют тупые углы вспомогательных треугольников решения. Угол 150°
     подписан и нарисован как есть. */
  kvadraty: (p) => [1.01, 1.05, 1.1, 1.15, 1.2, 1.3].map((m) => szhat(p, ['AC', 'BC'], m)),
  /* Радиус второй окружности в 4 раза больше. */
  'dve-okr': (p) => ({ ...p, k: Math.min(p.k!, 2.2) }),
  /* sin ∠AOC = √35/6: угол AOC 80°, лучи AP и AQ сливаются. */
  'cherez-centr': (p) => ({ ...p, d: Math.min(p.d!, 3) }),
  /* KC : CM = 2 : 1 — часть CM в 7 мм. */
  /* Сцена подписывает части «2x», «3x» только при отношении малых целых:
     сжатое — тоже из малых целых (2 : 1 → 3 : 2). */
  'vpis-klm': (p) => {
    const r = Math.max(p.m!, p.n!) / Math.min(p.m!, p.n!);
    if (r <= 1.5) return p;
    /* Кандидаты — по порядку: первый, при котором треугольник того же типа. */
    return [
      [3, 2],
      [5, 3],
      [7, 4],
      [9, 5],
    ]
      .filter(([a, b]) => a! / b! < r)
      .map(([a, b]) => ({ ...p, m: p.m! > p.n! ? a! : b!, n: p.m! > p.n! ? b! : a! }));
  },
  /* ∠B = 30°: перпендикуляры ME и KH у самой вершины. */
  'vys-perp': (p) => ({ ...p, B: vPredelah(p.B!, 48, 90) }),
  /* Радиусы 3 и 10. */
  vnevpis: (p) => szhat(p, ['r1', 'r2'], 2),
  /* ∠LMN = 150°: точка P у самой M. Тупой угол рисуется 130°. */
  'vpis-lmn': (p) => ({ ...p, uM: 130 }),
  /* M у самой вершины C (CM = 2 при стороне 5). */
  'kvadrat-per': (p) => ({ ...p, m: vPredelah(p.m!, 0.45 * p.s!, 0.55 * p.s!) }),
};

/**
 * Параметры, по которым рисуется чертёж задачи типа tip: кандидаты по
 * порядку предпочтения (выбирает vidimyeSoSmyslom, lib/skhemy/vidimye.ts).
 */
export function vidimye18(tip: string, p: Parametry): Parametry | readonly Parametry[] {
  return VIDIMYE[tip]?.(p) ?? p;
}

export const TIPY_S_VIDIMYMI_18: readonly string[] = Object.keys(VIDIMYE);
