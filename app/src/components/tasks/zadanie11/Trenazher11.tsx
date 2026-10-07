'use client';

import { useEffect, useMemo, useState } from 'react';
import { TRENAZHER_11 } from '@/content/zadanie11';
import { trenazher11 } from '@/lib/zadanie11/progress';
import {
  bankDlya,
  planSessii,
  podtipKlyucha,
  vTrenirovke,
  type Nastroyki,
} from '@/lib/zadanie11/trenazher/sessiya';
import type { DannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import {
  nastroykiSeychas,
  useNastroyki,
  zapisatNastroyki,
} from '@/lib/zadanie11/trenazher/nastroyki';
import type { Zadacha11 } from '@/lib/zadanie11/trenazher/zadacha';
import type { SectionId } from '@/lib/zadanie11/types';
import { Trenazher11Itog, type Otmetka } from './Trenazher11Itog';
import { Trenazher11Reshenie } from './Trenazher11Reshenie';
import { Trenazher11Vybor } from './Trenazher11Vybor';

type Ekran =
  | { vid: 'vybor' }
  | { vid: 'zagruzka' }
  | { vid: 'reshenie'; zadachi: Zadacha11[]; podskazki: boolean }
  | { vid: 'itog'; zadachi: Zadacha11[]; otmetki: Otmetka[] };

/**
 * Вкладка «Тренажёр» №11: выбор задач → решение → итог.
 *
 * Выбор (источник, подтипы, количество, уровень, подсказки) хранится
 * в sessionStorage — на время сессии браузера. Ссылка «Решать» из
 * теории (?tip=ДП-07) отмечает свой подтип. Задачи собираются
 * модулем trenazher/zadacha.ts, который подгружается только при
 * старте: экран выбора движка решений не везёт.
 */
export function Trenazher11({ dannye, base }: { dannye: DannyeTrenazhera; base: string }) {
  const n = useNastroyki();
  const [ekran, setEkran] = useState<Ekran>({ vid: 'vybor' });
  const [oshibka, setOshibka] = useState<string | null>(null);
  const progress = trenazher11.useProgress();
  const vse = useMemo(() => dannye.razdely.flatMap((r) => r.podtipy), [dannye]);
  const nazvaniya = useMemo(
    () =>
      Object.fromEntries(dannye.razdely.map((r) => [r.id, r.nazvanie])) as Record<
        SectionId,
        string
      >,
    [dannye],
  );

  /* Подтипы из ссылки: «Решать» в теории (?tip=DP-07) или маршрут
     урока у репетиторов (?tipy=PR-01,PR-04) — отмечаем только их. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tipy = [q.get('tip') ?? '', ...(q.get('tipy') ?? '').split(',')].filter((id) =>
      vse.some((p) => p.id === id),
    );
    if (tipy.length === 0) {
      return;
    }
    const s = nastroykiSeychas();
    zapisatNastroyki({
      ...s,
      podtipy: tipy,
      uroven: 0,
      istochnik:
        tipy.some((id) => id.startsWith('RZ-')) && s.istochnik === 'bank' ? 'mix' : s.istochnik,
    });
  }, [vse]);

  function izmenit(patch: Partial<Nastroyki>) {
    zapisatNastroyki({ ...nastroykiSeychas(), ...patch });
  }

  const oshibkiPodtipy = useMemo(
    () =>
      [...new Set(progress.mistakes.map(podtipKlyucha))].filter((id) =>
        vse.some((p) => p.id === id),
      ),
    [progress.mistakes, vse],
  );

  async function nachat(nastroyki: Nastroyki) {
    const podtipy = vTrenirovke(nastroyki, vse).map((p) => p.id);
    const plan = planSessii(
      { podtipy, istochnik: nastroyki.istochnik, count: nastroyki.count },
      dannye.bank,
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    );
    if (plan.length === 0) {
      return;
    }
    setOshibka(null);
    setEkran({ vid: 'zagruzka' });
    try {
      const { sobratZadachu } = await import('@/lib/zadanie11/trenazher/zadacha');
      const zadachi = plan.map((p) => sobratZadachu(p, dannye.bank));
      setEkran({ vid: 'reshenie', zadachi, podskazki: nastroyki.podskazki });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setOshibka((e as Error).message);
      setEkran({ vid: 'vybor' });
    }
  }

  if (ekran.vid === 'reshenie') {
    return (
      <Trenazher11Reshenie
        zadachi={ekran.zadachi}
        podskazki={ekran.podskazki}
        ssylki={dannye.ssylki}
        nazvaniya={nazvaniya}
        base={base}
        onNazad={() => setEkran({ vid: 'vybor' })}
        onKonets={(otmetki) => setEkran({ vid: 'itog', zadachi: ekran.zadachi, otmetki })}
      />
    );
  }
  if (ekran.vid === 'itog') {
    const nevernye = [
      ...new Set(ekran.zadachi.filter((_, i) => ekran.otmetki[i] !== 'right').map((z) => z.id)),
    ];
    return (
      <Trenazher11Itog
        zadachi={ekran.zadachi}
        otmetki={ekran.otmetki}
        onEshche={() => setEkran({ vid: 'vybor' })}
        onOshibki={
          nevernye.length === 0
            ? null
            : () => {
                const s = { ...n, podtipy: nevernye, uroven: 0 as const };
                izmenit(s);
                void nachat(s);
              }
        }
      />
    );
  }
  const vBankeVsego = bankDlya(
    vTrenirovke(n, vse).map((p) => p.id),
    dannye.bank,
    n.istochnik,
  ).length;
  return (
    <>
      <Trenazher11Vybor
        razdely={dannye.razdely}
        n={n}
        izmenit={izmenit}
        vBankeVsego={vBankeVsego}
        oshibki={oshibkiPodtipy}
        oshibokZadach={progress.mistakes.length}
        progress={progress}
        zagruzka={ekran.vid === 'zagruzka'}
        onStart={() => void nachat(n)}
      />
      {oshibka === null ? null : (
        <p className="z11-tr__oshibka" role="alert">
          {TRENAZHER_11.neUdalos} {oshibka}
        </p>
      )}
    </>
  );
}
