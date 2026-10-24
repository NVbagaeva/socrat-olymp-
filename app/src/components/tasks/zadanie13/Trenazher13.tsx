'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { TRENAZHER_13 } from '@/content/zadanie13';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { trenazher13 } from '@/lib/zadanie13/progress';
import {
  NASTROYKI_13,
  planTrenirovki13,
  prototipKlyucha13,
  prototipyDlya,
  type Nastroyki13,
  type ProtoPlan,
} from '@/lib/zadanie13/trenazher/plan';
import { TYPE_NAMES } from '@/lib/zadanie13/types';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { Trenazher13Reshenie, Trenazher13Review } from './Trenazher13Reshenie';
import { Trenazher13Vybor } from './Trenazher13Vybor';
import {
  isTrenazher13Payload,
  raspakovat13,
  readTrenazher13Ui,
  upakovat13,
  type Trenazher13Payload,
  type Trenazher13Ui,
} from './trenazher13Sessiya';

const KLYUCH_NASTROEK = 'budetege:zadanie-13:trenazher-vybor:v1';

/* Выбор живёт в sessionStorage; компоненты подписаны на него, как на
   внешнее хранилище: на сервере и при первой отрисовке — выбор по умолчанию. */
const slushateli = new Set<() => void>();

function podpisatsya(cb: () => void): () => void {
  slushateli.add(cb);
  return () => slushateli.delete(cb);
}

function snimok(): string {
  try {
    return window.sessionStorage.getItem(KLYUCH_NASTROEK) ?? '';
  } catch {
    return '';
  }
}

function razobrat(raw: string): Nastroyki13 {
  if (raw === '') return NASTROYKI_13;
  try {
    return { ...NASTROYKI_13, ...(JSON.parse(raw) as Partial<Nastroyki13>) };
  } catch {
    return NASTROYKI_13;
  }
}

function zapomnit(n: Nastroyki13): void {
  try {
    window.sessionStorage.setItem(KLYUCH_NASTROEK, JSON.stringify(n));
  } catch {
    /* Хранилище недоступно — выбор не запомнится. */
  }
  slushateli.forEach((cb) => cb());
}

function novyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Вкладка «Тренажёр» №13: выбор → решение → итог.
 *
 * Решение и итог ведёт оболочка сессии: она сохраняет тренировку и
 * состояние экрана (можно уйти в теорию и вернуться), ведёт паузу,
 * время и «Завершить». В хранилище идёт план — прототип и seed каждой
 * задачи; задачи собирает движок, он подгружается только при старте.
 * Выбор хранится в sessionStorage — на время сессии браузера.
 */
export function Trenazher13({
  protos,
  bank,
  base,
}: {
  protos: ProtoPlan[];
  bank: (readonly [string, string])[];
  base: string;
}) {
  const raw = useSyncExternalStore(podpisatsya, snimok, () => '');
  const n = useMemo(() => razobrat(raw), [raw]);
  const [zagruzka, setZagruzka] = useState(false);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const progress = trenazher13.useProgress();

  function izmenit(patch: Partial<Nastroyki13>) {
    zapomnit({ ...n, ...patch });
  }

  const oshibki = useMemo(
    () => [...new Set(progress.mistakes.map(prototipKlyucha13))],
    [progress.mistakes],
  );
  const oshibokVSheme = prototipyDlya({ ...n, oshibki: true }, protos, oshibki).length;

  async function sobrat(nastroyki: Nastroyki13): Promise<Trenazher13Payload | null> {
    const plan = planTrenirovki13(nastroyki, protos, bank, oshibki, novyySeed());
    if (plan.length === 0) {
      return null;
    }
    const { sobratZadachu13 } = await import('@/lib/zadanie13/trenazher/zadacha');
    return {
      rezhim: nastroyki.chto === 'tip' ? 'otvet' : nastroyki.rezhim,
      zadachi: plan.map((p, i) => sobratZadachu13(p, i + 1)),
    };
  }

  async function nachat(begin: ConfiguratorApi<Trenazher13Payload>['start']) {
    setOshibka(null);
    setZagruzka(true);
    try {
      const payload = await sobrat(n);
      if (payload !== null) {
        begin(payload);
        window.scrollTo({ top: 0 });
      }
    } catch (e) {
      setOshibka((e as Error).message);
    } finally {
      setZagruzka(false);
    }
  }

  /* «Похожие задачи»: новые задачи тех же прототипов, столько же, сколько ошибок. */
  async function pohozhie(
    payload: Trenazher13Payload,
    indexes: readonly number[],
  ): Promise<Trenazher13Payload | null> {
    const ids = [...new Set(indexes.flatMap((at) => payload.zadachi[at]?.prototypeId ?? []))];
    if (ids.length === 0) {
      return null;
    }
    const { sobratZadachu13 } = await import('@/lib/zadanie13/trenazher/zadacha');
    const seed = novyySeed();
    try {
      return {
        rezhim: payload.rezhim,
        zadachi: indexes.map((at, i) => {
          const z = payload.zadachi[at];
          const prototypeId = z?.prototypeId ?? ids[0] ?? '';
          return sobratZadachu13(
            { prototypeId, seed: `n${seed}-${i}`, istochnik: 'new', vid: z?.vid ?? 'zadachi' },
            i + 1,
          );
        }),
      };
    } catch {
      return null;
    }
  }

  return (
    <TrainerSessionHost<Trenazher13Payload, Trenazher13Ui>
      scope={scopeOfPath(base) ?? '13'}
      what="тренажёр"
      backHref={base}
      isPayload={isTrenazher13Payload}
      pack={upakovat13}
      unpack={raspakovat13}
      count={(payload) => payload.zadachi.length}
      describe={(payload, at) => {
        const z = payload.zadachi[at];
        if (z === undefined) {
          throw new Error('Нет задачи');
        }
        return {
          kind: z.vid === 'tip' ? 'Определи тип' : TYPE_NAMES[z.type],
          html: z.uslovieHtml,
          badge: TRENAZHER_13.badge[z.istochnik],
          review: () => <Trenazher13Review zadacha={z} />,
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        zadachi: indexes.flatMap((at) => payload.zadachi[at] ?? []),
      })}
      similar={pohozhie}
      configurator={(api) => (
        <>
          <Trenazher13Vybor
            n={n}
            izmenit={izmenit}
            prototipov={prototipyDlya(n, protos, oshibki).length}
            oshibok={oshibokVSheme}
            zagruzka={zagruzka}
            onStart={() => void nachat(api.start)}
          />
          {oshibka === null ? null : (
            <p className="z13-tr__pusto" role="alert">
              {TRENAZHER_13.neUdalos} {oshibka}
            </p>
          )}
        </>
      )}
      screen={({ payload, restored, report, elapsed, finish }) => (
        <Trenazher13Reshenie
          zadachi={payload.zadachi}
          rezhim={payload.rezhim}
          base={base}
          restored={restored === null ? null : readTrenazher13Ui(restored)}
          report={report}
          elapsed={elapsed}
          onKonets={finish}
        />
      )}
    />
  );
}
