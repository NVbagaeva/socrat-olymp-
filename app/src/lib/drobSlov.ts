/**
 * Дробь со словами в числителе и знаменателе — узкой: каждое слово
 * своей строкой внутри дроби. «противолежащий катет / прилежащий катет»
 * одной строкой шире экрана телефона, и формула выходила из рамки.
 *
 *   drobSlov('противолежащий катет', 'прилежащий катет')
 *   → \dfrac{\begin{array}{c}\text{противолежащий}\\ \text{катет}\end{array}}{…}
 *
 * Модуль без зависимостей: его берут и данные карточек, и клиент.
 */

function stolbec(slova: string): string {
  const chasti = slova.trim().split(/\s+/);
  if (chasti.length === 1) {
    return `\\text{${chasti[0]}}`;
  }
  return `\\begin{array}{c}${chasti.map((s) => `\\text{${s}}`).join('\\\\ ')}\\end{array}`;
}

export function drobSlov(chislitel: string, znamenatel: string): string {
  return `\\dfrac{${stolbec(chislitel)}}{${stolbec(znamenatel)}}`;
}

/** Тангенс через катеты: самая частая такая дробь на сайте. */
export const DROB_KATETOV = drobSlov('противолежащий катет', 'прилежащий катет');
