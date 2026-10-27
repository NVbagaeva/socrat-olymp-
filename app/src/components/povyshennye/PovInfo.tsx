'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { HELP, HOWTO_HREF, TOUR_REPETITOR } from '@/content/onboarding';
import { POV_SCREEN as T } from '@/content/povyshennye';
import { S_CHAST2 } from '@/lib/povyshennye/dannye';
import { requestIntro, startTour, useOnboarding } from '@/lib/onboarding';
import type { PovStatus } from './PovScreen';

const STATUSY: readonly PovStatus[] = ['new', 'progress', 'done', 'oshibki'];

/**
 * Содержимое шторки «i»: что такое версии, части 1 и 2, режимы,
 * легенда цветов, первичный и тестовый балл. Внизу — помощь по сайту:
 * туры, приветствие и инструкция (раньше — кнопка «?» в углу; на этом
 * экране она убрана, чтобы не было двух кнопок помощи).
 */
export function PovInfo({ onAction }: { onAction: () => void }) {
  const state = useOnboarding();
  const tutor = state.tours.repetitor;
  const total = TOUR_REPETITOR.steps.length + 1;
  const inProgress = tutor !== undefined && !tutor.done && tutor.step > 0;
  const run = (step: number) => {
    onAction();
    startTour('repetitor', step);
  };

  return (
    <div className="pov-info" data-testid="pov-info-telo">
      <section>
        <h3>{T.info.versii.title}</h3>
        <p>{T.info.versii.text}</p>
      </section>
      <section>
        <h3>{T.info.chasti.title}</h3>
        <p>{T.info.chasti.chast1}</p>
        <p>{T.info.chasti.chast2(S_CHAST2)}</p>
      </section>
      <section>
        <h3>{T.info.rezhimy.title}</h3>
        <dl className="pov-info__rezhimy">
          <dt>{T.mode.trening}</dt>
          <dd>{T.mode.trenNote}</dd>
          <dt>{T.mode.kontrol}</dt>
          <dd>{T.mode.kontrolNote}</dd>
        </dl>
      </section>
      <section>
        <h3>{T.info.cveta.title}</h3>
        <ul className="pov-info__legenda">
          {STATUSY.map((s) => (
            <li key={s}>
              <span className={clsx('pov-tochka', `is-${s}`)} aria-hidden="true" />
              <span className={clsx('pov-v__status', `is-${s}`)}>{T.status[s]}</span>
              {s === 'oshibki' ? (
                <span className="pov-info__poyasnenie">— {T.info.cveta.oshibki}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>{T.info.bally.title}</h3>
        <p>{T.info.bally.text}</p>
      </section>
      <section>
        <h3>{T.info.pomoshch.title}</h3>
        <div className="pov-info__pomoshch">
          {inProgress ? (
            <>
              <button type="button" onClick={() => run(tutor.step)}>
                {HELP.continueTour(tutor.step + 1, total)}
              </button>
              <button type="button" onClick={() => run(0)}>
                {HELP.restartTour}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => run(0)}>
              {HELP.tutorTour}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onAction();
              requestIntro();
            }}
          >
            {HELP.intro}
          </button>
          <Link href={HOWTO_HREF} onClick={onAction}>
            {HELP.howto}
          </Link>
        </div>
      </section>
    </div>
  );
}
