/**
 * Тренажёр №13 на общей панели фильтров (docs/trenazher-filtry/):
 * конфиг фильтров и конечный список задач.
 *
 * Темы — схемы A–D, чипы — прототипы (таблицы руками, P-…, — в
 * опорных задачах). Задачи — банк раздела: по десять seed на прототип
 * (bank.ts), поэтому числа на чипах честные. Источник — у прототипа:
 * из открытого банка ФИПИ или свой. Уровень: базовый — ★, повышенный —
 * ★★. Поля раздела: «Определить схему» вместо решения и «С
 * оформлением» — схема, первая строка таблицы и число.
 */

import { TRENAZHER_13 } from '../../../content/zadanie13';
import type { TrenazherConfig, ZadachaRef } from '../../trenazher/types';
import { TYPE_NAMES, type Difficulty, type Source, type TypeCode } from '../types';

export interface Proto13 {
  id: string;
  type: TypeCode;
  difficulty: Difficulty;
  source: Source;
  title: string;
}

const SHEMY: TypeCode[] = ['A', 'B', 'C', 'D'];

/** Названия без разметки формул — для строки-сводки и списка итогов. */
function bezFormul(text: string): string {
  return text.replace(/\$([^$]*)\$/g, (_, tex: string) => tex.replace(/\\[a-z]+\s*/gi, '').trim());
}

/** Прототипы тренажёра: без таблиц руками (P-…). */
export function prototipy13(protos: readonly Proto13[]): Proto13[] {
  return protos.filter((p) => !p.id.startsWith('P-'));
}

/**
 * Конфиг фильтров. Названия с формулами набирает typeset (KaTeX) —
 * его передаёт страница, на сборке.
 */
export function trenazherConfig13(
  protos: readonly Proto13[],
  typeset: (text: string) => string,
): TrenazherConfig {
  const T = TRENAZHER_13;
  return {
    razdel: '13',
    scope: '13',
    temy: SHEMY.map((type) => ({
      id: type,
      title: TYPE_NAMES[type],
      short: TYPE_NAMES[type].charAt(0).toLowerCase() + TYPE_NAMES[type].slice(1),
      podtipy: prototipy13(protos)
        .filter((p) => p.type === type)
        .map((p) => ({
          id: p.id,
          code: p.id,
          title: bezFormul(p.title),
          ...(p.title.includes('$') ? { titleHtml: typeset(p.title) } : {}),
        })),
    })),
    urovni: [
      { uroven: 1, words: T.urovniFiltra[1] },
      { uroven: 2, words: T.urovniFiltra[2] },
    ],
    istochnik: true,
    dop: [
      {
        id: 'zadanie',
        title: T.zadanie.title,
        varianty: [
          { id: 'reshit', title: T.zadanie.reshit },
          { id: 'tip', title: T.zadanie.tip, hint: T.zadanie.tipHint },
        ],
      },
      {
        id: 'oformlenie',
        title: T.oformlenie.title,
        varianty: [
          { id: 'otvet', title: T.oformlenie.otvet, hint: T.oformlenie.otvetHint },
          { id: 'oformlenie', title: T.oformlenie.oformlenie, hint: T.oformlenie.oformlenieHint },
        ],
      },
    ],
    nabory: [{ id: 'tip', title: T.naborTip.title, sub: T.naborTip.sub, dop: { zadanie: 'tip' } }],
  };
}

/** Задачи тренажёра: банк раздела, ключ — «A-01|b3», как в прогрессе №13. */
export function zadachi13(
  protos: readonly Proto13[],
  bank: readonly (readonly [string, string])[],
): ZadachaRef[] {
  const po = new Map(prototipy13(protos).map((p) => [p.id, p]));
  return bank.flatMap(([id, seed]) => {
    const p = po.get(id);
    return p === undefined
      ? []
      : [
          {
            key: `${id}|${seed}`,
            podtip: id,
            uroven: p.difficulty === 'base' ? 1 : 2,
            istochnik: p.source === 'fipi' ? 'fipi' : 'new',
          } satisfies ZadachaRef,
        ];
  });
}

/** Прототип и seed по ключу «A-01|b3». Чужой ключ — null. */
export function poKlyuchu13(key: string): { prototypeId: string; seed: string } | null {
  const [prototypeId = '', seed = ''] = key.split('|');
  return /^[A-D]-\d{2}$/.test(prototypeId) && seed !== '' ? { prototypeId, seed } : null;
}
