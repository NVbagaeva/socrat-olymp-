/**
 * Подход тренажёра задания №3: какие задания и в каком порядке.
 *
 * Чистая логика, без разметки и без обращения к случайности напрямую:
 * источник случайных чисел передаётся снаружи. Поэтому подход можно
 * собрать с предсказуемым источником и проверить на примерах, а в
 * браузере он собирается после монтирования — при отрисовке
 * случайных чисел не берут, иначе сервер и клиент разошлись бы.
 */

/** Задание подхода: прототип и номер его варианта. */
export interface RoundItem {
  kind: string;
  n: number;
}

export interface RoundKind {
  id: string;
  variants: { n: number }[];
}

/** Сколько заданий в подходе. */
export const ROUND_SIZE = 10;

/** Подряд одного типа — не больше этого. */
const SAME_IN_ROW = 2;

/** Перемешивание Фишера — Йетса на переданном источнике. */
function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * Подход из заданий выбранных типов.
 *
 * Один тип — это все его варианты по порядку: десять задач одного
 * прототипа, перемешивать нечего. Несколько типов — смешанный
 * режим: варианты берутся вперемешку и подряд одного типа не
 * больше двух, иначе «смешанный» выглядел бы как три одинаковых
 * задачи кряду.
 */
export function buildRound(
  kinds: RoundKind[],
  random: () => number,
  size = ROUND_SIZE,
): RoundItem[] {
  if (kinds.length === 0) {
    return [];
  }
  if (kinds.length === 1) {
    const only = kinds[0] as RoundKind;
    return shuffle(only.variants, random)
      .slice(0, size)
      .map((variant) => ({ kind: only.id, n: variant.n }));
  }

  /* Из каждого типа берём перемешанные варианты и складываем в
     общую кучу, затем выкладываем по одному, следя за тем, чтобы
     третьего подряд одинакового не случилось. */
  const piles = new Map<string, number[]>();
  kinds.forEach((kind) => {
    piles.set(
      kind.id,
      shuffle(kind.variants, random).map((variant) => variant.n),
    );
  });

  const out: RoundItem[] = [];
  while (out.length < size) {
    /* Сколько одинаковых типов стоит в хвосте. */
    const tail = out[out.length - 1];
    let repeat = 0;
    for (let i = out.length - 1; i >= 0 && out[i]?.kind === tail?.kind; i -= 1) {
      repeat += 1;
    }
    const blocked = tail !== undefined && repeat >= SAME_IN_ROW ? tail.kind : null;

    /* Тип выбирается случайно, но с весом по остатку кучи: типы,
       которых осталось больше, выпадают чаще, и задания расходятся
       ровно, а не кончаются пачками. Просто «самая большая куча»
       давала бы строгое чередование — правило соблюдено, но
       «перемешанным» такой подход не выглядит. */
    const ready = [...piles.entries()].filter(([id, list]) => list.length > 0 && id !== blocked);
    if (ready.length === 0) {
      break;
    }
    const weight = ready.reduce((sum, [, list]) => sum + list.length, 0);
    let ticket = random() * weight;
    let pick = ready[ready.length - 1] as [string, number[]];
    for (const entry of ready) {
      ticket -= entry[1].length;
      if (ticket <= 0) {
        pick = entry;
        break;
      }
    }
    const [id, list] = pick;
    const n = list.shift();
    if (n === undefined) {
      break;
    }
    out.push({ kind: id, n });
  }
  return out;
}

/** Другой вариант того же прототипа: не тот, что сейчас на экране. */
export function otherVariant(
  variants: { n: number }[],
  current: number,
  random: () => number,
): number {
  const rest = variants.filter((variant) => variant.n !== current);
  if (rest.length === 0) {
    return current;
  }
  const pick = rest[Math.floor(random() * rest.length)] as { n: number };
  return pick.n;
}

/**
 * Источник случайных чисел с зерном: одно зерно — один и тот же
 * подход. Нужен и для проверки, и для того, чтобы подход пережил
 * перерисовку, не собравшись заново.
 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
