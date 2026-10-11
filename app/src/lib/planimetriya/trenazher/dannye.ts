/**
 * Данные тренажёра и генератора №1, собранные на сервере: блоки с
 * прототипами и счётчиками, числа задач банка и аналогов без ответов,
 * ссылки к задаче (теория, полезный факт, опорный блок, разбор типа).
 * Ответов здесь нет: их считает движок в браузере и тут же закрывает
 * отпечатком (trenazher/zadacha.ts).
 *
 * Уровень прототипа — по объёму решения: два шага — ★, сокращение
 * дроби или третий шаг — ★★, третий шаг с сокращением или теорема
 * синусов — ★★★.
 */

import { RAZDELY_TEORII_1 } from '../../../content/teoriya1';
import { O_ZADANII_1 } from '../../../content/zadanie1';
import { analogi } from '../bank/analogi';
import { BANK_FIPI } from '../bank/fipi';
import { BLOKI } from '../prep/bloki';
import { reshenie } from '../reshenie';
import { PROTOTIPY } from '../stseny';
import type { Blok, Params } from '../stseny/dsl';
import {
  klyuchProto,
  nomerAnaloga,
  type Level,
  type RazdelInfo,
  type UslovieBanka,
} from './sessiya';

export interface SsylkiZadachi {
  /** Раздел теории: якорь #teoriya-…. */
  teoriya: string;
  /** Рамка «Полезный факт» раздела: якорь #layfhak-…; пусто — нет. */
  layfhak: string;
  /** Опорный блок навыка: адрес и название. */
  opornyy: { slug: string; nazvanie: string } | null;
  /** Разбор типа на «О задании»: …/razbor/{id}/. */
  razbor: string;
}

export interface DannyeTrenazhera1 {
  razdely: RazdelInfo[];
  bank: UslovieBanka[];
  /** Ссылки по прототипу (ключ «p05»). */
  ssylki: Record<string, SsylkiZadachi>;
}

const ELEMENTY = new Set([4, 5, 6, 7, 8, 55, 56, 69]);
const KASATELNYE = new Set([37, 38, 39, 40, 58, 59, 60, 73]);

/** Раздел теории прототипа: по блоку, с уточнением для высот и касательных. */
export function teoriyaDlya(proto: number, blok: Blok): string {
  if (ELEMENTY.has(proto)) return 'elementy';
  if (KASATELNYE.has(proto)) return 'kasatelnye';
  const poBloku: Record<Blok, string> = {
    I: 'ugly',
    II: 'chetyrehugolniki',
    III: 'ploshchadi',
    IV: 'ploshchadi',
    V: 'trig',
    VI: 'okruzhnost',
    VII: 'vpisannaya',
    VIII: 'vpisannaya',
    IX: 'sinusy',
    X: 'trig',
  };
  return poBloku[blok];
}

/** Опорный блок прототипа: блок типа, для высот и медиан — прямоугольный треугольник. */
function opornyyDlya(proto: number, blok: Blok): string {
  if (ELEMENTY.has(proto)) return 'pryamougolnyy-treugolnik';
  if (KASATELNYE.has(proto)) return 'kasatelnye-i-okruzhnosti';
  return O_ZADANII_1.tipy.find((t) => t.blok === blok)?.prep ?? 'summa-uglov';
}

export function urovenPrototipa(proto: number, blok: Blok, primer: Params): Level {
  const r = reshenie(proto, primer);
  const sokr = r.shagi.some((s) => s.sokrashchenie !== undefined);
  if (blok === 'IX' || (r.shagi.length >= 3 && sokr)) return 3;
  if (sokr || r.shagi.length >= 3) return 2;
  return 1;
}

export function dannyeTrenazhera1(): DannyeTrenazhera1 {
  const bank: UslovieBanka[] = [
    ...BANK_FIPI.map((z) => ({
      no: z.n,
      id: klyuchProto(z.proto),
      params: z.params,
      analog: false,
    })),
    ...PROTOTIPY.flatMap((p) =>
      analogi(p.id).map((a) => ({
        no: nomerAnaloga(p.id, a.no),
        id: klyuchProto(p.id),
        params: a.params,
        analog: true,
      })),
    ),
  ];
  const razdely: RazdelInfo[] = O_ZADANII_1.tipy.map((t) => ({
    id: t.blok as Blok,
    nazvanie: t.title,
    podtipy: PROTOTIPY.filter((p) => p.blok === t.blok).map((p) => ({
      id: klyuchProto(p.id),
      proto: p.id,
      kod: String(p.id).padStart(2, '0'),
      section: p.blok,
      title: p.nazvanie,
      level: urovenPrototipa(p.id, p.blok, p.primer as Params),
      vBanke: p.fipi.length,
    })),
  }));
  const ssylki = Object.fromEntries(
    PROTOTIPY.map((p) => {
      const teoriya = teoriyaDlya(p.id, p.blok);
      const razdel = RAZDELY_TEORII_1.find((r) => r.id === teoriya);
      const blok = BLOKI.find((b) => b.slug === opornyyDlya(p.id, p.blok));
      const tip = O_ZADANII_1.tipy.find((t) => t.blok === p.blok);
      return [
        klyuchProto(p.id),
        {
          teoriya,
          layfhak: razdel?.layfhaki[0]?.id ?? '',
          opornyy: blok === undefined ? null : { slug: blok.slug, nazvanie: blok.nazvanie },
          razbor: tip?.id ?? '',
        },
      ];
    }),
  ) as Record<string, SsylkiZadachi>;
  return { razdely, bank, ssylki };
}
