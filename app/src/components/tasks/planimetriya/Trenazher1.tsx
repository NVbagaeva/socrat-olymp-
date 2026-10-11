'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { progress1 } from '@/lib/planimetriya/progress';
import type { DannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import {
  nastroykiSeychas,
  useNastroyki,
  zapisatNastroyki,
} from '@/lib/planimetriya/trenazher/nastroyki';
import {
  steretPauzu,
  usePauza,
  zapomnitPauzu,
  type Otmetka,
  type Pauza,
} from '@/lib/planimetriya/trenazher/pauza';
import {
  bankDlya,
  planSessii,
  podtipKlyucha,
  vTrenirovke,
  type Nastroyki,
  type ZadachaPlan,
} from '@/lib/planimetriya/trenazher/sessiya';
import type { Zadacha1 } from '@/lib/planimetriya/trenazher/zadacha';
import { Trenazher1Itog } from './Trenazher1Itog';
import { Trenazher1Reshenie } from './Trenazher1Reshenie';
import { Trenazher1Vybor } from './Trenazher1Vybor';

type Ekran =
  | { vid: 'vybor' }
  | { vid: 'zagruzka' }
  | {
      vid: 'reshenie';
      plan: ZadachaPlan[];
      zadachi: Zadacha1[];
      podskazki: boolean;
      index: number;
      otmetki: (Otmetka | null)[];
      nachato: number;
    }
  | { vid: 'itog'; zadachi: Zadacha1[]; otmetki: Otmetka[] };

/** Задачи плана: модуль движка подгружается только здесь. */
async function sobrat(plan: ZadachaPlan[], d: DannyeTrenazhera1): Promise<Zadacha1[]> {
  const { sobratZadachu } = await import('@/lib/planimetriya/trenazher/zadacha');
  return plan.map((p) => sobratZadachu(p, d.bank));
}

/**
 * Вкладка «Тренажёр» №1 — тренажёр №11: выбор задач → решение →
 * итог. Выбор хранится на время вкладки браузера (sessionStorage);
 * ссылка из «Для репетиторов» (?tipy=p01,p05) отмечает свои типы.
 *
 * Начатая тренировка сохраняется (trenazher/pauza.ts): «Поставить на
 * паузу» уводит к выбору, плашка «Тренировка на паузе» возвращает к
 * той же задаче — и после перезагрузки страницы. «Завершить
 * тренировку» подводит итог в любой момент.
 */
export function Trenazher1({ dannye, base }: { dannye: DannyeTrenazhera1; base: string }) {
  const n = useNastroyki();
  const pauza = usePauza();
  const [ekran, setEkran] = useState<Ekran>({ vid: 'vybor' });
  const [oshibka, setOshibka] = useState<string | null>(null);
  const progress = progress1.useProgress();
  const vse = useMemo(() => dannye.razdely.flatMap((r) => r.podtipy), [dannye]);
  const bloki = useMemo(
    () => Object.fromEntries(vse.map((p) => [p.id, p.section])) as Record<string, string>,
    [vse],
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tipy = (q.get('tipy') ?? '').split(',').filter((id) => vse.some((p) => p.id === id));
    if (tipy.length === 0) {
      return;
    }
    const s = nastroykiSeychas();
    const bezBanka = tipy.some((id) => vse.find((p) => p.id === id)?.vBanke === 0);
    zapisatNastroyki({
      ...s,
      podtipy: tipy,
      uroven: 0,
      istochnik: bezBanka && s.istochnik === 'bank' ? 'mix' : s.istochnik,
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

  async function zapustit(p: Pauza) {
    setOshibka(null);
    setEkran({ vid: 'zagruzka' });
    try {
      const zadachi = await sobrat(p.plan, dannye);
      setEkran({
        vid: 'reshenie',
        plan: p.plan,
        zadachi,
        podskazki: p.podskazki,
        index: p.index,
        otmetki: p.otmetki,
        nachato: p.nachato,
      });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setOshibka((e as Error).message);
      setEkran({ vid: 'vybor' });
    }
  }

  function nachat(nastroyki: Nastroyki) {
    const podtipy = vTrenirovke(nastroyki, vse).map((p) => p.id);
    const plan = planSessii(
      { podtipy, istochnik: nastroyki.istochnik, count: nastroyki.count },
      dannye.bank,
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    );
    if (plan.length === 0) {
      return;
    }
    const p: Pauza = {
      plan,
      podskazki: nastroyki.podskazki,
      index: 0,
      otmetki: plan.map(() => null),
      nachato: Date.now(),
    };
    zapomnitPauzu(p);
    void zapustit(p);
  }

  /* Завершить тренировку с паузы: итог по сохранённым отметкам. */
  async function zavershitPauzu(p: Pauza) {
    setEkran({ vid: 'zagruzka' });
    try {
      const zadachi = await sobrat(p.plan, dannye);
      steretPauzu();
      setEkran({ vid: 'itog', zadachi, otmetki: p.otmetki.map((o) => o ?? 'wrong') });
    } catch (e) {
      setOshibka((e as Error).message);
      setEkran({ vid: 'vybor' });
    }
  }

  const reshenie = ekran.vid === 'reshenie' ? ekran : null;
  const sokhranit = useCallback(
    (index: number, otmetki: (Otmetka | null)[]) => {
      if (reshenie === null) return;
      zapomnitPauzu({
        plan: reshenie.plan,
        podskazki: reshenie.podskazki,
        index,
        otmetki,
        nachato: reshenie.nachato,
      });
    },
    [reshenie],
  );

  if (reshenie !== null) {
    return (
      <Trenazher1Reshenie
        key={reshenie.nachato}
        zadachi={reshenie.zadachi}
        podskazki={reshenie.podskazki}
        razdely={dannye.razdely}
        ssylki={dannye.ssylki}
        base={base}
        index0={reshenie.index}
        otmetki0={reshenie.otmetki}
        onSostoyanie={sokhranit}
        onPauza={() => {
          setEkran({ vid: 'vybor' });
          window.scrollTo({ top: 0 });
        }}
        onKonets={(otmetki) => {
          steretPauzu();
          setEkran({ vid: 'itog', zadachi: reshenie.zadachi, otmetki });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }
  if (ekran.vid === 'itog') {
    const nevernye = [
      ...new Set(ekran.zadachi.filter((_, i) => ekran.otmetki[i] !== 'right').map((z) => z.id)),
    ];
    return (
      <Trenazher1Itog
        zadachi={ekran.zadachi}
        bloki={bloki}
        otmetki={ekran.otmetki}
        onEshche={() => setEkran({ vid: 'vybor' })}
        onOshibki={
          nevernye.length === 0
            ? null
            : () => {
                const s = { ...n, podtipy: nevernye, uroven: 0 as const };
                izmenit(s);
                nachat(s);
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
      <Trenazher1Vybor
        razdely={dannye.razdely}
        n={n}
        izmenit={izmenit}
        vBankeVsego={vBankeVsego}
        oshibki={oshibkiPodtipy}
        oshibokZadach={progress.mistakes.length}
        progress={progress}
        zagruzka={ekran.vid === 'zagruzka'}
        onStart={() => nachat(n)}
        pauza={pauza}
        onProdolzhit={() => {
          if (pauza !== null) void zapustit(pauza);
        }}
        onZavershit={() => {
          if (pauza !== null) void zavershitPauzu(pauza);
        }}
      />
      {oshibka === null ? null : (
        <p className="z11-tr__oshibka" role="alert">
          {TRENAZHER_1.neUdalos} {oshibka}
        </p>
      )}
    </>
  );
}
