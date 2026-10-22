import { clsx } from 'clsx';
import { vesRazdel } from '@/content/ves12';
import { GENERATOR_ALL_HREF, ZACHYOT_HREF } from './paths';
import './ves12.css';

export interface VesRazdelCardsProps {
  /** Где стоит блок: окно выбора типа, страница №12 или меню разделов. */
  place: 'dialog' | 'page' | 'menu';
  /** Заголовок «Весь раздел» над карточками. По умолчанию есть. */
  heading?: boolean;
}

/* Значки карточек — линейные, как значки навигации сайта. */
function ZachyotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 4h6v3H9z" />
      <path d="M8 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H16" />
      <path d="m8.5 13.5 2.3 2.3 4.7-4.8" />
    </svg>
  );
}

function GeneratorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 3.5h8l3.5 3.5v10A1.5 1.5 0 0 1 17 18.5H7A1.5 1.5 0 0 1 5.5 17V5A1.5 1.5 0 0 1 7 3.5z" />
      <path d="M14.5 3.5V7h4" />
      <path d="M8.5 11h7M8.5 14h5" />
      <path d="M5.5 20.5h11" />
    </svg>
  );
}

function Arrow() {
  return (
    <span className="ves-card__go" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M5 12h13M12 6l6 6-6 6" />
      </svg>
    </span>
  );
}

/**
 * «Весь раздел»: две крупные карточки — зачётная работа и генератор по
 * всем типам. Одни и те же в окне выбора типа функции, на странице №12
 * и в меню «Все разделы»: вход в инструменты по всему заданию.
 *
 * Обычные ссылки: переход работает и средней кнопкой, и в новой вкладке.
 * Подсветка, как у карточек типов, — только при наведении и фокусе.
 */
export function VesRazdelCards({ place, heading = true }: VesRazdelCardsProps) {
  const titleId = `ves-razdel-${place}`;
  return (
    <section className={clsx('ves-razdel', `ves-razdel--${place}`)} aria-labelledby={heading ? titleId : undefined}>
      {heading ? (
        <h3 className="ves-razdel__title" id={titleId}>
          {vesRazdel.title}
        </h3>
      ) : null}
      <ul className="ves-razdel__list">
        <li>
          <a className="ves-card" href={ZACHYOT_HREF}>
            <span className="ves-card__ico">
              <ZachyotIcon />
            </span>
            <span className="ves-card__text">
              <span className="ves-card__name">{vesRazdel.zachyot.title}</span>
              <span className="ves-card__lead">{vesRazdel.zachyot.lead}</span>
            </span>
            <Arrow />
          </a>
        </li>
        <li>
          <a className="ves-card" href={GENERATOR_ALL_HREF}>
            <span className="ves-card__ico">
              <GeneratorIcon />
            </span>
            <span className="ves-card__text">
              <span className="ves-card__name">{vesRazdel.generator.title}</span>
              <span className="ves-card__lead">{vesRazdel.generator.lead}</span>
            </span>
            <Arrow />
          </a>
        </li>
      </ul>
    </section>
  );
}
