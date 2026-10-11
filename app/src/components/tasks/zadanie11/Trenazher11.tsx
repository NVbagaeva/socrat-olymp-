'use client';

import { useEffect, useMemo, useState } from 'react';
import { scopeOfPath } from '@/lib/trainerSession/scope';
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
import type { SectionId } from '@/lib/zadanie11/types';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { Trenazher11Review, Trenazher11Reshenie } from './Trenazher11Reshenie';
import { Trenazher11Vybor } from './Trenazher11Vybor';
import {
  isTrenazher11Payload,
  readTrenazher11Ui,
  type Trenazher11Payload,
  type Trenazher11Ui,
} from './trenazher11Sessiya';

/** Seed плана: у каждой тренировки свой. */
function novyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Вкладка «Тренажёр» №11: выбор задач → решение → итог.
 *
 * Решение и итог ведёт оболочка сессии (components/tasks/session):
 * она сохраняет собранные задачи и состояние экрана, ведёт паузу
 * и время и показывает общий итоговый экран.
 *
 * Выбор (источник, подтипы, количество, уровень, подсказки) хранится
 * в sessionStorage — на время сессии браузера. Ссылка «Решать» из
 * теории (?tip=ДП-07) отмечает свой подтип. Задачи собираются
 * модулем trenazher/zadacha.ts, который подгружается только при
 * старте: экран выбора движка решений не везёт.
 */
export function Trenazher11({ dannye, base }: { dannye: DannyeTrenazhera; base: string }) {
  const n = useNastroyki();
  const [zagruzka, setZagruzka] = useState(false);
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

  async function nachat(nastroyki: Nastroyki, begin: ConfiguratorApi<Trenazher11Payload>['start']) {
    const podtipy = vTrenirovke(nastroyki, vse).map((p) => p.id);
    const plan = planSessii(
      { podtipy, istochnik: nastroyki.istochnik, count: nastroyki.count },
      dannye.bank,
      novyySeed(),
    );
    if (plan.length === 0) {
      return;
    }
    setOshibka(null);
    setZagruzka(true);
    try {
      const { sobratZadachu } = await import('@/lib/zadanie11/trenazher/zadacha');
      const zadachi = plan.map((p) => sobratZadachu(p, dannye.bank));
      /* Оболочка сохранит задачи целиком и вернёт ученика в них
         при любом заходе, пока тренировка не завершена. */
      begin({ zadachi, podskazki: nastroyki.podskazki });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setOshibka((e as Error).message);
    } finally {
      setZagruzka(false);
    }
  }

  const vBankeVsego = bankDlya(
    vTrenirovke(n, vse).map((p) => p.id),
    dannye.bank,
    n.istochnik,
  ).length;
  return (
    <TrainerSessionHost<Trenazher11Payload, Trenazher11Ui>
      scope={scopeOfPath(base) ?? '11'}
      what="тренажёр"
      backHref={base}
      isPayload={isTrenazher11Payload}
      count={(payload) => payload.zadachi.length}
      describe={(payload, at) => {
        const z = payload.zadachi[at];
        if (z === undefined) {
          throw new Error('Нет задачи');
        }
        return {
          kind: z.title,
          html: z.uslovieHtml,
          /* Решение закрыто отпечатком до итогов: открывается только здесь. */
          review: () => <Trenazher11Review zadacha={z} />,
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        zadachi: indexes.flatMap((at) => payload.zadachi[at] ?? []),
      })}
      configurator={(api) => (
        <>
          <Trenazher11Vybor
            razdely={dannye.razdely}
            n={n}
            izmenit={izmenit}
            vBankeVsego={vBankeVsego}
            oshibki={oshibkiPodtipy}
            oshibokZadach={progress.mistakes.length}
            progress={progress}
            zagruzka={zagruzka}
            onStart={() => void nachat(n, api.start)}
          />
          {oshibka === null ? null : (
            <p className="z11-tr__oshibka" role="alert">
              {TRENAZHER_11.neUdalos} {oshibka}
            </p>
          )}
        </>
      )}
      screen={({ payload, restored, report, elapsed, finish }) => (
        <Trenazher11Reshenie
          zadachi={payload.zadachi}
          podskazki={payload.podskazki}
          ssylki={dannye.ssylki}
          nazvaniya={nazvaniya}
          base={base}
          restored={restored === null ? null : readTrenazher11Ui(restored)}
          report={report}
          elapsed={elapsed}
          onKonets={finish}
        />
      )}
    />
  );
}
