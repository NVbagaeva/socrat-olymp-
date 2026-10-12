/**
 * Сборка задач задания №5 из шаблонов: `(шаблон, seed) → задача`.
 *
 * Как generate(id, seed) движка графиков: перебор параметров по seed
 * с отбраковкой, пока числа не пройдут ограничения шаблона и общие
 * правила ответа (zapisat). Один seed — всегда одна и та же задача,
 * поэтому лист ученика, ответы и решения совпадают.
 */

import { dec, okrugl, zapasOkrugleniya, znakov, type Drob } from './drob';
import { najtiShablon, SHABLONY_5, type ShablonLyuboy, type Syuzhet5 } from './shablony';
import {
  hash,
  rng,
  TIPY_5,
  type Chast5,
  type ChastChernovik,
  type Rng,
  type Tip5,
  type Zadacha5,
} from './tipy';

/** Сколько раз шаблон пробует новые параметры, прежде чем сдаться. */
const POPYTOK = 2000;

/** Запас до спорной «…5» при округлении, в долях шага. */
const ZAPAS = 0.1;

const OKRUGLITE = 'Ответ округлите до сотых.';

/**
 * Записать ответ части по-ЕГЭ. null — ответ не годится (спорное
 * округление, вероятность вне [0; 1], округление до 0 или 1).
 */
export function zapisat(ch: ChastChernovik, minZapas = ZAPAS): Chast5 | null {
  const base = { metka: ch.metka, vopros: ch.vopros, neVeroyatnost: ch.neVeroyatnost === true };
  if (ch.znachenie === null) {
    return ch.slovo === undefined
      ? null
      : { ...base, znachenie: null, otvet: ch.slovo, okruglen: false };
  }
  const x: Drob = ch.znachenie;
  const n = x.toNumber();
  if (!base.neVeroyatnost && (n <= 0 || n >= 1)) {
    return null;
  }
  if (base.neVeroyatnost && (n <= 0 || n > 1000)) {
    return null;
  }
  /* «Округлите до сотых» в самом вопросе — тогда только сотые. */
  const rezhim = ch.vopros.includes('округлите до сотых') ? 'sotye' : (ch.rezhim ?? 'avto');
  const k = znakov(x);
  const predel = rezhim === 'sotye' ? 2 : 4;
  if (k !== null && k <= predel) {
    return { ...base, znachenie: x, otvet: dec(x), okruglen: false };
  }
  if (zapasOkrugleniya(x, 2) < minZapas) {
    return null;
  }
  const otvet = okrugl(x, 2);
  if (!base.neVeroyatnost && (otvet === '0,00' || otvet === '1,00')) {
    return null;
  }
  return { ...base, znachenie: x, otvet, okruglen: true };
}

/** Строка ответа задачи: «0,85» или «а) нет; б) 0,052; в) 0,52». */
export function otvetStrokoy(chasti: readonly Chast5[]): string {
  return chasti.map((c) => (c.metka === null ? c.otvet : `${c.metka}) ${c.otvet}`)).join('; ');
}

/** Вопрос с фразой про округление, если она нужна и её ещё нет. */
function sOkrugleniem(c: Chast5): string {
  return c.okruglen && !c.vopros.includes('округлите') ? `${c.vopros} ${OKRUGLITE}` : c.vopros;
}

/** Условие целиком: вводная часть и вопросы. */
export function uslovieIz(vvod: string, chasti: readonly Chast5[]): string {
  if (chasti.length === 1 && chasti[0]?.metka === null) {
    return `${vvod} ${sOkrugleniem(chasti[0])}`;
  }
  return [vvod, ...chasti.map((c) => `${c.metka}) ${sOkrugleniem(c)}`)].join('\n\n');
}

/**
 * Задача из шаблона с готовыми параметрами и сюжетом. null — числа не
 * проходят правила ответа. `uslovie` — своё условие вместо текста
 * сюжета (задачи исходного ДЗ №9 записаны словами автора).
 * `minZapas` — запас до спорного округления: у генератора он строгий,
 * у готовых наборов автора — нулевой (ответ автора 0,275… → 0,28
 * оставлен как есть).
 */
