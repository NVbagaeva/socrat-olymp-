'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { TourButtons } from '@/components/onboarding/TourButtons';
import { HELP, HOWTO_HREF } from '@/content/onboarding';
import type { PovTexts } from '@/content/povyshennye';
import { requestIntro } from '@/lib/onboarding';
import type { PovStatus } from './PovScreen';

const STATUSY: readonly PovStatus[] = ['new', 'progress', 'done', 'oshibki'];

/**
 * Содержимое шторки «i»: что такое версии, части 1 и 2, режимы,
 * легенда цветов, первичный и тестовый балл. Внизу — помощь по сайту:
 * туры, приветствие и инструкция (раньше — кнопка «?» в углу; на этом
 * экране она убрана, чтобы не было двух кнопок помощи).
 */
export function PovInfo({
  T,
  chast2,
  onAction,
}: {
  T: PovTexts;
  chast2: readonly number[];
  onAction: () => void;
}) {
  return (
    <div className="pov-info" data-testid="pov-info-telo">
      <section>
        <h3>{T.info.versii.title}</h3>
        <p>{T.info.versii.text}</p>
      </section>
      <section>
        <h3>{T.info.chasti.title}</h3>
        <p>{T.info.chasti.chast1}</p>
        <p>{T.info.chasti.chast2(chast2)}</p>
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
          <TourButtons onRun={onAction} />
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
