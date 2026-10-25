'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Model } from '@/lib/solid/model';
import { ZhivoyChertezh3d } from './ZhivoyChertezh3d';

export interface ShagHtml {
  /** «Что делаем», набранное KaTeX. */
  chto: string;
  /** Абзацы «почему» и формулы, уже набранные. */
  telo: string;
  /** С этого шага начинается пункт задачи №15. */
  punkt?: 'а' | 'б';
}

export interface RazborKlientProps {
  model: Model;
  svg: string;
  azimuth: number;
  elevation: number;
  /** Сколько шагов у чертежа: последние шаги текста бывают чистым вычислением. */
  shagovChertezha: number;
  shagi: readonly ShagHtml[];
}

/**
 * Решение по шагам рядом с живым чертежом. Шаг выбирается кнопками
 * «Назад / Далее» или нажатием на сам шаг; чертёж выделяет то, о чём
 * шаг. Шаги-вычисления без нового на чертеже держат выделение
 * прошлого шага.
 */
export function RazborKlient({
  model,
  svg,
  azimuth,
  elevation,
  shagovChertezha,
  shagi,
}: RazborKlientProps) {
  const [shag, setShag] = useState(0);
  const n = shagi.length;
  const naChertezhe = Math.min(shag, shagovChertezha);
  /* Подписи чертежу не показываются (своих кнопок у него здесь нет),
     нужно только их число — по нему он понимает, что шаги есть. */
  const podpisi = Array.from({ length: shagovChertezha + 1 }, () => '');

  return (
    <div className="rich-example__grid stereo-razbor__grid">
      <div className="stereo-razbor__chertezh">
        <ZhivoyChertezh3d
          model={model}
          svg={svg}
          azimuth={azimuth}
          elevation={elevation}
          podpisi={podpisi}
          shag={naChertezhe}
          onShag={() => {}}
          bezNavigatsii
        />
        <div className="z3d__shagi-nav stereo-razbor__nav">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShag((k) => Math.max(0, k - 1))}
            disabled={shag === 0}
          >
            Назад
          </Button>
          <span className="z3d__shag t-sm" aria-live="polite">
            {shag === 0 ? 'Условие' : `Шаг ${shag} из ${n}`}
          </span>
          <Button
            size="sm"
            onClick={() => setShag((k) => Math.min(n, k + 1))}
            disabled={shag === n}
          >
            {shag === 0 ? 'Начать решение' : 'Далее'}
          </Button>
        </div>
      </div>
      <ol className="rich-example__steps stereo-razbor__steps">
        {shagi.map((item, i) => [
          item.punkt === undefined ? null : (
            <li className="stereo-razbor__punkt" key={`p${i}`} aria-hidden="true">
              Пункт {item.punkt}
            </li>
          ),
          <li
            className={clsx(
              'rich-example__step stereo-razbor__step',
              shag === i + 1 && 'is-active',
              shag > i + 1 && 'is-done',
            )}
            key={i}
          >
            <button
              type="button"
              className="stereo-razbor__label rich-example__label"
              aria-pressed={shag === i + 1}
              onClick={() => setShag(i + 1)}
            >
              <span className="stereo-razbor__no">{i + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: item.chto }} />
            </button>
            <div className="stereo-razbor__telo" dangerouslySetInnerHTML={{ __html: item.telo }} />
          </li>,
        ])}
      </ol>
    </div>
  );
}
