'use client';

import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { TRENAZHER_11 } from '@/content/zadanie11';
import { kodNaSayte } from '@/lib/zadanie11/kod';
import type { Zadacha11 } from '@/lib/zadanie11/trenazher/zadacha';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { IkonkaRazdela } from './Piktogrammy';

/** Чем закрылась задача тренировки. */
export type Otmetka = 'right' | 'hinted' | 'wrong';

/**
 * Итог тренировки: сколько верно начисто, сколько с подсказкой,
 * сколько не решено, и список задач по порядку. «Работа над
 * ошибками» собирает новую тренировку из подтипов, где ошиблись.
 */
export function Trenazher11Itog({
  zadachi,
  otmetki,
  onEshche,
  onOshibki,
}: {
  zadachi: Zadacha11[];
  otmetki: Otmetka[];
  onEshche: () => void;
  onOshibki: (() => void) | null;
}) {
  const skolko = (o: Otmetka) => otmetki.filter((x) => x === o).length;
  return (
    <section className="z11-itog">
      <h2 className="t-h2">{TRENAZHER_11.itog}</h2>
      <ul className="z11-itog__sum">
        <li className="is-right">
          <RightIcon />
          <b>{skolko('right')}</b> {TRENAZHER_11.vernoItog}
        </li>
        <li className="is-hinted">
          <b>{skolko('hinted')}</b> {TRENAZHER_11.sPodskazkoy}
        </li>
        <li className="is-wrong">
          <WrongIcon />
          <b>{skolko('wrong')}</b> {TRENAZHER_11.neResheno}
        </li>
      </ul>
      <ol className="z11-itog__list">
        {zadachi.map((z, i) => {
          const o = otmetki[i] ?? 'wrong';
          return (
            <li key={z.key} className={clsx('z11-itog__item', `is-${o}`)}>
              <IkonkaRazdela section={z.section} className="z11-itog__ikonka" />
              <span className="z11-itog__kod">{kodNaSayte(z.id)}</span>
              <span className="z11-itog__title">{z.title}</span>
              <span className="z11-itog__badge">{TRENAZHER_11.badge[z.vid]}</span>
              <span className="z11-itog__mark">
                {o === 'right'
                  ? TRENAZHER_11.vernoItog
                  : o === 'hinted'
                    ? TRENAZHER_11.sPodskazkoy
                    : TRENAZHER_11.neResheno}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="z11-itog__actions">
        {onOshibki === null ? null : <Button onClick={onOshibki}>{TRENAZHER_11.oshibkiBtn}</Button>}
        <Button variant={onOshibki === null ? 'primary' : 'secondary'} onClick={onEshche}>
          {TRENAZHER_11.eshche}
        </Button>
      </div>
    </section>
  );
}
