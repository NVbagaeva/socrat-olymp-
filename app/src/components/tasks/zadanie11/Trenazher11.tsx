'use client';

import { useEffect, useMemo, useState } from 'react';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { TRENAZHER_11 } from '@/content/zadanie11';
import { kodNaSayte } from '@/lib/zadanie11/kod';
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
import { IkonkaRazdela } from './Piktogrammy';
import { Trenazher11Review, Trenazher11Reshenie } from './Trenazher11Reshenie';
import { Trenazher11Vybor } from './Trenazher11Vybor';
import {
  isTrenazher11Payload,
  raspakovat11,
  readTrenazher11Ui,
  upakovat11,
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
 * она сохраняет тренировку и состояние экрана, ведёт паузу и время и
 * показывает общий итоговый экран. В хранилище идёт план задач с
 * подписями (trenazher11Sessiya.ts), при возвращении задачи собираются
 * заново по банку страницы.
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

  /* Пришли по ссылке на подтипы (?tip= / ?tipy=): при незавершённой
     тренировке оболочка спросит, продолжить её или начать новую по
     ссылке. Адрес читается один раз, в браузере; разметку это не меняет. */
  const [poSsylke] = useState(
    () => typeof window !== 'undefined' && /[?&]tipy?=/.test(window.location.search),
  );

  /* Подтипы из ссылки: «Решать» в теории (?tip=DP-07), маршрут урока
     у репетиторов или раздел с «О задании» (?tipy=PR-01,PR-04) —
     отмечаем только их. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tipy = [q.get('tip') ?? '', ...(q.get('tipy') ?? '').split(',')].filter((id) =>
      vse.some((p) => p.id === id),
    );
    if (tipy.length === 0) {
      return;
    }
    const s = nastroykiSeychas();
    /* «Проверить себя» на «О задании»: вариант из 8 задач (?n=8). */
    const n = Number(q.get('n'));
    zapisatNastroyki({
      ...s,
      podtipy: tipy,
      uroven: 0,
      count: Number.isInteger(n) && n >= 1 && n <= 50 ? n : s.count,
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

  /**
   * Собрать тренировку по выбору: план, затем задачи. Движок решений
   * подгружается здесь, по требованию. Пустой план — null.
   */
  async function sobrat(nastroyki: Nastroyki): Promise<Trenazher11Payload | null> {
    const podtipy = vTrenirovke(nastroyki, vse).map((p) => p.id);
    const plan = planSessii(
      { podtipy, istochnik: nastroyki.istochnik, count: nastroyki.count },
      dannye.bank,
      novyySeed(),
    );
    if (plan.length === 0) {
      return null;
    }
    const { sobratZadachu } = await import('@/lib/zadanie11/trenazher/zadacha');
    return {
      zadachi: plan.map((p) => sobratZadachu(p, dannye.bank)),
      podskazki: nastroyki.podskazki,
    };
  }

  async function nachat(nastroyki: Nastroyki, begin: ConfiguratorApi<Trenazher11Payload>['start']) {
    setOshibka(null);
    setZagruzka(true);
    try {
      const payload = await sobrat(nastroyki);
      if (payload === null) {
        return;
      }
      begin(payload);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setOshibka((e as Error).message);
    } finally {
      setZagruzka(false);
    }
  }

  /**
   * «Похожие задачи» — как прежняя кнопка «ошибки» на итогах: новые
   * задачи тех же подтипов, где были ошибки, с прежним источником.
   * Задач столько же, сколько ошибок, — как обещает подпись кнопки
   * «Похожие задачи (N)». Выбор подтипов запоминается, как при ручном.
   */
  async function pohozhie(
    payload: Trenazher11Payload,
    indexes: readonly number[],
  ): Promise<Trenazher11Payload | null> {
    const podtipy = [...new Set(indexes.flatMap((at) => payload.zadachi[at]?.id ?? []))];
    if (podtipy.length === 0) {
      return null;
    }
    const s: Nastroyki = { ...nastroykiSeychas(), podtipy, uroven: 0 };
    izmenit(s);
    try {
      return await sobrat({ ...s, count: indexes.length });
    } catch {
      return null;
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
      entryIntent={poSsylke}
      onEntryResolved={() => {
        /* Ответ дан — ссылка своё сделала, вопрос после перезагрузки не нужен. */
        const url = new URL(window.location.href);
        url.searchParams.delete('tip');
        url.searchParams.delete('tipy');
        window.history.replaceState(window.history.state, '', url);
      }}
      what="тренажёр"
      backHref={base}
      isPayload={isTrenazher11Payload}
      pack={upakovat11}
      unpack={(packed) => raspakovat11(packed, dannye.bank)}
      count={(payload) => payload.zadachi.length}
      describe={(payload, at) => {
        const z = payload.zadachi[at];
        if (z === undefined) {
          throw new Error('Нет задачи');
        }
        return {
          kind: z.title,
          html: z.uslovieHtml,
          icon: <IkonkaRazdela section={z.section} />,
          code: kodNaSayte(z.id),
          badge: TRENAZHER_11.badge[z.vid],
          /* Решение закрыто отпечатком до итогов: открывается только здесь. */
          review: () => <Trenazher11Review zadacha={z} />,
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        zadachi: indexes.flatMap((at) => payload.zadachi[at] ?? []),
      })}
      similar={pohozhie}
      configurator={(api) => (
        <>
          <Trenazher11Vybor
            razdely={dannye.razdely}
            ssylki={dannye.ssylki}
            base={base}
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
