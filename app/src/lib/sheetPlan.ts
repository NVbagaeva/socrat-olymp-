/**
 * План листа генератора: сколько задач какому методу и в каком порядке.
 *
 * Общий для экрана генератора (предупреждение о нехватке задач) и для
 * страниц печати №12, №4, №5 (сам лист): экран и лист считают одно и
 * то же, поэтому учитель видит ровно то, что будет напечатано. Модуль
 * без движка и банка — только числа.
 */

import { seeded } from './zadanie3/podhod';

/** Метод листа: навык №12 или прототип №4/№5. */
export interface PlanMethod {
  id: string;
  /** Сколько разных задач у метода в банке. */
  capacity: number;
}

/** Метод, у которого задач меньше его доли. */
export interface PlanShortage {
  id: string;
  /** Доля поровну. */
  want: number;
  /** Сколько есть в банке. */
  have: number;
}

export interface Plan {
  /** Сколько задач у каждого метода — в порядке выбора методов. */
  counts: { id: string; count: number }[];
  /** Методы, где не хватило задач: их недостача отдана другим. */
  shortages: PlanShortage[];
  /**
   * Сколько задач не поместилось ни в один метод: банк кончился
   * у всех. Такие задачи всё равно раздаются по кругу — у №12 движок
   * даёт ту же задачу с другими числами, у №4/№5 их просто не будет.
   */
  overflow: number;
}

/**
 * Поровну: K задач на M методов — по K/M, остаток по одному по кругу
 * в порядке выбора (10 на 3 = 4+3+3). Методу, у которого в банке
 * меньше его доли, достаётся сколько есть, а недостача тем же кругом
 * уходит методам, у которых задачи ещё остались.
 */
export function planCounts(methods: readonly PlanMethod[], total: number): Plan {
  const m = methods.length;
  if (m === 0 || total <= 0) {
    return {
      counts: methods.map((item) => ({ id: item.id, count: 0 })),
      shortages: [],
      overflow: 0,
    };
  }
  const base = Math.floor(total / m);
  const rest = total - base * m;
  const want = methods.map((_, i) => base + (i < rest ? 1 : 0));
  const counts = methods.map((item, i) => Math.min(want[i] ?? 0, item.capacity));
  const shortages = methods
    .map((item, i) => ({ id: item.id, want: want[i] ?? 0, have: item.capacity }))
    .filter((item) => item.have < item.want);

  /* Недостачу — по одному по кругу тем, у кого ещё есть задачи. */
  let left = total - counts.reduce((sum, n) => sum + n, 0);
  let i = 0;
  let idle = 0;
  while (left > 0 && idle < m) {
    const method = methods[i % m] as PlanMethod;
    const k = i % m;
    if ((counts[k] ?? 0) < method.capacity) {
      counts[k] = (counts[k] ?? 0) + 1;
      left -= 1;
      idle = 0;
    } else {
      idle += 1;
    }
    i += 1;
  }

  /* Банк кончился у всех: остаток — снова по кругу, сверх банка. */
  const overflow = left;
  for (let j = 0; left > 0; j += 1) {
    counts[j % m] = (counts[j % m] ?? 0) + 1;
    left -= 1;
  }

  return {
    counts: methods.map((item, k) => ({ id: item.id, count: counts[k] ?? 0 })),
    shortages,
    overflow,
  };
}

/** Число из строки зерна: FNV-1a, как у отпечатков. */
function zerno(seed: string): number {
  let hash = 0x811c9dc5;
  for (const ch of seed) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Порядок задач на листе: последовательность методов, где одинаковые
 * не стоят рядом, если это возможно, и без повторяющегося рисунка
 * (A, B, C, A, B, C…), по которому метод угадывался бы по номеру.
 * Порядок зависит только от зерна и долей, поэтому одинаков у листа
 * ученика и листа с ответами и у всех вариантов.
 */
export function planOrder(
  counts: readonly { id: string; count: number }[],
  seed: string,
): string[] {
  const random = seeded(zerno(`order:${seed}`));
  const left = counts.map((item) => ({ id: item.id, n: item.count }));
  const total = left.reduce((sum, item) => sum + item.n, 0);
  const out: string[] = [];
  let prev: string | null = null;
  /* Сколько задач одного метода стоят подряд прямо сейчас. */
  let run = 0;
  for (let step = 0; step < total; step += 1) {
    const remaining = total - step;
    const biggest = Math.max(...left.map((item) => item.n));
    /* Одному методу задач больше половины: соседей не избежать. Тогда
       случайно по весу, без запрета повтора — повторы рассыпаются по
       листу, а не собираются хвостом в конце. */
    const unavoidable = biggest * 2 > remaining + 1;
    /* Метод, которому иначе не хватит мест между остальными, идёт
       сейчас: так соседство одинаковых не понадобится и в конце. */
    const forced = unavoidable
      ? undefined
      : left.find((item) => item.n > 0 && item.id !== prev && item.n * 2 > remaining);
    let pick = forced;
    if (pick === undefined) {
      /* Повторяется только самый большой метод, и сериями не длиннее,
         чем нужно, чтобы разложить его поровну между остальными. */
      const top = left.find((item) => item.n === biggest);
      const others = remaining - biggest;
      const runCap = Math.ceil(biggest / (others + 1));
      const choices = left.filter(
        (item) => item.n > 0 && (item.id !== prev || (unavoidable && item === top && run < runCap)),
      );
      /* Пока самому большому можно — он: иначе он копится к концу
         листа длинной серией. */
      const topFirst = unavoidable && top !== undefined && choices.includes(top) ? [top] : choices;
      const pool = topFirst.length > 0 ? topFirst : left.filter((item) => item.n > 0);
      /* Случайно с весом по остатку: доли расходуются равномерно. */
      const weight = pool.reduce((sum, item) => sum + item.n, 0);
      let r = random() * weight;
      pick =
        pool.find((item) => {
          r -= item.n;
          return r < 0;
        }) ?? pool[pool.length - 1];
    }
    if (pick === undefined) {
      break;
    }
    pick.n -= 1;
    out.push(pick.id);
    run = pick.id === prev ? run + 1 : 1;
    prev = pick.id;
  }
  return out;
}
