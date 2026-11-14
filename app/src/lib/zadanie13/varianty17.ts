/**
 * Каталог задач прежнего №17 из вариантов для раздела экономической
 * задачи — собирается на сборке (серверные страницы): какие задачи есть,
 * какого они вида и сюжета, с чего начинается условие. Сами условия и
 * решения в страницу не кладутся — их подтягивает карточка в браузере
 * (lib/zadanie13/zadachaVarianta.ts).
 *
 * Вид задачи — общий для сайта: vidZadachi17 (lib/variant/struktura.ts).
 * Сюжет — по шаблону задачи; у шаблона r17.ekstremum три сюжета, их
 * различает сама задача. Сюжет всегда того же вида, что задача: если
 * вид шаблона поменяют, задача уйдёт в «Другие задачи» своего вида, и
 * проверка pnpm test:zadanie13 это покажет.
 */

import { EZH_TITLE, EZH_VARIANT_LABEL } from '@/content/ezhemesyachnye';
import { POV_TITLE } from '@/content/povyshennye';
import {
  SYUZHETY13,
  type Syuzhet13,
  type SyuzhetId13,
  type Vid13,
} from '@/content/ekonomicheskie13';
import { zagruzitVariant as zagruzitEV, GOTOVY as GOTOVY_EV } from '@/lib/ezhemesyachnye/dannye';
import { zadacha2EV } from '@/lib/ezhemesyachnye/chast2';
import { zagruzitVariant as zagruzitPV, GOTOVY as GOTOVY_PV } from '@/lib/povyshennye/dannye';
import { zadacha2 } from '@/lib/povyshennye/chast2';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { vidZadachi17 } from '@/lib/variant/struktura';
import { klyuchVarianta, zapis17, type MestoVarianta } from './zadachaVarianta';

/** Сюжет по шаблону. r17.ekstremum — по задаче (syuzhetR17). */
const PO_SHABLONU: Readonly<Record<string, SyuzhetId13>> = {
  'u17.kredit2': 'kredit',
  'y17.kreditDvaGoda': 'kredit',
  'q17.cenaSpros': 'cena-spros',
  'm17.sudno': 'sudno',
  'p17.korobka': 'korobka',
  'i17.uchastok': 'uchastok',
  'x17.uchastok': 'uchastok',
  'w17.zaborStena': 'uchastok',
  'ae17.polukrug': 'polukrug',
  'k17.lampa': 'lampa',
  'ev2.17': 'lampa',
  'l17.spasatel': 'marshrut',
  'ev3.17': 'marshrut',
  'a17.perekrestok': 'perekrestok',
  'n17.koncentraciya': 'koncentraciya',
  'b17.dzhoul': 'moshchnost',
  'ev1.17': 'fizika',
  'ev4.17': 'fizika',
};

/** r17.ekstremum: прибыль фирмы, коробка из листа или путь курьера. */
function syuzhetR17(z: Chast2Zadacha): SyuzhetId13 {
  if (z.vid17 === 'ekonomika') return 'pribyl';
  return /коробк/.test(z.uslovie) ? 'korobka' : 'marshrut';
}

/** Сюжет задачи; не нашёлся или другого вида — «Другие задачи» её вида. */
export function syuzhetZadachi(z: Chast2Zadacha): SyuzhetId13 {
  const vid = vidZadachi17(z) ?? 'optimizaciya';
  const id = z.shablon === 'r17.ekstremum' ? syuzhetR17(z) : PO_SHABLONU[z.shablon];
  const s = SYUZHETY13.find((x) => x.id === id);
  if (s !== undefined && s.vid === vid) return s.id;
  return vid === 'ekonomika' ? 'drugie-ekonomika' : 'drugie-optimizaciya';
}

/**
 * Первое предложение условия — название карточки. Конец предложения ищем
 * вне формул: точка, за которой с большой буквы идёт следующее, или
 * перенос строки. Длинное — обрезаем по слову вне формулы.
 */
export function nachaloUsloviya(tekst: string, dlina = 170): string {
  /* Перенос без точки перед ним — продолжение предложения (формула на
     своей строке); крупный набор формулы в названии не нужен. */
  const uslovie = tekst.replace(/\\displaystyle\s*/g, '').replace(/([^.?!])\n/g, '$1 ');
  let vFormule = false;
  let slovo = -1;
  for (let i = 0; i < uslovie.length; i += 1) {
    const c = uslovie[i];
    if (c === '$') vFormule = !vFormule;
    if (vFormule) continue;
    if (c === '\n') return uslovie.slice(0, i).trim();
    if (c === ' ' && i <= dlina) slovo = i;
    if ((c === '.' || c === '?') && /^\s+[A-ZА-ЯЁ]/.test(uslovie.slice(i + 1))) {
      if (i <= dlina) return uslovie.slice(0, i + 1);
      break;
    }
    if (i > dlina) break;
  }
  if (uslovie.length <= dlina && !vFormule) return uslovie.trim();
  return `${uslovie.slice(0, slovo === -1 ? dlina : slovo).trim()}…`;
}

export interface ZadachaKataloga extends MestoVarianta {
  /** Ключ для якоря «tip-…»: pv27-5, ev3. */
  id: string;
  shablon: string;
  vid: Vid13;
  syuzhet: SyuzhetId13;
  /** Первое предложение условия, формулы в $…$. */
  nachalo: string;
  /** Откуда задача: «Вариант повышенной сложности 27.5». */
  otkuda: string;
}

function zapis(m: MestoVarianta, z: Chast2Zadacha, otkuda: string): ZadachaKataloga {
  return {
    ...m,
    id: klyuchVarianta(m),
    shablon: z.shablon,
    vid: vidZadachi17(z) ?? 'optimizaciya',
    syuzhet: syuzhetZadachi(z),
    nachalo: nachaloUsloviya(z.uslovie),
    otkuda,
  };
}

let kesh: Promise<ZadachaKataloga[]> | null = null;

/** Все задачи прежнего №17: варианты повышенной сложности, затем ежемесячные. */
export function katalogVariantov17(): Promise<ZadachaKataloga[]> {
  kesh ??= (async () => {
    const vse: ZadachaKataloga[] = [];
    for (const k of GOTOVY_PV) {
      const d = await zagruzitPV(k);
      (d?.chast2 ?? []).forEach((zapisi, i) => {
        const zp = zapis17(zapisi);
        if (zp === undefined) return;
        const v = i + 1;
        vse.push(zapis({ k, v }, zadacha2(zp), `${POV_TITLE} ${k}.${v}`));
      });
    }
    for (const k of GOTOVY_EV) {
      const d = await zagruzitEV(k);
      const zp = zapis17(d?.chast2?.[0] ?? []);
      if (zp === undefined) continue;
      vse.push(zapis({ k, v: null }, zadacha2EV(zp), `${EZH_TITLE} · ${EZH_VARIANT_LABEL(k)}`));
    }
    return vse;
  })();
  return kesh;
}

/** Сюжеты вида по порядку, с задачами; пустые не показываются. */
export async function syuzhetyVida(
  vid: Vid13,
): Promise<{ syuzhet: Syuzhet13; zadachi: ZadachaKataloga[] }[]> {
  const vse = await katalogVariantov17();
  return SYUZHETY13.filter((s) => s.vid === vid)
    .map((syuzhet) => ({ syuzhet, zadachi: vse.filter((z) => z.syuzhet === syuzhet.id) }))
    .filter((g) => g.zadachi.length > 0);
}
