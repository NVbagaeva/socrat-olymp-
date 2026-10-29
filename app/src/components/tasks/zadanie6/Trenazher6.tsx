'use client';

import { useEffect, useState } from 'react';
import { TRENAZHER_6 } from '@/content/zadanie6';
import { typeset } from '@/lib/tex';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { zagruzitIndeks, zagruzitZadachi } from '@/lib/zadanie6/dannye';
import type { ProtoInfo6 } from '@/lib/zadanie6/protoInfo';
import {
  nastroykiSeychas,
  planTrenirovki,
  useNastroyki6,
  zapisatNastroyki,
  type Nastroyki6,
} from '@/lib/zadanie6/trenazher';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { metkaZadachi, Reshenie6, Review6 } from './Reshenie6';
import {
  isTrenazher6Payload,
  readTrenazher6Ui,
  type Trenazher6Payload,
  type Trenazher6Ui,
} from './trenazher6Sessiya';
import { Vybor6 } from './Vybor6';
import './trenazher6.css';

const T = TRENAZHER_6;

/** Задачи плана по id (тексты и параметры из public/data/zadanie6). */
async function zadachiPlana(
  plan: string[],
  tipy: string[],
  rezhim: Nastroyki6['rezhim'],
): Promise<Trenazher6Payload | null> {
  const vse = await zagruzitZadachi(tipy);
  const zadachi = plan.flatMap((id) => vse.get(id) ?? []);
  if (zadachi.length === 0) {
    return null;
  }
  return rezhim === 'proverka' ? { zadachi, rezhim } : { zadachi };
}

/**
 * Вкладка «Тренажёр» №6: выбор → решение → итог.
 *
 * Решение и итог ведёт общая оболочка сессии (components/tasks/session):
 * сохраняет тренировку и состояние экрана, ведёт паузу и время, даёт
 * общий экран итогов с «Прорешать те же» и «Похожие задачи»; при
 * переходе между вкладками раздела тренировка не сбрасывается. Ссылка
 * из теории и «О задании» (?tipy=P11) отмечает свои прототипы.
 */
export function Trenazher6({
  prototipy,
  gruppy,
  base,
}: {
  prototipy: ProtoInfo6[];
  gruppy: { id: string; title: string }[];
  base: string;
}) {
  const n = useNastroyki6();
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

  function izmenit(patch: Partial<Nastroyki6>) {
    zapisatNastroyki({ ...nastroykiSeychas(), ...patch });
  }

  async function nachat(begin: ConfiguratorApi<Trenazher6Payload>['start']) {
    setOshibka(null);
    setZagruzka(true);
    try {
      const indeks = await zagruzitIndeks();
      const plan = planTrenirovki(indeks, n);
      const payload = plan.length === 0 ? null : await zadachiPlana(plan, n.tipy, n.rezhim);
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
    payload: Trenazher6Payload,
    indexes: readonly number[],
  ): Promise<Trenazher6Payload | null> {
    const tipy = [...new Set(indexes.flatMap((at) => payload.zadachi[at]?.prototypeId ?? []))];
    if (tipy.length === 0) {
      return null;
    }
    try {
      const indeks = await zagruzitIndeks();
      const byli = new Set(payload.zadachi.map((z) => z.id));
      const plan = planTrenirovki(
        indeks,
        { istochnik: 'mix', stil: 'vse', tipy, skolko: indexes.length },
        Math.random,
        byli,
      );
      return plan.length === 0
        ? null
        : await zadachiPlana(plan, tipy, payload.rezhim ?? 'trenirovka');
    } catch {
      return null;
    }
  }

  return (
    <TrainerSessionHost<Trenazher6Payload, Trenazher6Ui>
      scope={scopeOfPath(base) ?? '6'}
      entryIntent={poSsylke}
      onEntryResolved={() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('tipy');
        window.history.replaceState(window.history.state, '', url);
      }}
      what="тренажёр"
      backHref={base}
      isPayload={isTrenazher6Payload}
      count={(payload) => payload.zadachi.length}
      describe={(payload, at) => {
        const z = payload.zadachi[at];
        if (z === undefined) {
          throw new Error('Нет задачи');
        }
        const p = prototipy.find((x) => x.id === z.prototypeId);
        return {
          /* Название прототипа: код рядом стоит отдельной меткой. */
          kind: p ? p.title : z.prototypeId,
          html: typeset(z.text),
          code: p?.kod ?? z.prototypeId,
          badge: metkaZadachi(z),
          review: () => <Review6 z={z} />,
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        zadachi: indexes.flatMap((at) => payload.zadachi[at] ?? []),
      })}
      similar={pohozhie}
      summary={{ hintedLabel: T.hinted }}
      configurator={(api) => (
        <>
          <Vybor6
            prototipy={prototipy}
            gruppy={gruppy}
            n={n}
            izmenit={izmenit}
            zagruzka={zagruzka}
            onStart={() => void nachat(api.start)}
          />
          {oshibka === null ? null : (
            <p className="z6-tr__oshibka" role="alert">
              {oshibka}
            </p>
          )}
        </>
      )}
      screen={({ payload, restored, report, elapsed, finish, setBeforeFinish }) => (
        <Reshenie6
          zadachi={payload.zadachi}
          prototipy={prototipy}
          base={base}
          rezhim={payload.rezhim}
          restored={restored === null ? null : readTrenazher6Ui(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
          setBeforeFinish={setBeforeFinish}
        />
      )}
    />
  );
}
