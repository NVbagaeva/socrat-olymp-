'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { CheckIcon } from '@/components/ui';
import { WrongIcon } from '../../prep/PrepIcons';
import { PROVER_PONIMANIE } from '@/content/veroyatnost-teoriya';
import type { VoprosPonimaniya } from '@/lib/veroyatnost/teoriya-ponimanie';
import { openText } from '@/lib/veroyatnost/secret';
import { variantMatches } from '@/lib/veroyatnost/teoriya';
import { VariantyOtveta, type VariantSostoyanie } from './VariantyOtveta';

export interface ProverPonimaniyaProps {
  voprosy: readonly VoprosPonimaniya[];
}

/** Стрелка «назад»/«вперёд»: одна фигура, вторая отражена. */
function StrelkaIcon({ nazad }: { nazad: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d={nazad ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Блок «Проверь понимание»: один вопрос на экране, стрелки рядом.
 *
 * Вопросы идут по одному, а не сеткой, как в «Видах событий»: здесь
 * у каждого свой разбор, и шесть разборов подряд читать невозможно.
 * Ряд вариантов и его состояния — тот же компонент, что и там.
 *
 * Верного ответа в разметке нет: у вопроса лежит отпечаток, нажатый
 * вариант сверяется с ним здесь же. Разбор приезжает закрытым и
 * раскрывается тем же отпечатком — до ответа его не прочитать ни в
 * разметке, ни в бандле.
 *
 * Ненаписанный вопрос не прячется: он есть в плане блока, просто
 * ещё не написан, и говорит об этом строкой — как ненаписанный
 * раздел на вкладке.
 */
export function ProverPonimanie({ voprosy }: ProverPonimaniyaProps) {
  const [shag, setShag] = useState(0);
  const [vybor, setVybor] = useState<Record<string, string>>({});

  const vopros = voprosy[shag];
  if (vopros === undefined) {
    return null;
  }

  const gotov = vopros.text !== '';
  const otvechen = vybor[vopros.id] !== undefined;
  const verno = otvechen && variantMatches(vybor[vopros.id] as string, vopros.seal);

  /* Стрелкой, а не объявлением: объявление всплывает наверх, и
     сужение типа после проверки на undefined внутри него теряется. */
  const sostoyanie = (variant: string): VariantSostoyanie => {
    if (!otvechen) {
      return null;
    }
    const etot = variantMatches(variant, vopros.seal);
    if (vybor[vopros.id] === variant) {
      return etot ? 'correct' : 'incorrect';
    }
    /* Верный вариант виден и тогда, когда ученик выбрал другой. */
    return etot ? 'answer' : null;
  };

  const vidy = new Map(vopros.otvety.map((o) => [o.value, o.html]));

  return (
    <section className="vpon">
      <header className="vpon__head">
        <h3 className="vpon__title">
          <span className="vpon__znak" aria-hidden="true">
            <CheckIcon />
          </span>
          {PROVER_PONIMANIE.title}
        </h3>
        {/* Счётчик и стрелки — отдельной строкой под заголовком, на
            всех ширинах одинаково: втиснуть их в строку с заголовком
            выходит только на телефоне, и карточка вела бы себя
            по-разному на разных экранах. */}
        <div className="vpon__nav">
          <p className="vpon__schet">
            {shag + 1} / {voprosy.length}
          </p>
          <div className="vpon__strelki">
            <button
              type="button"
              className="vpon__strelka"
              aria-label={PROVER_PONIMANIE.nazad}
              disabled={shag === 0}
              onClick={() => setShag((was) => was - 1)}
            >
              <StrelkaIcon nazad />
            </button>
            <button
              type="button"
              className="vpon__strelka"
              aria-label={PROVER_PONIMANIE.vpered}
              disabled={shag === voprosy.length - 1}
              onClick={() => setShag((was) => was + 1)}
            >
              <StrelkaIcon nazad={false} />
            </button>
          </div>
        </div>
      </header>

      {gotov ? (
        <>
          <p className="vpon__vopros">{vopros.text}</p>
          <VariantyOtveta
            className="vpon__otvety"
            otvety={vopros.otvety.map((o) => o.value)}
            vybor={vybor[vopros.id] ?? null}
            onPick={(variant) => setVybor((was) => ({ ...was, [vopros.id]: variant }))}
            itog={sostoyanie}
            vid={(variant) => (
              <span
                className="vpon__drob"
                dangerouslySetInnerHTML={{ __html: vidy.get(variant) ?? '' }}
              />
            )}
            disabled={otvechen}
            label={vopros.text}
          />

          {/* Разбор: раскрывается отпечатком, когда ученик ответил. */}
          {otvechen && vopros.razbor !== null ? (
            <div className={clsx('vpon-itog', verno ? 'vpon-itog--verno' : 'vpon-itog--neverno')}>
              <p className="vpon-itog__title">
                <span className="vpon-itog__znak" aria-hidden="true">
                  {verno ? <CheckIcon /> : <WrongIcon />}
                </span>
                {verno ? PROVER_PONIMANIE.verno : PROVER_PONIMANIE.neverno}
              </p>
              <p className="vpon-itog__text">{openText(vopros.razbor.text, vopros.seal)}</p>
              <p
                className="vpon-itog__formula"
                dangerouslySetInnerHTML={{
                  __html: openText(vopros.razbor.formula, vopros.seal),
                }}
              />
            </div>
          ) : null}
        </>
      ) : (
        <p className="vpon__soon">{PROVER_PONIMANIE.gotovitsya}</p>
      )}
    </section>
  );
}
