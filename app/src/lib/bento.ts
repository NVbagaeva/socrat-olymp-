/**
 * Раскладка Bento: карточки разного размера, ряды без дыр.
 *
 * Сетка CSS сама ставит карточки по порядку, но о дырах в конце ряда
 * не заботится: широкая карточка, которой не хватило места, уходит на
 * следующий ряд и оставляет пустую клетку. Поэтому размер каждой
 * карточки считается здесь, заранее, под число колонок: каждый ряд
 * заполнен ровно, а порядок карточек — порядок чтения — не меняется.
 *
 * Колонок три варианта: 2 (телефон), 3 (планшет) и 4 (компьютер).
 * Первая карточка — крупная (2×2) там, где колонок больше двух, и во
 * всю ширину на телефоне; дальше ряды чередуются: с одной широкой
 * карточкой и из одинаковых.
 */

/** Размер карточки: сколько колонок она занимает; big — 2×2. */
export type BentoSize = 1 | 2 | 3 | 4 | 'big';

export type BentoCols = 2 | 3 | 4;

/** Ряд из k карточек на c колонок: где стоит широкая. */
function ryad(k: number, c: number, nomer: number): BentoSize[] {
  if (k === c) {
    return Array<BentoSize>(k).fill(1);
  }
  if (k === 1) {
    return [c as BentoSize];
  }
  /* Лишние клетки ряда отдаются одной карточке; чётные ряды — первой,
     нечётные — последней, чтобы широкие не вставали столбиком. */
  const lishnie = c - k;
  const sizes = Array<BentoSize>(k).fill(1);
  if (k === 2 && c === 4) {
    return [2, 2];
  }
  sizes[nomer % 2 === 0 ? 0 : k - 1] = (1 + lishnie) as BentoSize;
  return sizes;
}

/**
 * Размеры n карточек под c колонок.
 *
 * @param featured — выделять ли первую карточку (крупная или во всю
 *   ширину). На коротком списке без неё ровнее.
 */
export function bento(n: number, c: BentoCols, featured = true): BentoSize[] {
  const out: BentoSize[] = [];
  let ostalos = n;
  if (featured && n > 0) {
    if (c === 2) {
      out.push(2);
      ostalos -= 1;
    } else if (n >= 1 + 2 * (c - 2)) {
      /* Крупная 2×2 и рядом с ней по (c − 2) карточки в двух рядах. */
      out.push('big');
      for (let i = 0; i < 2 * (c - 2); i += 1) {
        out.push(1);
      }
      ostalos -= 1 + 2 * (c - 2);
    }
  }
  /* Чередование рядов: с широкой карточкой (c − 1 штук) и полный. */
  let nomer = 0;
  while (ostalos > 0) {
    /* На телефоне — в основном пары, каждый третий ряд во всю ширину. */
    const hochu = c === 2 ? (nomer % 3 === 2 ? 1 : 2) : nomer % 2 === 0 ? c - 1 : c;
    let k = Math.min(hochu, ostalos);
    /* Не оставлять в конце одинокую карточку: взять её в текущий ряд,
       а если он полон — отдать следующему ещё одну. */
    if (ostalos - k === 1) {
      k += k < c ? 1 : -1;
    }
    out.push(...ryad(k, c, nomer));
    ostalos -= k;
    nomer += 1;
  }
  return out;
}

/** Атрибуты карточки для CSS: data-b2, data-b3, data-b4. */
export function bentoAttrs(
  sizes: Record<BentoCols, BentoSize[]>,
  i: number,
): Record<'data-b2' | 'data-b3' | 'data-b4', string> {
  return {
    'data-b2': String(sizes[2][i] ?? 1),
    'data-b3': String(sizes[3][i] ?? 1),
    'data-b4': String(sizes[4][i] ?? 1),
  };
}

/** Размеры для всех трёх раскладок сразу. */
export function bentoAll(n: number, featured = true): Record<BentoCols, BentoSize[]> {
  return { 2: bento(n, 2, featured), 3: bento(n, 3, featured), 4: bento(n, 4, featured) };
}
