'use client';

import { OPORNYE } from '@/content/opornye';
import { ProgressBar } from '@/components/ui';
import type { Zadanie } from '@/content/veroyatnost';
import { prepResheno, prepStore } from '@/lib/veroyatnost/prepProgress';

export interface PodgotovkaSchetProps {
  zadanie: Zadanie;
  /** Идентификаторы задач каждого блока: по ним считается решённое. */
  bloki: { id: string; zadachi: readonly string[] }[];
}

/**
 * Строка «N из 40 заданий» и полоса под ней.
 *
 * Счёт читается из хранилища подготовки этого задания и обновляется
 * сразу после верного ответа: экран задачи и эта строка смотрят
 * в одно и то же место. Своя, а не общая с №12: там своё хранилище.
 */
export function PodgotovkaSchet({ zadanie, bloki }: PodgotovkaSchetProps) {
  const progress = prepStore(zadanie).useProgress();
  const vsego = bloki.reduce((sum, blok) => sum + blok.zadachi.length, 0);
  const resheno = bloki.reduce((sum, blok) => sum + prepResheno(progress, blok.zadachi), 0);

  const dolya = vsego === 0 ? 0 : (resheno / vsego) * 100;
  return (
    <>
      <p className="prep__counter">
        <b>{resheno}</b> из {vsego} заданий
      </p>
      <div className="prep__meter-row">
        <ProgressBar
          className="prep__meter"
          value={dolya}
          label={`${OPORNYE.title}: решено ${resheno} из ${vsego}`}
        />
        {/* Процент — только у дорожки №4 (по макету); у списка №5 он спрятан стилем. */}
        <span className="prep__percent" aria-hidden="true">
          {Math.round(dolya)}%
        </span>
      </div>
    </>
  );
}

export interface PodgotovkaMeterProps {
  zadanie: Zadanie;
  /** Идентификаторы задач блока. */
  zadachi: readonly string[];
  /** Название блока: уходит в подпись полосы для озвучки. */
  title: string;
}

/** Полоса и строка «N из 8» на карточке блока. */
export function PodgotovkaMeter({ zadanie, zadachi, title }: PodgotovkaMeterProps) {
  const progress = prepStore(zadanie).useProgress();
  const resheno = prepResheno(progress, zadachi);

  return (
    <span className="prep-card__meter">
      <ProgressBar
        value={zadachi.length === 0 ? 0 : (resheno / zadachi.length) * 100}
        label={`${title}: решено задач`}
      />
      <span className="prep-card__done">
        {resheno} из {zadachi.length}
      </span>
    </span>
  );
}
