/**
 * Проверка глаголов движения в условии задачи №11: едущий герой
 * (автобус, велосипедист, гонщик…) не «вышел», не «прошёл» и не
 * «пришёл» — он «выехал», «проехал», «приехал». Пешеход и лыжник
 * «идут», суда «выходят из пристани» и «проходят по течению», поезд
 * «проходит мимо» — это верно.
 *
 * Кто подлежащее у глагола: герой сразу после глагола («вышел
 * автобус»), иначе последний названный до него («Первый прошёл…» —
 * о двух автобусах из прошлого предложения; «он пришёл» — о том, кого
 * назвали последним). Проверка — для аналогов (самотест пула) и для
 * сгенерированных задач; условия банка ФИПИ не проверяются: их не
 * меняем ни на букву.
 */

import { GEROI, type Sposob } from './prototypes/syuzhety';

/** Основа слова героя: «автомобиль» → «автомобил», «лодка» → «лодк». */
function osnova(im: string): string {
  return /[аяоеьй]$/.test(im) && im !== 'такси' ? im.slice(0, -1) : im;
}

/** Слова героев и как они движутся; сверх словаря — формы, которых в нём нет. */
const SLOVA: Array<[string, Sposob]> = [
  ...Object.values(GEROI).map((g): [string, Sposob] => [osnova(g.im), g.gl.sposob]),
  ['пловц', 'plyvet'],
  ['картингист', 'edet'],
  ['велосипед', 'edet'],
  ['мотоцикл', 'edet'],
  ['электросамокат', 'edet'],
  ['машин', 'edet'],
  ['водител', 'edet'],
  ['маршрутк', 'edet'],
  ['трамва', 'edet'],
  ['троллейбус', 'edet'],
  ['плот', 'sudno'],
  ['лайнер', 'sudno'],
  ['сухогруз', 'sudno'],
  ['судн', 'sudno'],
  ['состав', 'poezd'],
];

/** «Туристический автобус», «пешеходный мост» — прилагательные, не герои. */
const NE_GEROI = /^(туристическ|пешеходн)/;

/** Короткие слова — только целиком: «карт» (но не «карта»). */
const TSELIKOM: Record<string, Sposob> = { карт: 'edet', карты: 'edet', карта: 'edet' };

function geroySlova(w: string): Sposob | null {
  if (NE_GEROI.test(w)) return null;
  if (w in TSELIKOM) return TSELIKOM[w] as Sposob;
  let best: [string, Sposob] | null = null;
  for (const s of SLOVA) {
    if (w.startsWith(s[0]) && (best === null || s[0].length > best[0].length)) best = s;
  }
  return best ? best[1] : null;
}

/**
 * Нельзя для едущего: вышел, прошёл, пришёл, шёл, дошёл и причастия
 * «вышедший», «пришедший». «Прошедшее» не берём: «время, прошедшее с
 * начала торможения» — о времени, не о герое.
 */
const NELZYA = /^((вы|про|при|до)?(шёл|шел|шла|шли)|(вы|при)шедш[а-яё]*)$/;

/** Чем заменить: «вышел» → «выехал». */
const ZAMENA: Record<string, string> = {
  вы: 'выехал',
  про: 'проехал',
  при: 'приехал',
  до: 'доехал',
  '': 'ехал',
};

interface Kto {
  slovo: string;
  sposob: Sposob;
}

/** Нарушения в тексте условия: «автобус … вышел» → «выехал». */
export function oshibkiGlagolov(text: string): string[] {
  const tokens = [...text.toLowerCase().matchAll(/[а-яё]+|[.,;:!?—]/g)].map((m) => m[0]);
  const out: string[] = [];
  let posledniy: Kto | null = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const w = tokens[i] as string;
    const sposob = geroySlova(w);
    if (sposob !== null) {
      posledniy = { slovo: w, sposob };
      continue;
    }
    if (!NELZYA.test(w)) continue;
    /* Подлежащее после глагола — в пределах трёх слов до знака препинания. */
    let kto: Kto | null = null;
    for (let j = i + 1; j < Math.min(tokens.length, i + 4); j += 1) {
      const t = tokens[j] as string;
      if (/^[.,;:!?—]$/.test(t)) break;
      const s = geroySlova(t);
      if (s !== null) {
        kto = { slovo: t, sposob: s };
        break;
      }
    }
    kto ??= posledniy;
    if (kto?.sposob === 'edet') {
      const pref = /^(вы|про|при|до)/.exec(w)?.[1] ?? '';
      out.push(`«${kto.slovo} … ${w}»: герой едет — нужен глагол вроде «${ZAMENA[pref]}»`);
    }
  }
  return out;
}
