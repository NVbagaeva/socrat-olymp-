'use client';

import { useEffect, useMemo, useState } from 'react';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { progress1 } from '@/lib/planimetriya/progress';
import type { DannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import {
  nastroykiSeychas,
  useNastroyki,
  zapisatNastroyki,
} from '@/lib/planimetriya/trenazher/nastroyki';
import {
  bankDlya,
  planSessii,
  podtipKlyucha,
  vTrenirovke,
  type Nastroyki,
} from '@/lib/planimetriya/trenazher/sessiya';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { IkonkaBloka1 } from './IkonkaBloka1';
import { Trenazher1Reshenie, Trenazher1Review } from './Trenazher1Reshenie';
import { Trenazher1Vybor } from './Trenazher1Vybor';
import {
  chastTrenirovki,
  isTrenazher1Payload,
  pokhozhiyPlan,
  raspakovat,
  readTrenazher1Ui,
  sobratPlan,
  upakovat,
  type Trenazher1Payload,
  type Trenazher1Ui,
} from './trenazher1Sessiya';

/** Seed плана: у каждой тренировки свой. */
function novyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Вкладка «Тренажёр» №1 — тренажёр №11: выбор задач → решение →
 * итог.
 *
 * Решение и итог ведёт оболочка сессии (components/tasks/session):
 * она сохраняет тренировку и состояние экрана, ведёт паузу и время,
 * завершает тренировку и показывает общий итоговый экран. Ушёл в
 * теорию, перезагрузил страницу — вкладка «Тренажёр» вернёт к той же
 * задаче. Собранные задачи весят мегабайты (чертежи всех шагов),
 * поэтому в хранилище идёт только план с подписью, а задачи
 * собираются заново (trenazher1Sessiya.ts).
 *
 * Выбор хранится на время вкладки браузера (sessionStorage). Ссылка
 * из «Где на ЕГЭ» теории (?tipy=p05) и маршрут урока «Для
 * репетиторов» (?tipy=p01,p05) отмечают свои типы; если при этом
 * есть незавершённая тренировка, оболочка спрашивает, продолжить её
 * или начать новую (entryIntent).
 */
export function Trenazher1({ dannye, base }: { dannye: DannyeTrenazhera1; base: string }) {
  const scope = scopeOfPath(base) ?? '1';
  const n = useNastroyki();
  const [zagruzka, setZagruzka] = useState(false);
  const [oshibka, setOshibka] = useState<string | null>(null);
  /* Пришли по ссылке на типы: читается один раз, в браузере. */
  const [poSsylke] = useState(
    () => typeof window !== 'undefined' && /[?&]tipy=/.test(window.location.search),
  );
  const progress = progress1.useProgress();
  const vse = useMemo(() => dannye.razdely.flatMap((r) => r.podtipy), [dannye]);
  const bloki = useMemo(
    () => Object.fromEntries(vse.map((p) => [p.id, p.section])) as Record<string, string>,
    [vse],
  );
  const kody = useMemo(
    () => Object.fromEntries(vse.map((p) => [p.id, p.kod])) as Record<string, string>,
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

  /* Ученик ответил на вопрос оболочки: ссылка своё сделала, после
     перезагрузки вопрос не повторяется, выбор типов остаётся в
     настройках вкладки. */
  function ubratSsylku() {
    const q = new URLSearchParams(window.location.search);
    q.delete('tipy');
    const rest = q.toString();
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${rest === '' ? '' : `?${rest}`}${window.location.hash}`,
    );
  }

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

  async function nachat(nastroyki: Nastroyki, begin: ConfiguratorApi<Trenazher1Payload>['start']) {
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
      begin(await sobratPlan(plan, nastroyki.podskazki, dannye.bank));
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
    <>
      <TrainerSessionHost<Trenazher1Payload, Trenazher1Ui>
        scope={scope}
        entryIntent={poSsylke}
        onEntryResolved={ubratSsylku}
        what="тренажёр"
        backHref={base}
        isPayload={isTrenazher1Payload}
        count={(payload) => payload.zadachi.length}
        pack={upakovat}
        unpack={(packed) => raspakovat(packed, dannye.bank)}
        describe={(payload, at) => {
          const z = payload.zadachi[at];
          if (z === undefined) {
            throw new Error('Нет задачи');
          }
          return {
            kind: z.title,
            /* Условие с чертежом ученика: без него задачу не узнать. */
            html: `${z.uslovieHtml}<span class="pl-wrap z1-sum__pic">${z.risunokSvg}</span>`,
            /* Решение закрыто отпечатком до итогов: открывается только здесь. */
            review: () => <Trenazher1Review zadacha={z} />,
            icon: <IkonkaBloka1 blok={bloki[z.id] ?? ''} />,
            code: kody[z.id] ?? String(z.proto).padStart(2, '0'),
            badge:
              z.fipi === null
                ? TRENAZHER_1.badge[z.vid]
                : `${TRENAZHER_1.badge[z.vid]} · ${TRENAZHER_1.fipi(z.fipi)}`,
          };
        }}
        subset={chastTrenirovki}
        similar={async (payload, at) => {
          try {
            const plan = pokhozhiyPlan(payload, at, dannye.bank, novyySeed());
            return plan.length === 0
              ? null
              : await sobratPlan(plan, payload.podskazki, dannye.bank);
          } catch {
            return null;
          }
        }}
        configurator={(api) => (
          <>
            <Trenazher1Vybor
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
                {TRENAZHER_1.neUdalos} {oshibka}
              </p>
            )}
          </>
        )}
        screen={({ payload, restored, report, elapsed, finish, setBeforeFinish }) => (
          <Trenazher1Reshenie
            zadachi={payload.zadachi}
            podskazki={payload.podskazki}
            razdely={dannye.razdely}
            ssylki={dannye.ssylki}
            base={base}
            restored={restored === null ? null : readTrenazher1Ui(restored)}
            report={report}
            elapsed={elapsed}
            setBeforeFinish={setBeforeFinish}
            onKonets={finish}
          />
        )}
      />
    </>
  );
}
