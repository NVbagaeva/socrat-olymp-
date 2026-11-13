import Link from 'next/link';
import { landing } from '@/content/landing';
import { Kristall } from './kristall/Kristall';
import { Popugaj } from './Popugaj';

const { hero, metrics } = landing;

/**
 * Первый экран в «Стеклянной сцене». Заголовок и лид — для обеих
 * аудиторий, под ними две стеклянные «двери»: ученику и учителю. Справа —
 * кристалл целиком в кадре, его можно вращать пальцем и мышью. Позади
 * стекла — три свечения: синее, оранжевое и терракотовое, без них
 * размывать было бы нечего. Полоса показателей строится по длине metrics.
 */
export function HeroSection() {
  return (
    <section className="hero">
      <div className="aura" aria-hidden="true">
        <span className="aura__spot aura__spot--blue" />
        <span className="aura__spot aura__spot--orange" />
        <span className="aura__spot aura__spot--terracotta" />
      </div>

      <div className="hero__in">
        <div className="hero__text">
          <p className="hero__eyebrow">{hero.eyebrow}</p>
          <h1 className="hero__title">
            <TitleWithPerch title={hero.title} perch={hero.perch} />
          </h1>
          <p className="hero__lead">{hero.lead}</p>
        </div>

        <Kristall className="hero__kristall" />

        <div className="hero__doors">
          {hero.doors.map((door) => (
            <Link key={door.id} className={`door door--${door.id}`} href={door.href}>
              <span className="door__title">{door.title}</span>
              <span className="door__text">{door.text}</span>
              <span className="door__action">
                {door.action}
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13M12 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <dl className="hero__facts">
          {metrics.map((metric) => (
            <div key={metric.label} className="hero__fact">
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * Заголовок, где слово perch обёрнуто: на нём сидит попугайчик. Знак
 * препинания сразу за словом держим с ним в одной неразрывной обёртке,
 * иначе после inline-block точка может уехать на следующую строку.
 */
function TitleWithPerch({ title, perch }: { title: string; perch: string }) {
  const at = title.indexOf(perch);
  if (at < 0) return <>{title}</>;
  const wordEnd = at + perch.length;
  const tail = /^[.,!?:;…]*/.exec(title.slice(wordEnd))?.[0] ?? '';
  const end = wordEnd + tail.length;
  return (
    <>
      {title.slice(0, at)}
      <span className="hero__perch-wrap">
        <span className="hero__perch">
          {perch}
          <Popugaj />
        </span>
        {tail}
      </span>
      {title.slice(end)}
    </>
  );
}
