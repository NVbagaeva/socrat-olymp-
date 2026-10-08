import Link from 'next/link';
import { Fragment } from 'react';
import { HeroImage } from './HeroImage';
import { HeroLines } from './HeroLines';
import { landing } from '@/content/landing';

const { hero } = landing;

/**
 * Первый экран. Слева изображение во всю высоту экрана от самого края окна,
 * справа текст: надзаголовок → заголовок → подзаголовок → кнопки.
 *
 * Полосы показателей под кнопками больше нет: её числа («9 980+ задач»)
 * не были выверены, а непроверенных цифр на странице быть не должно.
 */
export function HeroSection() {
  return (
    <section className="hero">
      <HeroLines />

      <div className="hero__media">
        <HeroImage />
      </div>

      <div className="hero__body">
        <p className="hero__eyebrow">{hero.eyebrow}</p>

        {/* Пробел между строками нужен телефону: там строки идут
            в строку и переносятся сами, см. landing.css. */}
        <h1 className="t-display hero__title">
          {hero.titleLines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 ? ' ' : null}
              <span>{line}</span>
            </Fragment>
          ))}
        </h1>

        <p className="hero__lead">{hero.lead}</p>

        <div className="hero__actions">
          <Link className="btn btn--primary btn--lg" href={hero.primaryAction.href}>
            {hero.primaryAction.label}
          </Link>
          <Link className="btn btn--secondary btn--lg" href={hero.secondaryAction.href}>
            {hero.secondaryAction.label}
          </Link>
        </div>

        <p className="hero__note">
          {hero.note}
          <span className="hero__note-sep" aria-hidden="true">
            ·
          </span>
          <a className="hero__tutors" href={hero.tutorsLink.href}>
            {hero.tutorsLink.label}
            <span aria-hidden="true"> →</span>
          </a>
        </p>
      </div>
    </section>
  );
}
