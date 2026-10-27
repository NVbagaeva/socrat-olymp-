'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Modal } from '@/components/ui';
import { RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { useSessionReport } from '@/components/tasks/session/useSessionReport';
import { EKRAN, ITOGI, SLOVA_FILTRA } from '@/content/trenazherFiltry';
import { izSsylki, svodka } from '@/lib/trenazher/filtr';
import {
  NOVAYA,
  otmetki,
  statusZadachi,
  type TrenPayload,
  type TrenUi,
  type ZadachaSost,
} from '@/lib/trenazher/sessiya';
import type { TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import { SOSTOYANIYA, useZadacha } from './sborka';
import type { KartochkaRazdela, Shagi } from './types';

export interface TrenazherEkranProps<T> {
  config: TrenazherConfig;
  refs: ReadonlyMap<string, ZadachaRef>;
  /** Подтип → название: подпись типа над задачей. */
  tipy: ReadonlyMap<string, string>;
  kartochka: KartochkaRazdela<T>;
  payload: TrenPayload;
  restored: TrenUi | null;
  report: (ui: TrenUi) => void;
  elapsed: () => number;
  finish: () => void;
  toFilters: () => void;
}

/**
 * Экран тренировки: строка-сводка фильтров, лента номеров со
 * статусами, карточка задачи раздела и действия. По ленте можно
 * перейти к любой задаче: у каждой своё состояние, всё введённое на
 * месте.
 *
 * Режимы: «С подсказками» — подсказка по шагам и вторая попытка, после
 * второй ошибки — разбор; «Без подсказок» — одна попытка, разбор после
 * ответа; «На время» — то же и секундомер на каждую задачу.
 */
export function TrenazherEkran<T>({
  config,
  refs,
  tipy,
  kartochka: K,
  payload,
  restored,
  report,
  elapsed,
  finish,
  toFilters,
}: TrenazherEkranProps<T>) {
  /* Тренировка прежнего экрана хранит свою раскладку: позиция на
     ленте → место в задании. У новой раскладки нет. */
  const [order] = useState<number[] | null>(() => restored?.order ?? null);
  const pool = (at: number) => (order === null ? at : (order[at] ?? at));
  const n = order?.length ?? payload.items.length;
  const [index, setIndex] = useState(() => Math.min(restored?.index ?? 0, n - 1));
  const [z, setZ] = useState<Record<number, ZadachaSost>>(restored?.z ?? {});
  /* Когда открыта текущая задача (мс активного времени): время идёт
     на открытую, ещё не закрытую задачу. */
  const [s, setS] = useState<number | null>(() => restored?.s ?? elapsed());
  const [confirm, setConfirm] = useState(false);
  const labelId = useId();

  const sost = z[index] ?? NOVAYA;
  const item = payload.items[pool(index)];
  const ref = item === undefined ? undefined : refs.get(item.k);
  const zadacha = useZadacha(K, payload, pool(index), sost.pohozhaya);

  const podskazki = payload.rezhim === 'podskazki';
  const zakryta = sost.itog === 'right' || sost.itog === 'wrong' || sost.itog === 'hinted';

  const [, tick] = useState(0);
  useEffect(() => {
    if (payload.rezhim !== 'vremya' || zakryta) return undefined;
    const t = window.setInterval(() => tick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [payload.rezhim, zakryta, index]);

  const { marks, tried } = useMemo(() => otmetki(z), [z]);
  useSessionReport<TrenUi>(report, { index, marks, tried, order, z, s });
  useEffect(() => {
    /* Итогам — по местам в задании, как их нумерует оболочка. */
    SOSTOYANIYA.set(
      payload,
      Object.fromEntries(Object.entries(z).map(([at, st]) => [pool(Number(at)), st])),
    );
    // pool зависит только от order, а он не меняется.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, z]);

  /** Секунды на текущую задачу с учётом идущих. */
  function sekNow(): number {
    return sost.sek + (s === null ? 0 : Math.max(0, (elapsed() - s) / 1000));
  }

  function patch(next: Partial<ZadachaSost>, at = index) {
    setZ((prev) => ({ ...prev, [at]: { ...(prev[at] ?? NOVAYA), ...next } }));
  }

  /** Закрыть задачу: время — в неё, исход — в статистику раздела. */
  function zakryt(itog: 'right' | 'wrong' | 'hinted', extra: Partial<ZadachaSost> = {}) {
    const sek = sekNow();
    patch({ ...extra, itog, sek });
    setS(null);
    if (item !== undefined) {
      K.zapisat(item.k, {
        right: itog === 'right',
        clean: itog === 'right' && sost.oshibok === 0 && (extra.oshibok ?? 0) === 0,
        sek,
      });
    }
  }

  function pereyti(to: number) {
    if (to === index || to < 0 || to >= n) return;
    if (!zakryta && s !== null) {
      patch({ sek: sekNow() });
    }
    const st = z[to]?.itog ?? null;
    setS(st === 'right' || st === 'wrong' || st === 'hinted' ? null : elapsed());
    setIndex(to);
  }

  function proverit() {
    if (zadacha === null || zadacha === undefined) return;
    const right = K.proverit(zadacha, sost.v);
    if (right) {
      /* Ответ после подсказки по шагам — верно, но с подсказкой. */
      zakryt(sost.podskazka ? 'hinted' : 'right', { proverka: 'right' });
      return;
    }
    const oshibok = sost.oshibok + 1;
    if (podskazki && oshibok < 2) {
      patch({ proverka: 'wrong', oshibok });
      return;
    }
    /* Попытки кончились: в режиме с подсказками разбор открывается сам. */
    zakryt('wrong', { proverka: 'wrong', oshibok, razbor: podskazki && K.estRazbor(zadacha) });
  }

  function propustit() {
    if (!zakryta) {
      patch({ itog: 'skipped', sek: sekNow() });
      setS(null);
    }
    sleduyushchaya();
  }

  function pohozhaya() {
    patch({ ...NOVAYA, pohozhaya: sost.pohozhaya + 1, sek: 0 });
    setS(elapsed());
  }

  /** Первая незакрытая задача после текущей (по кругу). -1 — все закрыты. */
  function nezakrytaya(): number {
    for (let k = 1; k <= n; k += 1) {
      const at = (index + k) % n;
      const st = z[at]?.itog ?? null;
      if (st === null || st === 'skipped') return at;
    }
    return -1;
  }

  function sleduyushchaya() {
    if (index < n - 1) {
      pereyti(index + 1);
      return;
    }
    const at = nezakrytaya();
    if (at !== -1 && at !== index) pereyti(at);
  }

  const vseZakryty = Array.from({ length: n }, (_, at) => z[at]?.itog ?? null).every((st, at) =>
    at === index ? zakryta : st !== null && st !== 'skipped',
  );

  const dalshe = (
    <Button
      onClick={() => {
        if (vseZakryty) finish();
        else if (index === n - 1) sleduyushchaya();
        else pereyti(index + 1);
      }}
    >
      {vseZakryty ? EKRAN.itogi : index === n - 1 ? EKRAN.kNereshennoy : EKRAN.dalshe}
    </Button>
  );

  const filtr = useMemo(
    () => izSsylki(new URLSearchParams(payload.filtr), config),
    [payload.filtr, config],
  );
  const stroka = svodka(config, filtr, n, SLOVA_FILTRA);

  const pokazPoyasneniya =
    sost.proverka !== null &&
    K.poyasnenie !== undefined &&
    zadacha !== null &&
    zadacha !== undefined;
  /* Поле ответа: над подсказкой; у раздела, где после шагов ответ
     вводит сам ученик (posleShagov), — и под подсказкой. */
  const posleShagov = K.otvetPosleShagov === true;
  const mozhnoOtvechat = !zakryta && (!sost.podskazka || posleShagov);
  const otvetBlock =
    zadacha === undefined || zadacha === null || (sost.podskazka && !posleShagov) ? null : (
      <div className="trz-answer">
        <p className="trz-label" id={labelId}>
          {EKRAN.otvet}
        </p>
        <K.Otvet
          task={zadacha}
          value={sost.v}
          labelId={labelId}
          proverka={sost.proverka}
          disabled={!mozhnoOtvechat}
          onChange={(v) => patch({ v, ...(sost.proverka === 'wrong' ? { proverka: null } : {}) })}
        />
        {sost.proverka === null ? null : (
          <div className={clsx('trz-verdict', `trz-verdict--${sost.proverka}`)} role="status">
            <p className="trz-verdict__title">
              <span className="trz-verdict__ico">
                {sost.proverka === 'right' ? <RightIcon /> : <WrongIcon />}
              </span>
              {sost.proverka === 'right' ? EKRAN.verno : EKRAN.oshibka}
            </p>
            {pokazPoyasneniya && (podskazki || zakryta) ? (
              <p
                className="trz-verdict__text"
                dangerouslySetInnerHTML={{
                  __html: K.poyasnenie?.(zadacha, sost.v, sost.proverka === 'right') ?? '',
                }}
              />
            ) : null}
            {sost.proverka === 'wrong' && !zakryta ? (
              <p className="trz-verdict__text">{EKRAN.eshchyoRaz}</p>
            ) : null}
            {sost.itog === 'wrong' && sost.razbor ? (
              <p className="trz-verdict__text">{EKRAN.razborPosle}</p>
            ) : null}
          </div>
        )}
      </div>
    );

  return (
    <section className="trz" aria-label={stroka}>
      <div className="trz-svodka">
        <button type="button" className="trz-svodka__text" onClick={() => setConfirm(true)}>
          {stroka}
        </button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
          {EKRAN.kFiltram}
        </Button>
      </div>

      <ol className="trz-lenta" aria-label={EKRAN.lenta}>
        {Array.from({ length: n }, (_, at) => {
          const st = statusZadachi(z[at]);
          return (
            <li key={`${at}-${payload.items[pool(at)]?.k ?? ''}`}>
              <button
                type="button"
                className={clsx('trz-no', `trz-no--${st}`, at === index && 'is-current')}
                aria-current={at === index ? 'step' : undefined}
                aria-label={`${EKRAN.zadacha(at + 1, n)}: ${EKRAN.status[st]}`}
                onClick={() => pereyti(at)}
              >
                {st === 'right' ? <RightIcon /> : st === 'wrong' ? <WrongIcon /> : at + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <article className="trz-card">
        <header className="trz-card__head">
          <p className="trz-card__no">{EKRAN.zadacha(index + 1, n)}</p>
          <p className="trz-card__meta">
            {ref === undefined ? null : (
              <>
                <span className="trz-card__tip">{tipy.get(ref.podtip) ?? ref.podtip}</span>
                <span className="trz-card__src">{EKRAN.istochnik[ref.istochnik]}</span>
              </>
            )}
          </p>
          {payload.rezhim === 'vremya' ? (
            <p className="trz-card__time" aria-label={EKRAN.sekundomer}>
              ⏱ {ITOGI.sek(sekNow())}
            </p>
          ) : null}
        </header>

        {zadacha === undefined ? (
          <p className="trz-card__wait" role="status" aria-busy="true">
            {EKRAN.sobirayu}
          </p>
        ) : zadacha === null ? (
          <p className="trz-card__wait" role="status">
            {EKRAN.neSobralas}
          </p>
        ) : (
          <K.Uslovie task={zadacha} nomer={index + 1} shagi={sost.podskazka ? sost.shagi : null} />
        )}
      </article>

      {sost.podskazka && posleShagov ? null : otvetBlock}

      {zadacha !== undefined && zadacha !== null && sost.podskazka ? (
        <div className="trz-hint">
          <K.Podskazka
            task={zadacha}
            shagi={sost.shagi}
            setShagi={(shagi: Shagi) => patch({ shagi })}
            onMiss={() => patch({ oshibok: sost.oshibok + 1 })}
            onDone={() => {
              if (!posleShagov) zakryt('hinted');
            }}
          />
          {sost.itog === 'hinted' ? (
            <p className="trz-note" role="status">
              {EKRAN.reshenoSPodskazkoy}
            </p>
          ) : null}
        </div>
      ) : null}

      {sost.podskazka && posleShagov ? otvetBlock : null}

      <div className="trz-actions">
        {zakryta ? (
          <>
            {dalshe}
            {zadacha !== null &&
            zadacha !== undefined &&
            K.estRazbor(zadacha) &&
            sost.itog !== 'hinted' ? (
              <Button variant="ghost" onClick={() => patch({ razbor: !sost.razbor })}>
                {sost.razbor ? EKRAN.skrytRazbor : EKRAN.razbor}
              </Button>
            ) : null}
          </>
        ) : (
          <>
            {sost.podskazka && !posleShagov ? null : (
              <Button
                onClick={proverit}
                disabled={
                  zadacha === null ||
                  zadacha === undefined ||
                  (K.gotov === undefined ? sost.v.trim() === '' : !K.gotov(zadacha, sost.v))
                }
              >
                {EKRAN.proverit}
              </Button>
            )}
            {podskazki &&
            !sost.podskazka &&
            zadacha !== null &&
            zadacha !== undefined &&
            K.estPodskazka(zadacha) ? (
              <span className="trz-offer">
                <Button
                  variant="ghost"
                  onClick={() => patch({ podskazka: true, proverka: null, shagi: {} })}
                >
                  {EKRAN.podskazka}
                </Button>
                <span className="trz-offer__warn">{EKRAN.podskazkaCena}</span>
              </span>
            ) : null}
            <Button variant="ghost" onClick={propustit}>
              {EKRAN.propustit}
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={pohozhaya}>
          {EKRAN.pohozhaya}
        </Button>
      </div>

      {zadacha !== undefined && zadacha !== null && sost.razbor && zakryta ? (
        <div className="trz-razbor">
          <K.Razbor task={zadacha} />
        </div>
      ) : null}

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={EKRAN.kFiltramTitle}
        description={EKRAN.kFiltramText}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              {EKRAN.kFiltramNet}
            </Button>
            <Button
              onClick={() => {
                setConfirm(false);
                if (!zakryta && s !== null) {
                  patch({ sek: sekNow() });
                  setS(null);
                }
                /* Состояние уходит в запись до паузы: эффект отчёта
                   успеет до того, как экран уберут. */
                window.setTimeout(toFilters, 0);
              }}
            >
              {EKRAN.kFiltramDa}
            </Button>
          </>
        }
      />
    </section>
  );
}
