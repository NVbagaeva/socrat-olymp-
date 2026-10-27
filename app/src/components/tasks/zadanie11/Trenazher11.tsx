'use client';

import { useMemo } from 'react';
import { Trenazher } from '@/components/trenazher/Trenazher';
import type { SsylkiTipa } from '@/components/trenazher/types';
import { trenazher11 } from '@/lib/zadanie11/progress';
import type { DannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import { klyuchNovoy, trenazherConfig11, zadachi11 } from '@/lib/zadanie11/trenazher/filtry11';
import { isRecord } from '@/lib/trainerSession/restore';
import type { TrenPayload } from '@/lib/trenazher/sessiya';
import type { SectionId } from '@/lib/zadanie11/types';
import { kartochka11 } from './Zadacha11';

/**
 * Тренировка, начатая прежним экраном №11 (до фильтров): план
 * «вид, подтип, номер или seed» становится заданиями с теми же
 * ключами — задачи собираются те же, отметки остаются на местах.
 */
function perenos11(packed: unknown): TrenPayload | null {
  if (!isRecord(packed) || !Array.isArray(packed['zadachi'])) return null;
  const items = (packed['zadachi'] as unknown[]).flatMap((z) => {
    if (!Array.isArray(z) || typeof z[1] !== 'string') return [];
    const [vid, id, otkuda] = z as [unknown, string, unknown];
    if (vid === 'new' && typeof otkuda === 'string') return [{ k: klyuchNovoy(id), seed: otkuda }];
    const bukva = vid === 'bank' ? 'b' : vid === 'razminka' ? 'r' : vid === 'analog' ? 'a' : null;
    return bukva === null || typeof otkuda !== 'number' ? [] : [{ k: `${id}|${bukva}${otkuda}` }];
  });
  if (items.length === 0) return null;
  return {
    v: 1,
    filtr: '',
    rezhim: packed['podskazki'] === false ? 'bez' : 'podskazki',
    seed: 'perenos',
    items,
  };
}

/**
 * Вкладка «Тренажёр» №11 на общей панели фильтров: разделы — темы,
 * подтипы — чипы, ★–★★★, открытый банк или нет. Ссылки «Решать» из
 * теории (?tip=ДП-07) и маршруты урока (?tipy=…) открывают тренажёр
 * с этими подтипами. Статистика — хранилище тренажёра №11.
 */
export function Trenazher11({ dannye, base }: { dannye: DannyeTrenazhera; base: string }) {
  const config = useMemo(() => trenazherConfig11(dannye), [dannye]);
  const refs = useMemo(() => zadachi11(dannye), [dannye]);
  const kartochka = useMemo(
    () =>
      kartochka11({
        bank: dannye.bank,
        ssylki: dannye.ssylki,
        nazvaniya: Object.fromEntries(dannye.razdely.map((r) => [r.id, r.nazvanie])) as Record<
          SectionId,
          string
        >,
        base,
      }),
    [dannye, base],
  );
  const ssylki = useMemo(() => {
    const out: Record<string, SsylkiTipa> = {};
    for (const r of dannye.razdely) {
      const s = dannye.ssylki[r.id];
      for (const p of r.podtipy) {
        const yakor = s.podtipy[p.id] ?? s.teoriya;
        out[p.id] = {
          ...(yakor === '' ? {} : { teoriya: `${base}/teoriya/#${yakor}` }),
          ...(s.opornyy === null ? {} : { opornye: `${base}/opornye-zadachi/${s.opornyy.slug}/` }),
        };
      }
    }
    return out;
  }, [dannye, base]);
  const progress = trenazher11.useProgress();
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
      perenos={perenos11}
    />
  );
}
