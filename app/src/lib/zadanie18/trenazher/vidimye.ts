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

const VIDIMYE: Readonly<Record<string, (p: Parametry) => Parametry>> = {
  /* cos C = 0,8 — угол C 37°: высоты почти сливаются со сторонами. Угол
     рисуется не острее 53°, треугольник остаётся остроугольным. */
  'vysoty-cos': (p) => ({ ...p, cosC: Math.min(p.cosC!, 0.6) }),
  /* AP = 2 при диагоналях до 8: подпись «2» не помещается. Отрезки
     диагоналей (и PC = BP·DP / AP) — не больше 2,5 : 1. */
  'vpis-hordy': (p) =>
    szhat(p, ['AB', 'AP', 'DP', 'BP'], OTR, (x) => [(x.BP! * x.DP!) / x.AP!]),
  /* AK = 3, BK = 10. */
  'vpis-pryam': (p) => szhat(p, ['AK', 'BK'], OTR),
  /* Части хорд 3 и 10: AP·PB = CP·PD сохраняется (сжатие степенью). */
  hordy: (p) => szhat(p, ['AP', 'PB', 'CP'], OTR, (x) => [(x.AP! * x.PB!) / x.CP!]),
  /* Части сторон 3 : 1 и 1 : 3 — малая часть в 6 мм. */
  'obshchiy-ugol': (p) => szhat(szhat(p, ['m', 'n'], 2), ['p', 'q'], 2),
  /* PA = 3 при PD = 12: секущие, BD — вместе (треугольник PBD тот же по типу). */
  'ok-sekushchie': (p) =>
    szhat(p, ['PA', 'PB', 'PC', 'BD'], OTR, (x) => [(x.PA! * x.PB!) / x.PC!]),
  /* KA : KB = 1 : 2 и AC = 3: хорда и отрезки — не больше 2,5 : 1. */
  'ks-vnutr-kasanie': (p) =>
    szhat(p, ['KA', 'KB', 'AC'], OTR, (x) => [x.AC! + (x.KB! * x.AC!) / x.KA!]),
  /* Основания 2 и 8: трапеция почти треугольник, диагонали сливаются. */
  'tp-babochka': (p) => szhat(p, ['BC', 'AD'], 2),
  /* Основания 20 и 5: AD = BC + (AD − BC), AB < AD − BC — сохраняются. */
  'tp-ugol-90': (p) => {
    const q = szhat({ BC: p.BC!, d: p.AD! - p.BC!, AB: p.AB! }, ['BC', 'd', 'AB'], 1.6);
    return { ...p, BC: q.BC!, AD: q.BC! + q.d!, AB: q.AB! };
  },
  /* BA₁ : A₁C = 1 : 4. */
  'ot-cheva': (p) => szhat(p, ['m', 'n'], 2),
  /* AB = 4, AC = 12 при угле 120°: угол C 14°. */
  'pl-bissektrisa': (p) => szhat(p, ['AB', 'AC'], 2),
  /* Диагонали 7 и 24 (основания 16 и 9): диагонали перпендикулярны, сумма
     оснований — гипотенуза по диагоналям; отношения сжаты отдельно. */
  'diag-trap': (p) => {
    const d = szhat(p, ['d1', 'd2'], 1.6);
    const ab = szhat(p, ['a', 'b'], 2);
    const s = Math.hypot(d.d1!, d.d2!) / (ab.a! + ab.b!);
    return { ...p, d1: d.d1!, d2: d.d2!, a: ab.a! * s, b: ab.b! * s };
  },
  /* Радиусы 25 и 4: маленькая окружность — точка. */
  'kas-ef': (p) => szhat(p, ['R1', 'R2'], RAD),
  /* Угол C = 150°: углы A и B по 15°. Тупой угол рисуется 130°, стороны
     у него — не больше 1,3 : 1. */
  kvadraty: (p) => ({ ...szhat(p, ['AC', 'BC'], 1.3), uC: 130 }),
  /* Радиус второй окружности в 4 раза больше. */
  'dve-okr': (p) => ({ ...p, k: Math.min(p.k!, 2.2) }),
  /* sin ∠AOC = √35/6: угол AOC 80°, лучи AP и AQ сливаются. */
  'cherez-centr': (p) => ({ ...p, d: Math.min(p.d!, 3) }),
  /* KC : CM = 2 : 1 — часть CM в 7 мм. */
  'vpis-klm': (p) => szhat(p, ['m', 'n'], 1.5),
  /* ∠B = 30°: перпендикуляры ME и KH у самой вершины. */
  'vys-perp': (p) => ({ ...p, B: vPredelah(p.B!, 48, 90) }),
  /* Радиусы 3 и 10. */
  vnevpis: (p) => szhat(p, ['r1', 'r2'], 2),
  /* ∠LMN = 150°: точка P у самой M. Тупой угол рисуется 130°. */
  'vpis-lmn': (p) => ({ ...p, uM: 130 }),
  /* M у самой вершины C (CM = 2 при стороне 5). */
  'kvadrat-per': (p) => ({ ...p, m: vPredelah(p.m!, 0.45 * p.s!, 0.55 * p.s!) }),
};

/** Параметры, по которым рисуется чертёж задачи типа tip. */
export function vidimye18(tip: string, p: Parametry): Parametry {
  return VIDIMYE[tip]?.(p) ?? p;
}

export const TIPY_S_VIDIMYMI_18: readonly string[] = Object.keys(VIDIMYE);
