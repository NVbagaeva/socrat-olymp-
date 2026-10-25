'use client';

import { useMemo, useState } from 'react';
import { FiltrPanel } from '@/components/filtry/FiltrPanel';
import { TrainerSessionHost, type ConfiguratorApi } from '@/components/tasks/session';
import { ITOGI } from '@/content/trenazherFiltry';
import { NACHALNYY, estVSsylke, kRazdelu, naydeno, sostav, vSsylku } from '@/lib/trenazher/filtr';
import { useFiltr } from '@/lib/trenazher/zapomnit';
import { randomSeed } from '@/lib/randomSeed';
import {
  isTrenPayload,
  osnovaSeed,
  readTrenUi,
  type TrenPayload,
  type TrenUi,
} from '@/lib/trenazher/sessiya';
import type { Filtr, Statistika, TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import { SOSTOYANIYA, zadachaIzKesha, zagruzitDvizhok } from './sborka';
import { TrenazherEkran } from './TrenazherEkran';
import type { KartochkaRazdela, SsylkiTipa } from './types';
import './trenazher.css';

export interface TrenazherProps<T> {
  config: TrenazherConfig;
  refs: ZadachaRef[];
  kartochka: KartochkaRazdela<T>;
  stat: Statistika;
  /** Фильтр по ярлыку прежнего адреса. null — обычный вход. */
  start?: Filtr | null;
  backHref: string;
  /** Подтип → теория и опорные задачи: ссылки в итогах по типам с ошибками. */
  ssylki?: Record<string, SsylkiTipa>;
  /**
   * Тренировка, начатая прежним экраном тренажёра раздела: перевести
   * её запись в новый формат. null — не переводится (сбросится).
   */
  perenos?: (packed: unknown) => TrenPayload | null;
}

/**
 * Тренажёр раздела на общей панели фильтров. Раздел даёт конфиг,
 * список задач и карточку задачи; фильтры, ссылка, сессия, лента
 * номеров и итоги — здесь, одни на все разделы.
 */
export function Trenazher<T>({
  config,
  refs,
  kartochka: K,
  stat,
  start = null,
  backHref,
  ssylki = {},
  perenos,
}: TrenazherProps<T>) {
  const startF = useMemo(() => kRazdelu(start ?? NACHALNYY, config), [start, config]);
  /* Фильтр: из ссылки, иначе запомненный для раздела, иначе ярлык или
     по умолчанию; каждая правка — в адрес и в память (zapomnit.ts). */
  const [f, setF] = useFiltr(config, startF);
  const [starting, setStarting] = useState(false);

  /* Вход по ссылке с фильтром: при незавершённой тренировке оболочка
     спросит, продолжить её или начать новую по ссылке. */
  const [entryIntent] = useState(
    () =>
      start !== null ||
      (typeof window !== 'undefined' && estVSsylke(new URLSearchParams(window.location.search))),
  );

  const refsByKey = useMemo(() => new Map(refs.map((r) => [r.key, r])), [refs]);
  const tipy = useMemo(
    () =>
      new Map(
        config.temy.flatMap((t) => t.podtipy.map((p) => [p.id, `${p.code} · ${p.title}`] as const)),
      ),
    [config],
  );

  async function nachat(api: ConfiguratorApi<TrenPayload>) {
    if (starting) return;
    setStarting(true);
    try {
      /* Движок грузится по «Начать»: на странице раздела его нет. */
      await zagruzitDvizhok(K);
      const found = naydeno(refs, f, stat);
      const items = sostav(found, f, Math.random).map((r) => ({ k: r.key }));
      if (items.length === 0) return;
      api.start({ v: 1, filtr: vSsylku(f), rezhim: f.rezhim, seed: randomSeed(), items });
    } finally {
      setStarting(false);
    }
  }

  function pohozhayaNa(payload: TrenPayload, at: number): number {
    return SOSTOYANIYA.get(payload)?.[at]?.pohozhaya ?? 0;
  }

  return (
    <TrainerSessionHost<TrenPayload, TrenUi>
      scope={config.scope}
      entryIntent={entryIntent}
      what="тренажёр"
      backHref={backHref}
      isPayload={isTrenPayload}
      unpack={(packed) => (isTrenPayload(packed) ? packed : (perenos?.(packed) ?? null))}
      count={(p) => p.items.length}
      describe={(p, at) => {
        const item = p.items[at];
        const ref = item === undefined ? undefined : refsByKey.get(item.k);
        const task = zadachaIzKesha(K, p, at, pohozhayaNa(p, at));
        return {
          kind: ref === undefined ? '' : (tipy.get(ref.podtip) ?? ref.podtip),
          html: task === null || task === undefined ? '' : K.html(task),
          ...(task === null || task === undefined || !K.estRazbor(task)
            ? {}
            : { review: () => <K.Razbor task={task} /> }),
        };
      }}
      subset={(p, idx) => ({
        ...p,
        items: idx.flatMap((at) => {
          const item = p.items[at];
          return item === undefined
            ? []
            : [{ k: item.k, seed: osnovaSeed(p, at, pohozhayaNa(p, at)) }];
        }),
      })}
      similar={(p, idx) => ({
        ...p,
        seed: randomSeed(),
        items: idx.flatMap((at) => {
          const item = p.items[at];
          return item === undefined ? [] : [{ k: item.k }];
        }),
      })}
      labels={{ summary: { retrySimilar: ITOGI.pererreshat } }}
      summary={{
        extra: (data) => {
          const p = data.payload as TrenPayload;
          const podtipy = new Set<string>();
          for (const it of data.items) {
            if (it.mark === 'wrong' || it.mark === 'hinted') {
              const ref = refsByKey.get(p.items[it.poolIndex]?.k ?? '');
              if (ref !== undefined) podtipy.add(ref.podtip);
            }
          }
          const vremya = p.rezhim === 'vremya' ? SOSTOYANIYA.get(p) : undefined;
          return (
            <>
              {podtipy.size === 0 ? null : (
                <div className="trz-itog">
                  <p className="trz-itog__title">{ITOGI.povtorit}</p>
                  <ul className="trz-itog__list">
                    {[...podtipy].map((id) => {
                      const s = ssylki[id];
                      return (
                        <li key={id}>
                          <span>{tipy.get(id) ?? id}</span>
                          {s?.teoriya === undefined ? null : (
                            <a href={s.teoriya}>{ITOGI.teoriya}</a>
                          )}
                          {s?.opornye === undefined ? null : (
                            <a href={s.opornye}>{ITOGI.opornye}</a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {vremya === undefined ? null : (
                <div className="trz-itog">
                  <p className="trz-itog__title">{ITOGI.vremya}</p>
                  <ol className="trz-itog__time">
                    {p.items.map((_, at) => (
                      <li key={at}>{ITOGI.sek(vremya[at]?.sek ?? 0)}</li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          );
        },
      }}
      configurator={(api) => (
        <FiltrPanel
          config={config}
          refs={refs}
          stat={stat}
          filtr={f}
          onChange={setF}
          onStart={() => void nachat(api)}
          starting={starting}
          pauza={
            api.parked === null
              ? null
              : { resheno: api.parked.solved, vsego: api.parked.total, onResume: api.resume }
          }
          ssylka={() => window.location.href}
        />
      )}
      screen={({ payload, restored, report, elapsed, finish, toFilters }) => (
        <TrenazherEkran
          config={config}
          refs={refsByKey}
          tipy={tipy}
          kartochka={K}
          payload={payload}
          restored={restored === null ? null : readTrenUi(restored)}
          report={report}
          elapsed={elapsed}
          finish={finish}
          toFilters={toFilters}
        />
      )}
    />
  );
}
