'use client';

import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_1 } from '@/content/zadanie1';
import type { Otmetka } from '@/lib/planimetriya/trenazher/pauza';
import type { Zadacha1 } from '@/lib/planimetriya/trenazher/zadacha';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { IkonkaBloka1 } from './IkonkaBloka1';

/**
 * Итог тренировки №1 — экран итога №11 (Trenazher11Itog): сколько
 * верно начисто, сколько с подсказкой, сколько не решено, и список
 * задач по порядку. «Работа над ошибками» собирает новую тренировку
 * из прототипов, где ошиблись.
 */
export function Trenazher1Itog({
  zadachi,
  bloki,
  otmetki,
  onEshche,
  onOshibki,
}: {
  zadachi: Zadacha1[];
  /** Блок прототипа (ключ «p05» → «I»). */
  bloki: Record<string, string>;
  otmetki: Otmetka[];
  onEshche: () => void;
  onOshibki: (() => void) | null;
}) {
  const skolko = (o: Otmetka) => otmetki.filter((x) => x === o).length;
  return (
    <section className="z11-itog">
      <h2 className="t-h2">{TRENAZHER_1.itog}</h2>
      <ul className="z11-itog__sum">
        <li className="is-right">
          <RightIcon />
          <b>{skolko('right')}</b> {TRENAZHER_1.vernoItog}
        </li>
        <li className="is-hinted">
          <b>{skolko('hinted')}</b> {TRENAZHER_1.sPodskazkoy}
        </li>
        <li className="is-wrong">
          <WrongIcon />
          <b>{skolko('wrong')}</b> {TRENAZHER_1.neResheno}
        </li>
      </ul>
      <ol className="z11-itog__list">
        {zadachi.map((z, i) => {
          const o = otmetki[i] ?? 'wrong';
          return (
            <li key={`${z.key}-${i}`} className={clsx('z11-itog__item', `is-${o}`)}>
              <IkonkaBloka1 blok={bloki[z.id] ?? ''} className="z11-itog__ikonka" />
              <span className="z11-itog__kod">{String(z.proto).padStart(2, '0')}</span>
              <span className="z11-itog__title">
                <Tex text={z.title} />
              </span>
              <span className="z11-itog__badge">{TRENAZHER_1.badge[z.vid]}</span>
              <span className="z11-itog__mark">
                {o === 'right'
                  ? TRENAZHER_1.vernoItog
                  : o === 'hinted'
                    ? TRENAZHER_1.sPodskazkoy
                    : TRENAZHER_1.neResheno}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="z11-itog__actions">
        {onOshibki === null ? null : <Button onClick={onOshibki}>{TRENAZHER_1.oshibkiBtn}</Button>}
        <Button variant={onOshibki === null ? 'primary' : 'secondary'} onClick={onEshche}>
          {TRENAZHER_1.eshche}
        </Button>
      </div>
    </section>
  );
}
