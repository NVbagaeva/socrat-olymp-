/**
 * Какой раздел стоит на каком острове «Карты ЕГЭ».
 *
 * Острова нарисованы на фоне один раз: 13 на материке первой части и 7
 * на материке второй (content/karta/kontury.json, номера 1–20 — номера
 * мест на картинке). Раздел же записан номером хранения
 * (content/struktura.js), а на острове подписан номер ЕГЭ. Связь между
 * ними даёт действующая структура экзамена:
 *
 *   первая часть — место = номер ЕГЭ (1, 2, …);
 *   вторая часть — места 14–20 по порядку номеров ЕГЭ.
 *
 * В структуре из 20 заданий место, номер ЕГЭ и номер хранения совпадают.
 * В ЕГЭ-2027 первая часть — 12 заданий: тринадцатый остров свободен, на
 * нём надпись «Будет на ЕГЭ» (решение владельца). Разделы без своего
 * номера (скрытый, идущий внутри другого) острова не получают.
 */

import { STRUKTURA, zadaniyaEge } from '@/content/struktura';

/** Мест на материке первой части и всего — по рисунку. */
const MEST_CHAST_1 = 13;
const MEST_VSEGO = 20;

const ZADANIYA = zadaniyaEge();
const CHAST1 = STRUKTURA.chast1;

/** Место острова у задания с номером ЕГЭ. */
function mestoNomera(nomer: number): number {
  return nomer <= CHAST1 ? nomer : MEST_CHAST_1 + (nomer - CHAST1);
}

/** Остров раздела (номер места на рисунке); null — у раздела своего острова нет. */
export function ostrovRazdela(hranenie: number): number | null {
  const z = ZADANIYA.find((x) => x.hranenie === hranenie);
  return z === undefined ? null : mestoNomera(z.nomer);
}

/** Раздел на острове; null — остров свободен. */
export function razdelOstrova(mesto: number): number | null {
  return ZADANIYA.find((z) => mestoNomera(z.nomer) === mesto)?.hranenie ?? null;
}

/** Номер ЕГЭ раздела, который подписан на его острове. */
export function nomerNaOstrove(hranenie: number): number {
  return ZADANIYA.find((x) => x.hranenie === hranenie)?.nomer ?? hranenie;
}

/** Свободные острова: на них — «Будет на ЕГЭ». */
export const SVOBODNYE_OSTROVA: readonly number[] = Array.from({ length: MEST_VSEGO }, (_, i) => i + 1).filter(
  (m) => razdelOstrova(m) === null,
);