export function sobrat(
  sh: ShablonLyuboy,
  p: unknown,
  syuzhet: Syuzhet5<unknown>,
  r: Rng,
  id: string,
  uslovie?: string,
  minZapas = ZAPAS,
): Zadacha5 | null {
  const tekst = syuzhet.tekst(p);
  const chernoviki = sh.chasti(p);
  if (tekst.voprosy.length !== chernoviki.length) {
    throw new Error(
      `${sh.id}/${syuzhet.id}: вопросов ${tekst.voprosy.length}, частей ${chernoviki.length}`,
    );
  }
  const chasti: Chast5[] = [];
  for (const [i, ch] of chernoviki.entries()) {
    const c = zapisat({ ...ch, vopros: tekst.voprosy[i] ?? '' }, minZapas);
    if (c === null) {
      return null;
    }
    chasti.push(c);
  }
  const risunok = sh.risunok === undefined ? null : sh.risunok(p, r);
  if (sh.risunok !== undefined && risunok === null) {
    return null;
  }
  return {
    id,
    shablon: sh.id,
    tip: sh.tip,
    syuzhet: syuzhet.id,
    uslovie: uslovie ?? uslovieIz(tekst.vvod, chasti),
    chasti,
    risunok,
    otvet: otvetStrokoy(chasti),
    reshenie: sh.shagi(
      p,
      chasti.map((c) => c.otvet),
    ),
  };
}

/** Сюжеты шаблона, которые берёт генератор. */
export function syuzhetyGeneratora(sh: ShablonLyuboy): Syuzhet5<unknown>[] {
  return sh.syuzhety.filter((s: Syuzhet5<unknown>) => s.tolkoNabor !== true);
}

/**
 * Задача по шаблону и seed. Сюжет — заданный или по seed. Код задачи
 * короткий и стабильный: номер шаблона и хеш seed.
 */
export function generirovat(shablonId: string, seed: string, syuzhetId?: string): Zadacha5 {
  const sh = najtiShablon(shablonId);
  if (sh === undefined) {
    throw new Error(`Нет шаблона ${shablonId}`);
  }
  const r = rng(`${shablonId}:${seed}`);
  const syuzhety = syuzhetyGeneratora(sh);
  const zadan = syuzhety.find((s) => s.id === syuzhetId);
  const id = `${sh.nomer}.${(hash(`${shablonId}:${seed}`) % 46656).toString(36).toUpperCase().padStart(3, '0')}`;
  for (let i = 0; i < POPYTOK; i += 1) {
    const p = sh.parametry(r);
    if (!sh.podhodit(p)) {
      continue;
    }
    const z = sobrat(sh, p, zadan ?? r.pick(syuzhety), r, id);
    if (z !== null) {
      return z;
    }
  }
  throw new Error(`Шаблон ${shablonId}: за ${POPYTOK} попыток нет годных чисел (seed ${seed})`);
}

/** Шаблоны типа — в порядке номеров. */
export function shablonyTipa(tip: Tip5): ShablonLyuboy[] {
  return SHABLONY_5.filter((s) => s.tip === tip);
}

/** План ДЗ из генератора: сколько задач какого типа. */
export type PlanDz = Partial<Record<Tip5, number>>;

/**
 * ДЗ из генератора: задачи по типам, в порядке типов. Внутри типа
 * шаблоны и сюжеты идут по кругу со сдвигом по seed, поэтому две
 * задачи одного типа почти никогда не совпадают ни шаблоном, ни
 * сюжетом.
 */
export function dzIzGeneratora(plan: PlanDz, seed: string): Zadacha5[] {
  const out: Zadacha5[] = [];
  for (const { id: tip } of TIPY_5) {
    const skolko = plan[tip] ?? 0;
    const shablony = shablonyTipa(tip);
    if (skolko <= 0 || shablony.length === 0) {
      continue;
    }
    const r = rng(`${seed}:${tip}`);
    const sdvig = r.int(0, shablony.length - 1);
    for (let i = 0; i < skolko; i += 1) {
      const sh = shablony[(sdvig + i) % shablony.length] as ShablonLyuboy;
      const syuzhety = syuzhetyGeneratora(sh);
      const krug = Math.floor(i / shablony.length);
      const syuzhet = syuzhety[(r.int(0, syuzhety.length - 1) + krug) % syuzhety.length];
      out.push(generirovat(sh.id, `${seed}:${tip}:${i}`, syuzhet?.id));
    }
  }
  return out;
}
