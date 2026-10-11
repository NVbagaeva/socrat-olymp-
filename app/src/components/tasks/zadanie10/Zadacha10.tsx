'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import type { ZadachaLite } from '@/lib/zadanie10/dannye';
import { answerMatches } from '@/lib/zadanie10/secret';
import type { Solved } from '@/lib/zadanie10/types';
import { Most10 } from './Most10';
import { Podskazki10 } from './Podskazki10';
import { Razbor10 } from './Razbor10';

/** Картинка сюжета, найденная при сборке (у прототипа она может быть, а может не быть). */
export interface IllInfo {
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
}

/** Решение строится в браузере решателем прототипа (динамический импорт). */
export function useReshenie(z: ZadachaLite | null, nuzhno: boolean): Solved | null {
  const [gotovo, setGotovo] = useState<{ id: string; s: Solved } | null>(null);
  useEffect(() => {
    let zhivo = true;
    if (z && nuzhno) {
      void import('@/lib/zadanie10/prototypes').then((m) => {
        if (zhivo) {
          setGotovo({ id: z.id, s: m.prototype(z.prototypeId).solve(z.params) });
        }
      });
    }
    return () => {
      zhivo = false;
    };
  }, [z, nuzhno]);
  return gotovo && z && gotovo.id === z.id && nuzhno ? gotovo.s : null;
}

export interface Itog10 {
  vvod: string;
  verno: boolean;
}

/**
 * Состояние поля и подсказок сбрасывается сменой задачи: родитель
 * передаёт key={z.id}.
 *
 * Задача тренажёра: картинка сюжета справа от условия (её можно свернуть), чертёж
 * моста у П-01, поле ответа, подсказки-вопросы, разбор после ответа.
 * Ответ сверяется с отпечатком — числа ответа в странице нет.
 */
export function Zadacha10({
  z,
  ill,
  itog,
  onOtvet,
  teoriyaHref,
}: {
  z: ZadachaLite;
  ill?: IllInfo | undefined;
  itog?: Itog10 | undefined;
  onOtvet: (it: Itog10) => void;
  teoriyaHref?: string | undefined;
}) {
  const [vvod, setVvod] = useState(itog?.vvod ?? '');
  const [podskazka, setPodskazka] = useState(false);
  const [pokazat, setPokazat] = useState(false);
  const otkryt = itog !== undefined || pokazat;
  const s = useReshenie(z, podskazka || otkryt);
  return (
    <article className="z10-zadacha">
      <p className="z10-uslovie__metka">
        {z.source === 'fipi' ? `Задача ФИПИ №${z.no ?? ''}` : 'Не из открытого банка'}
        {z.modern ? ' · современный сюжет' : ''}
      </p>
      <div className={clsx('z10-op__uslovie', ill ? 'is-s-kartinkoy' : '')}>
        <p className="z10-uslovie__text">
          <Tex text={z.text} />
        </p>
        {ill ? (
          <details className="z10-ill__svernuto z10-op__syuzhet" open>
            <summary>Картинка к задаче</summary>
            <picture className="z10-ill">
              <source type="image/webp" srcSet={ill.webp} />
              <img
                src={ill.png}
                alt={ill.alt}
                width={ill.width}
                height={ill.height}
                loading="lazy"
              />
            </picture>
          </details>
        ) : null}
      </div>
      {z.prototypeId === 'P01' ? (
        <Most10 params={z.params} rezhim={otkryt ? 'uchitel' : 'uchenik'} />
      ) : null}
      <form
        className="z10-otvet"
        onSubmit={(e) => {
          e.preventDefault();
          if (vvod.trim() === '' || itog) {
            return;
          }
          onOtvet({ vvod, verno: answerMatches(vvod, z.seal) });
        }}
      >
        <label htmlFor={`otvet-${z.id}`}>Ответ</label>
        <input
          id={`otvet-${z.id}`}
          inputMode="decimal"
          autoComplete="off"
          value={vvod}
          disabled={itog !== undefined}
          onChange={(e) => setVvod(e.target.value)}
        />
        <button type="submit" className="btn btn--primary" disabled={itog !== undefined}>
          Проверить
        </button>
      </form>
      {itog ? (
        <p
          className={clsx('z10-otvet__itog', itog.verno ? 'is-verno' : 'is-neverno')}
          role="status"
        >
          {itog.verno ? 'Верно!' : 'Неверно. Посмотрите разбор.'}
        </p>
      ) : null}
      <div className="z10-zadacha__dop">
        {!otkryt ? (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setPodskazka(!podskazka)}
          >
            {podskazka ? 'Скрыть подсказку' : 'Подсказка'}
          </button>
        ) : null}
        {!otkryt ? (
          <button type="button" className="btn btn--ghost" onClick={() => setPokazat(true)}>
            Показать разбор
          </button>
        ) : null}
        {teoriyaHref ? (
          <a className="btn btn--ghost" href={teoriyaHref}>
            Повторить теорию
          </a>
        ) : null}
      </div>
      {podskazka && !otkryt && s ? <Podskazki10 shagi={s.hints} /> : null}
      {otkryt && s ? <Razbor10 s={s} /> : null}
    </article>
  );
}
