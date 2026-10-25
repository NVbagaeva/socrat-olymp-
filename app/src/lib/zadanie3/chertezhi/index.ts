/**
 * Сценарии чертежей банка №3 (многогранники, разделы I–III).
 *
 * Сценарий каждого варианта собирается из текста условия
 * (razbor.ts → sborka.ts) и записи прототипа (annotacii.ts).
 * Ступенчатые многогранники условия не описывают («на рисунке») —
 * их тело и числа берутся из параметров варианта, как и раньше.
 *
 * Тела вращения (разделы IV–VIII) — следующие этапы: для них
 * сценария нет, и банк рисует их прежним движком solid/.
 */

import type { Dannoe, TochkaScenariya } from '@/lib/chertezh3/scenariy';
import { validirovat } from '@/lib/chertezh3/validator';
import { postroit } from '@/lib/chertezh3/postroit';
import { type VybranVid, sVidom, vybratVid } from '@/lib/chertezh3/vid';
import { RAZDELY } from '../index';
import { type Params, type Prototype, type Variant, num } from '../types';
import { ANNOTACII } from './annotacii';
import { razobrat } from './razbor';
import { type Sborka, sobratScenariy } from './sborka';

/** Разделы банка, где чертежи — сценарии (многогранники). */
export const RAZDELY_MNOGOGRANNIKOV = ['I', 'II', 'III'] as const;

export function estScenariy(prototype: Prototype): boolean {
  return (RAZDELY_MNOGOGRANNIKOV as readonly string[]).includes(prototype.razdel);
}

/** Числа ступенчатого многогранника — «данные на рисунке». */
function stupenka(p: Params) {
  const [W, H, w, h, depth] = ['W', 'H', 'w', 'h', 'depth'].map((x) => num(p, x)) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const t = (imya: string, xyz: readonly [number, number, number]): TochkaScenariya => ({
    imya,
    gde: { xyz },
    pokazat: false,
  });
  const tochki = [
    t('P', [0, 0, 0]),
    t('Q', [W, 0, 0]),
    t('R', [0, 0, H]),
    t('T', [W, depth, 0]),
    t('U', [W, depth, h]),
    t('V', [w, depth, h]),
    t('X', [w, depth, H]),
    // Передний профиль.
    t('F', [W, 0, h]),
    t('G', [w, 0, h]),
    t('K', [w, 0, H]),
  ];
  const ru = (x: number) => String(x).replace('.', '{,}');
  const dannye: Dannoe[] = [
    { id: 'W', na: { otrezok: ['P', 'Q'] }, tekst: ru(W) },
    { id: 'H', na: { otrezok: ['P', 'R'] }, tekst: ru(H) },
    { id: 'h', na: { otrezok: ['T', 'U'] }, tekst: ru(h) },
    { id: 'Ww', na: { otrezok: ['V', 'U'] }, tekst: ru(W - w) },
    { id: 'Hh', na: { otrezok: ['V', 'X'] }, tekst: ru(H - h) },
    { id: 'depth', na: { otrezok: ['Q', 'T'] }, tekst: ru(depth) },
  ];
  return {
    telo: {
      vid: 'sostavnoy' as const,
      bloki: [
        { op: '+' as const, ot: [0, 0, 0] as const, razmer: [W, depth, h] as const },
        { op: '+' as const, ot: [0, 0, h] as const, razmer: [w, depth, H - h] as const },
      ],
    },
    tochki,
    dannye,
    proverki: [{ obem: (W * h + w * (H - h)) * depth }],
    chisla: [W, H, h, W - w, H - h, depth],
  };
}

export interface ChertezhVarianta extends Sborka {
  /** Ошибки валидатора: пусто — сценарий годен. */
  oshibki: string[];
  /** Выбранный вид: ракурс, сжатие высоты и метрики (lib/chertezh3/vid.ts). */
  vid: VybranVid;
}

/** Сценарий чертежа варианта. null — прототип не про многогранник. */
export function chertezhVarianta(prototype: Prototype, variant: Variant): ChertezhVarianta | null {
  if (!estScenariy(prototype)) return null;
  const uslovie = prototype.uslovie(variant.params);
  const r = razobrat(uslovie);
  const id = `${prototype.id}#${variant.n}`;
  const alt = prototype.chertezh(variant.params).alt;
  const ann = ANNOTACII[prototype.id];
  let sb: Sborka;
  let tekstDlyaProverki = uslovie;
  if (r.telo === 'sostavnoy') {
    const s = stupenka(variant.params);
    sb = sobratScenariy(r, {
      id,
      alt,
      telo: s.telo,
      tochki: s.tochki,
      dannye: s.dannye,
      proverki: s.proverki,
      dobavki: () => ({
        elementy: [{ id: 'profil', vid: 'mnogougolnik', tochki: ['P', 'Q', 'F', 'G', 'K', 'R'] }],
        ...(ann ? { shagi: ann({} as never, variant.params).shagi ?? [] } : {}),
      }),
    });
    // Числа ступеньки стоят на рисунке — это и есть данные условия.
    tekstDlyaProverki = `${uslovie} ${s.chisla.join(' ')}`;
  } else {
    sb = sobratScenariy(r, {
      id,
      alt,
      ...(ann ? { dobavki: (k) => ann(k, variant.params) } : {}),
    });
  }
  if (!ann) sb.somneniya.push('нет записи прототипа: без вспомогательных построений');
  const oshibki = validirovat(sb.scenariy, { uslovie: tekstDlyaProverki, shagi: sb.shagi });
  /* Вид — расчётом по метрикам читаемости, а не ракурсом по умолчанию. */
  const vid = vybratVid(postroit(sb.scenariy));
  return { ...sb, scenariy: sVidom(sb.scenariy, vid), oshibki, vid };
}

/** Строка списка «на проверку». */
export interface NaProverku {
  id: string;
  nazvanie: string;
  prichiny: string[];
}

/**
 * Список «на проверку»: варианты, где чертёж неоднозначен или
 * сценарий не прошёл валидатор, с пояснением. Повторы причин внутри
 * прототипа сворачиваются: «P03-24, варианты 1–10».
 */
export function spisokNaProverku(): NaProverku[] {
  const out: NaProverku[] = [];
  for (const razdel of RAZDELY) {
    for (const p of razdel.prototipy) {
      if (!estScenariy(p)) continue;
      const prichiny = new Map<string, number[]>();
      for (const v of p.varianty) {
        const ch = chertezhVarianta(p, v);
        if (ch === null) continue;
        const all = [...ch.somneniya, ...ch.oshibki.map((e) => `ошибка: ${e}`)];
        for (const x of all) prichiny.set(x, [...(prichiny.get(x) ?? []), v.n]);
      }
      if (prichiny.size > 0) {
        out.push({
          id: p.id,
          nazvanie: p.nazvanie,
          prichiny: [...prichiny.entries()].map(
            ([x, ns]) =>
              `${x} (${ns.length === p.varianty.length ? 'все варианты' : `варианты ${ns.join(', ')}`})`,
          ),
        });
      }
    }
  }
  return out;
}
