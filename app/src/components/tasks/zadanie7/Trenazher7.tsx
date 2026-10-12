'use client';

import { useEffect, useState } from 'react';
import { TRENAZHER_7 } from '@/content/zadanie7';
import { typeset } from '@/lib/tex';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { zagruzitIndeks, zagruzitZadachi } from '@/lib/zadanie7/dannye';
import type { ProtoInfo7 } from '@/lib/zadanie7/protoInfo';
import {
  nastroykiSeychas,
  planTrenirovki,
  useNastroyki7,
  zapisatNastroyki,
  type Nastroyki7,
} from '@/lib/zadanie7/trenazher';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { metkaZadachi, Reshenie7, Review7 } from './Reshenie7';
import {
  isTrenazher7Payload,
  readTrenazher7Ui,
  type Trenazher7Payload,
  type Trenazher7Ui,
} from './trenazher7Sessiya';
import { Vybor7 } from './Vybor7';

const T = TRENAZHER_7;

/** Задачи плана по id (тексты и параметры из public/data/zadanie7). */
async function zadachiPlana(plan: string[], tipy: string[]): Promise<Trenazher7Payload | null> {
  const vse = await zagruzitZadachi(tipy);
  const zadachi = plan.flatMap((id) => vse.get(id) ?? []);
  return zadachi.length > 0 ? { zadachi } : null;
}

/**
 * Вкладка «Тренажёр» №7: выбор → решение → итог.
 *
 * Решение и итог ведёт общая оболочка сессии (components/tasks/session):
 * сохраняет тренировку и состояние экрана, ведёт паузу и время, даёт
 * общий экран итогов с «Прорешать те же» и «Похожие задачи»; при
 * переходе между вкладками раздела тренировка не сбрасывается. Ссылка
 * из теории и «О задании» (?tipy=P11) отмечает свои прототипы.
 */
export function Trenazher7({
  prototipy,
  gruppy,
  base,
}: {
  prototipy: ProtoInfo7[];
  gruppy: { id: string; title: string }[];
  base: string;
}) {
  const n = useNastroyki7();
  const [zagruzka, setZagruzka] = useState(false);
  const [oshibka, setOshibka] = useState<string | null>(null);

  /* Пришли по ссылке на прототипы: при незавершённой тренировке
     оболочка спросит, продолжить её или начать новую по ссылке. */
  const [poSsylke] = useState(
    () => typeof window !== 'undefined' && /[?&]tipy=/.test(window.location.search),
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tipy = (q.get('tipy') ?? '')
      .split(',')
      .filter((id) => prototipy.some((p) => p.id === id));
    if (tipy.length > 0) {
      zapisatNastroyki({ ...nastroykiSeychas(), tipy });
    }
  }, [prototipy]);

  function izmenit(patch: Partial<Nastroyki7>) {
    zapisatNastroyki({ ...nastroykiSeychas(), ...patch });
  }

  async function nachat(begin: ConfiguratorApi<Trenazher7Payload>['start']) {
    setOshibka(null);
    setZagruzka(true);
    try {
      const indeks = await zagruzitIndeks();
      const plan = planTrenirovki(indeks, n);
      const payload = plan.length === 0 ? null : await zadachiPlana(plan, n.tipy);
      if (payload === null) {
        setOshibka(T.netZadach);
        return;
      }
      begin(payload);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setOshibka(`${T.neUdalos} ${(e as Error).message}`);
    } finally {
      setZagruzka(false);
    }
  }

  /** «Похожие задачи»: новые задачи тех же прототипов, где были ошибки. */
  async function pohozhie(
    payload: Trenazher7Payload,
    indexes: readonly number[],
  ): Promise<Trenazher7Payload | null> {
    const tipy = [...new Set(indexes.flatMap((at) => payload.zadachi[at]?.prototypeId ?? []))];
    if (tipy.length === 0) {
      return null;
    }
    try {
      const indeks = await zagruzitIndeks();
      const byli = new Set(payload.zadachi.map((z) => z.id));
      const plan = planTrenirovki(
        indeks,
        { istochnik: 'mix', tipy, skolko: indexes.length },
        Math.random,
        byli,
      );
      return plan.length === 0 ? null : await zadachiPlana(plan, tipy);
    } catch {
      return null;
    }
  }

  return (
    <TrainerSessionHost<Trenazher7Payload, Trenazher7Ui>
      scope={scopeOfPath(base) ?? '7'}
      entryIntent={poSsylke}
      onEntryResolved={() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('tipy');
        window.history.replaceState(window.history.state, '', url);
      }}
      what="тренажёр"
      backHref={base}
      isPayload={isTrenazher7Payload}
      count={(payload) => payload.zadachi.length}
      describe={(payload, at) => {
        const z = payload.zadachi[at];
        if (z === undefined) {
          throw new Error('Нет задачи');
        }
        const p = prototipy.find((x) => x.id === z.prototypeId);
        return {
          kind: p ? `${p.kod}` : z.prototypeId,
          html: typeset(z.text),
          code: p?.kod ?? z.prototypeId,
          badge: metkaZadachi(z),
          review: () => <Review7 z={z} />,
        };
      }}
      subset={(payload, indexes) => ({
        zadachi: indexes.flatMap((at) => payload.zadachi[at] ?? []),
      })}
      similar={pohozhie}
      summary={{ hintedLabel: T.hinted }}
      configurator={(api) => (
        <>
          <Vybor7
            prototipy={prototipy}
            gruppy={gruppy}
            n={n}
            izmenit={izmenit}
            zagruzka={zagruzka}
            onStart={() => void nachat(api.start)}
          />
          {oshibka === null ? null : (
            <p className="z7-tr__oshibka" role="alert">
              {oshibka}
            </p>
          )}
        </>
      )}
      screen={({ payload, restored, report, elapsed, finish }) => (
        <Reshenie7
          zadachi={payload.zadachi}
          prototipy={prototipy}
          base={base}
          restored={restored === null ? null : readTrenazher7Ui(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
        />
      )}
    />
  );
}
