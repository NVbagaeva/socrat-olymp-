'use client';

import { BallPlashka } from '@/components/chast2/BallPlashka';
import { MAX_BALL } from '@/content/variantOnline/bally';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import type { Chast2Ui } from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { Chast2Card } from './Chast2Card';
import './chast2.css';

/**
 * Часть 2 на экране итогов: ответы зафиксированы, у каждого задания —
 * сверка, решение по этапам и критерии. Выбранная строка критериев —
 * балл самопроверки; итог наверху пересчитывается.
 */
export function Chast2Itog({
  zadachi,
  st,
  update,
}: {
  zadachi: readonly Chast2Zadacha[];
  st: Chast2Ui;
  update: (fn: (s: Chast2Ui) => Chast2Ui) => void;
}) {
  return (
    <section className="c2-itog" data-testid="c2-itog" aria-labelledby="c2-itog-title">
      <h3 className="vo-h3" id="c2-itog-title">
        {T.itog2.title}
      </h3>
      <p className="vo-note">{T.itog2.lead}</p>
      {zadachi.map((z) => (
        <article key={z.no} className="vo-card c2-itog__task">
          <header className="vo-card__head">
            <h4 className="vo-card__title">
              Задание {z.no}
              <BallPlashka n={MAX_BALL[z.no]} />
            </h4>
          </header>
          <Chast2Card z={z} st={st} update={update} samo readOnly />
        </article>
      ))}
    </section>
  );
}
