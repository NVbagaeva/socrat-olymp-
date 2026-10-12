/**
 * Адреса листов: параметры ↔ строка запроса и задачи по адресу.
 *
 * Лист открывается в новой вкладке, и всё, что нужно для его сборки,
 * лежит в адресе: тот же адрес — тот же лист. Ответов в адресе нет:
 * их считает шаблон по seed.
 *
 * ДЗ:  src=nabor&nabor=dz9-novoe&z=1,2,5  — задачи готового набора;
 *      src=gen&plan=polnaya:2,bayes:1&seed=K3F9 — задачи генератора;
 *      d — дата ГГГГ-ММ-ДД, r — вид листа, t — тема.
 * Генератор (вкладка): формат sheetQuery — s, n, seed, t, c, k, d, v.
 */

import { planCounts, planOrder } from '../../sheetPlan';
import { dzIzGeneratora, generirovat, type PlanDz } from './generator';
import { najtiNabor } from './nabory';
import type { VidLista } from './list';
import { TIPY_5, type Tip5, type Zadacha5 } from './tipy';

export interface DzZapros {
  istochnik: 'nabor' | 'gen';
  nabor: string;
  /** Номера задач набора (с 1), по порядку набора. */
  zadachi: number[];
  plan: PlanDz;
  seed: string;
  /** ГГГГ-ММ-ДД или пусто. */
  date: string;
  vid: VidLista;
  theme: 'color' | 'print';
}

const VIDY: readonly VidLista[] = ['uchenik', 'otvety', 'resheniya', 'uchitel'];

export function dzQuery(z: DzZapros): string {
  const q = new URLSearchParams();
  q.set('src', z.istochnik);
  if (z.istochnik === 'nabor') {
    q.set('nabor', z.nabor);
    q.set('z', z.zadachi.join(','));
  } else {
    q.set(
      'plan',
      TIPY_5.filter((t) => (z.plan[t.id] ?? 0) > 0)
        .map((t) => `${t.id}:${z.plan[t.id]}`)
        .join(','),
    );
    q.set('seed', z.seed);
  }
  if (z.date !== '') q.set('d', z.date);
  q.set('r', z.vid);
  q.set('t', z.theme);
  return q.toString();
}

export function parseDzQuery(q: URLSearchParams): DzZapros {
  const plan: PlanDz = {};
  for (const kusok of (q.get('plan') ?? '').split(',')) {
    const [tip, n] = kusok.split(':');
    if (TIPY_5.some((t) => t.id === tip) && Number(n) > 0) {
      plan[tip as Tip5] = Math.min(10, Math.floor(Number(n)));
    }
  }
  const vid = q.get('r') as VidLista;
  return {
    istochnik: q.get('src') === 'gen' ? 'gen' : 'nabor',
    nabor: q.get('nabor') ?? '',
    zadachi: (q.get('z') ?? '')
      .split(',')
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0),
    plan,
    seed: q.get('seed') ?? 'dz',
    date: /^\d{4}-\d{2}-\d{2}$/.test(q.get('d') ?? '') ? (q.get('d') as string) : '',
    vid: VIDY.includes(vid) ? vid : 'uchenik',
    theme: q.get('t') === 'print' ? 'print' : 'color',
  };
}

/** Задачи ДЗ по адресу (или по состоянию экрана). */
export function dzZadachi(
  z: Pick<DzZapros, 'istochnik' | 'nabor' | 'zadachi' | 'plan' | 'seed'>,
): Zadacha5[] {
  if (z.istochnik === 'gen') {
    return dzIzGeneratora(z.plan, z.seed);
  }
  const nabor = najtiNabor(z.nabor);
  if (nabor === undefined) {
    return [];
  }
  return sZavisimymi(z.zadachi, nabor.svyazi)
    .filter((n) => n <= nabor.zadachi.length)
    .map((n) => nabor.zadachi[n - 1] as Zadacha5);
}

/**
 * Номера задач с теми, на которые они опираются: задача «в условиях
 * предыдущей задачи…» без своей предыдущей не решается, поэтому та
 * добавляется сама. По порядку набора, без повторов.
 */
export function sZavisimymi(nomera: readonly number[], svyazi: Record<number, number>): number[] {
  const out = new Set(nomera);
  for (const n of nomera) {
    let k = svyazi[n];
    while (k !== undefined && !out.has(k)) {
      out.add(k);
      k = svyazi[k];
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** «12.10.2026» из записи ГГГГ-ММ-ДД. */
export function dataTekst(date: string): string {
  const [y, m, d] = date.split('-');
  return date === '' ? '' : `${d}.${m}.${y}`;
}

/**
 * Задачи листа генератора: шаблоны поровну (lib/sheetPlan.ts),
 * порядок перемешан по seed. Следующие варианты — те же шаблоны на
 * тех же местах, другие числа и сюжеты.
 */
export function listShablonov(
  ids: readonly string[],
  count: number,
  seed: string,
  variants: number,
): Zadacha5[][] {
  const plan = planCounts(
    ids.map((id) => ({ id, capacity: 1000 })),
    count,
  );
  const poryadok = planOrder(plan.counts, seed);
  return Array.from({ length: Math.max(1, variants) }, (_, k) =>
    poryadok.map((id, i) => generirovat(id, k === 0 ? `${seed}:${i}` : `${seed}:v${k + 1}:${i}`)),
  );
}
