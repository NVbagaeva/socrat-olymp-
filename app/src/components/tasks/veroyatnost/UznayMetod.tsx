'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { ProblemCard } from '@/components/tasks/card';
import { RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { TRENAZHER_4, UZNAY_METOD } from '@/content/veroyatnost';
import { createProgressStore } from '@/lib/progressStore';
import { METODY, type Method } from '@/lib/veroyatnost/model';
import type { UznayPool } from '@/lib/veroyatnost/pool';
import { openText, sealMetod } from '@/lib/veroyatnost/secret';
import { ROUND_SIZE, restartRound, useVeroyatnostRound } from '@/lib/veroyatnost/useRound';
import { MethodPicker } from './MethodPicker';
import { ProgressMetody } from './ProgressMetody';

export interface UznayMetodProps {
  pool: UznayPool;
}

/**
 * «Узнай метод» — режим на распознавание структуры задачи.
 *
 * Показывается только условие (ProblemCard в варианте condition) и
 * пять кнопок с названиями методов. Ответ проверяется сразу: верно —
 * зелёная отметка, признаки под заголовком «Как это было видно» и
 * «Следующая»; неверно — красная, рядом верный метод и «Признаки в
 * условии», по которым его можно было узнать. Второй попытки нет.
 * Числового ответа нет.
 *
 * Метода в разметке нет: у задачи лежит его отпечаток, кнопка
 * сверяется с ним, а признаки открываются тем же отпечатком после
 * ответа. Прогресс — своё хранилище, отдельно от тренажёра.
 */

export const progressUznay = createProgressStore('budetege:veroyatnost-4-uznay:v1');

const KEY = 'v4:uznay';

/** Отпечатки пяти методов — чтобы после ответа назвать верный. */
const OTPECHATKI = new Map<string, Method>(METODY.map((m) => [sealMetod(m.id), m.id]));

interface Itog {
  vybor: Method;
  verny: Method;
  priznaki: string[];
}

export function UznayMetod({ pool }: UznayMetodProps) {
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

  const round = useVeroyatnostRound(KEY, source, ROUND_SIZE);
  const item = round[index];
  const kind = item === undefined ? undefined : byId.get(item.kind);
  const variant = kind?.variants.find((v) => v.n === item?.n);

  const nachalo = useRef(0);
  useEffect(() => {
    nachalo.current = Date.now();
  }, [index]);

  function vybrat(metod: Method): void {
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
    progressUznay.recordAttempt({
      kind: verny,
      taskId: `${item.kind}:${item.n}`,
      right,
      clean: right,
      seconds: (Date.now() - nachalo.current) / 1000,
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
    restartRound(KEY);
    setIndex(0);
    setItog(null);
    setSrazu(0);
  }

  const verno = itog !== null && itog.vybor === itog.verny;

  return (
    <section className="z4-uznay">
      <header className="z4-uznay__head">
        <h2 className="t-h2 z4-uznay__title">{UZNAY_METOD.title}</h2>
        <p className="z4-uznay__lead">{UZNAY_METOD.lead}</p>
      </header>

      {round.length === 0 ? (
        <p className="vtrainer__wait">{TRENAZHER_4.zhdem}</p>
      ) : index >= round.length ? (
        <div className="vtrainer__done">
          <p className="vtrainer__done-title">{TRENAZHER_4.proyden}</p>
          <p className="vtrainer__done-score">
            Узнано верно <b>{srazu}</b> из <b>{round.length}</b>
          </p>
          <Button onClick={zanovo}>{TRENAZHER_4.zanovo}</Button>
        </div>
      ) : item !== undefined && kind !== undefined && variant !== undefined ? (
        <div
          className={clsx(
            'z4-uznay__zadacha',
            itog !== null && (verno ? 'is-correct' : 'is-incorrect'),
          )}
        >
          <p className="z4-trainer__schet">{TRENAZHER_4.schet(index + 1, round.length)}</p>
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
            istochnik={UZNAY_METOD.istochnik[kind.istochnik]}
          />

          <p className="z4-uznay__vopros">{UZNAY_METOD.vopros}</p>
          <MethodPicker
            vybor={itog?.vybor ?? null}
            verny={itog?.verny ?? null}
            onPick={vybrat}
            label={UZNAY_METOD.vopros}
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
                {verno ? UZNAY_METOD.verno : UZNAY_METOD.neverno}
              </p>
              {verno ? null : (
                <p className="z4-uznay__pravilnyy">
                  <b>{UZNAY_METOD.pravilnyy}</b> {METODY.find((m) => m.id === itog.verny)?.nazvanie}
                </p>
              )}
              {/* Признаки — и после ошибки, и после верного ответа:
                  во втором случае это подкрепление, заголовок другой. */}
              <p className="z4-uznay__priznaki-title">
                {verno ? UZNAY_METOD.kakVidno : UZNAY_METOD.priznaki}
              </p>
              <ul className="z4-uznay__priznaki">
                {itog.priznaki.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="z4-uznay__actions">
                <Button onClick={dalshe}>
                  {index + 1 === round.length ? TRENAZHER_4.zavershit : TRENAZHER_4.dalshe}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <ProgressMetody store={progressUznay} slova={UZNAY_METOD.progress} />
    </section>
  );
}
