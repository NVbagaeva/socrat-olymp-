'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { ProblemCard } from '@/components/tasks/card';
import { RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { trenazherSlova, uznaySlova, type Zadanie } from '@/content/veroyatnost';
import { createProgressStore, type ProgressStore } from '@/lib/progressStore';
import { METODY, METODY_4, METODY_5, metodPoId, type Method } from '@/lib/veroyatnost/model';
import type { UznayPool } from '@/lib/veroyatnost/pool';
import { openText, sealMetod } from '@/lib/veroyatnost/secret';
import { ROUND_SIZE, restartRound, useVeroyatnostRound } from '@/lib/veroyatnost/useRound';
import { MethodPicker } from './MethodPicker';
import { ProgressMetody } from './ProgressMetody';

export interface UznayMetodProps {
  pool: UznayPool;
  /** Чей режим: у №4 пять кнопок, у №5 шесть; хранилища разные. */
  zadanie?: Zadanie;
}

/**
 * «Узнай метод» — режим на распознавание структуры задачи.
 *
 * Показывается только условие (ProblemCard в варианте condition) и
 * кнопки с названиями методов — пять у задания №4, шесть у №5. Ответ
 * проверяется сразу: верно — зелёная отметка, признаки под заголовком
 * «Как это было видно» и «Следующая»; неверно — красная, рядом верный
 * метод и «Признаки в условии», по которым его можно было узнать.
 * Второй попытки нет. Числового ответа нет.
 *
 * Метода в разметке нет: у задачи лежит его отпечаток, кнопка
 * сверяется с ним, а признаки открываются тем же отпечатком после
 * ответа. Прогресс — своё хранилище, отдельно от тренажёра и у
 * каждого задания своё.
 */

const STORES: Record<Zadanie, ProgressStore> = {
  4: createProgressStore('budetege:veroyatnost-4-uznay:v1'),
  5: createProgressStore('budetege:veroyatnost-5-uznay:v1'),
};

export function progressUznay(zadanie: Zadanie): ProgressStore {
  return STORES[zadanie];
}

/** Отпечатки всех методов — чтобы после ответа назвать верный. */
const OTPECHATKI = new Map<string, Method>(METODY.map((m) => [sealMetod(m.id), m.id]));

interface Itog {
  vybor: Method;
  verny: Method;
  priznaki: string[];
}

export function UznayMetod({ pool, zadanie = 4 }: UznayMetodProps) {
  const slova = uznaySlova(zadanie);
  const obshchie = trenazherSlova(zadanie);
  const metody = zadanie === 4 ? METODY_4 : METODY_5;
  const progressStore = STORES[zadanie];
  const key = `v${zadanie}:uznay`;

  const [index, setIndex] = useState(0);
  const [itog, setItog] = useState<Itog | null>(null);
  const [srazu, setSrazu] = useState(0);

  const byId = useMemo(() => new Map(pool.kinds.map((kind) => [kind.id, kind])), [pool]);
  const source = useMemo(
    () =>
      pool.kinds.map((kind) => ({
        id: kind.id,
        variants: kind.variants.map((v) => ({ n: v.n })),
      })),
    [pool],
  );

  const round = useVeroyatnostRound(key, source, ROUND_SIZE);
  const item = round[index];
  const kind = item === undefined ? undefined : byId.get(item.kind);
  const variant = kind?.variants.find((v) => v.n === item?.n);

  const nachalo = useRef(0);
  useEffect(() => {
    nachalo.current = Date.now();
  }, [index]);

  function vybrat(metod: Method, seychas: number): void {
    if (item === undefined || variant === undefined || itog !== null) {
      return;
    }
    const verny = OTPECHATKI.get(variant.metodSeal);
    if (verny === undefined) {
      return;
    }
    const right = sealMetod(metod) === variant.metodSeal;
    const priznaki = JSON.parse(openText(variant.hints, variant.metodSeal)) as string[];
    setItog({ vybor: metod, verny, priznaki });
    progressStore.recordAttempt({
      kind: verny,
      taskId: `${item.kind}:${item.n}`,
      right,
      clean: right,
      seconds: (seychas - nachalo.current) / 1000,
    });
    if (right) {
      setSrazu((n) => n + 1);
    }
  }

  function dalshe(): void {
    setIndex((n) => n + 1);
    setItog(null);
  }

  function zanovo(): void {
    restartRound(key);
    setIndex(0);
    setItog(null);
    setSrazu(0);
  }

  const verno = itog !== null && itog.vybor === itog.verny;

  return (
    <section className="z4-uznay">
      <header className="z4-uznay__head">
        <h2 className="t-h2 z4-uznay__title">{slova.title}</h2>
        <p className="z4-uznay__lead">{slova.lead}</p>
      </header>

      {round.length === 0 ? (
        <p className="vtrainer__wait">{obshchie.zhdem}</p>
      ) : index >= round.length ? (
        <div className="vtrainer__done">
          <p className="vtrainer__done-title">{obshchie.proyden}</p>
          <p className="vtrainer__done-score">
            Узнано верно <b>{srazu}</b> из <b>{round.length}</b>
          </p>
          <Button onClick={zanovo}>{obshchie.zanovo}</Button>
        </div>
      ) : item !== undefined && kind !== undefined && variant !== undefined ? (
        <div
          className={clsx(
            'z4-uznay__zadacha',
            itog !== null && (verno ? 'is-correct' : 'is-incorrect'),
          )}
        >
          <p className="z4-trainer__schet">{obshchie.schet(index + 1, round.length)}</p>
          <ProblemCard
            key={`${item.kind}:${item.n}`}
            variant="condition"
            zadacha={{
              id: `${item.kind}:${item.n}`,
              uslovie: variant.uslovie,
              seal: '',
              steps: '',
              ...(variant.illustration === undefined ? {} : { illustration: variant.illustration }),
            }}
            nomer={index + 1}
            istochnik={slova.istochnik[kind.istochnik]}
          />

          <p className="z4-uznay__vopros">{slova.vopros}</p>
          <MethodPicker
            vybor={itog?.vybor ?? null}
            verny={itog?.verny ?? null}
            onPick={(metod) => vybrat(metod, Date.now())}
            label={slova.vopros}
            metody={metody}
          />

          {itog !== null ? (
            <div
              className={clsx(
                'z4-uznay__itog',
                verno ? 'z4-uznay__itog--correct' : 'z4-uznay__itog--incorrect',
              )}
              role="status"
            >
              <p className="z4-uznay__verdict">
                <span className="z4-uznay__ico">{verno ? <RightIcon /> : <WrongIcon />}</span>
                {verno ? slova.verno : slova.neverno}
              </p>
              {verno ? null : (
                <p className="z4-uznay__pravilnyy">
                  <b>{slova.pravilnyy}</b> {metodPoId(itog.verny).nazvanie}
                </p>
              )}
              {/* Признаки — и после ошибки, и после верного ответа:
                  во втором случае это подкрепление, заголовок другой. */}
              <p className="z4-uznay__priznaki-title">{verno ? slova.kakVidno : slova.priznaki}</p>
              <ul className="z4-uznay__priznaki">
                {itog.priznaki.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="z4-uznay__actions">
                <Button onClick={dalshe}>
                  {index + 1 === round.length ? obshchie.zavershit : obshchie.dalshe}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <ProgressMetody store={progressStore} slova={slova.progress} metody={metody} />
    </section>
  );
}
