'use client';

import { useMemo } from 'react';
import { Trenazher } from '@/components/trenazher/Trenazher';
import type { SsylkiTipa } from '@/components/trenazher/types';
import { isRecord } from '@/lib/trainerSession/restore';
import type { TrenPayload } from '@/lib/trenazher/sessiya';
import type { TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import { trenazher13 } from '@/lib/zadanie13/progress';
import type { TypeCode } from '@/lib/zadanie13/types';
import { kartochka13, SSYLKI_13 } from './Zadacha13';

/**
 * Тренировка, начатая прежним экраном №13 (до фильтров): план
 * «прототип, seed, вид» становится заданиями с теми же ключами,
 * «Определи тип» и «С оформлением» — полями раздела.
 */
function perenos13(packed: unknown): TrenPayload | null {
  if (!isRecord(packed) || !Array.isArray(packed['zadachi'])) return null;
  const zadachi = (packed['zadachi'] as unknown[]).filter(
    (z): z is [string, string, string, string, string] =>
      Array.isArray(z) && typeof z[0] === 'string' && typeof z[1] === 'string',
  );
  if (zadachi.length === 0) return null;
  const tip = zadachi.some((z) => z[3] === 'tip');
  const dop: Record<string, string> = {
    ...(tip ? { zadanie: 'tip' } : {}),
    ...(!tip && packed['rezhim'] === 'oformlenie' ? { oformlenie: 'oformlenie' } : {}),
  };
  return {
    v: 1,
    filtr: '',
    rezhim: 'podskazki',
    seed: 'perenos',
    items: zadachi.map(([id, seed]) => ({ k: `${id}|${seed}` })),
    ...(Object.keys(dop).length === 0 ? {} : { dop }),
  };
}

export interface Trenazher13Props {
  /** Конфиг фильтров и список задач — собраны на сборке (названия с формулами в KaTeX). */
  config: TrenazherConfig;
  refs: ZadachaRef[];
  base: string;
}

/**
 * Вкладка «Тренажёр» №13 на общей панели фильтров: схемы A–D —
 * темы, прототипы — чипы, ★ базовый и ★★ повышенный уровень,
 * открытый банк ФИПИ или свои прототипы; поля раздела — «Определить
 * схему» и «С оформлением». Ссылка урока у репетиторов (?t=A)
 * открывает тренажёр со схемой урока.
 */
export function Trenazher13({ config, refs, base }: Trenazher13Props) {
  const kartochka = useMemo(() => kartochka13(base), [base]);
  const ssylki = useMemo(() => {
    const out: Record<string, SsylkiTipa> = {};
    for (const tema of config.temy) {
      const s = SSYLKI_13[tema.id as TypeCode];
      if (s === undefined) continue;
      for (const p of tema.podtipy) {
        out[p.id] = {
          teoriya: `${base}/teoriya/#${s.teoriya}`,
          opornye: `${base}/opornye-zadachi/${s.opornyy}/`,
        };
      }
    }
    return out;
  }, [config, base]);
  const progress = trenazher13.useProgress();
  const stat = useMemo(
    () => ({
      resheno: new Set(
        Object.entries(progress.outcomes).flatMap(([k, v]) => (v === 'right' ? [k] : [])),
      ),
      oshibki: new Set(progress.mistakes),
    }),
    [progress],
  );
  return (
    <Trenazher
      config={config}
      refs={refs}
      kartochka={kartochka}
      stat={stat}
      backHref={base}
      ssylki={ssylki}
      perenos={perenos13}
    />
  );
}
