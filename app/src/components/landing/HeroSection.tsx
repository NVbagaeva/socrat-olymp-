import Link from 'next/link';
import { LevelTabs } from '@/components/level/LevelTabs';
import { landing, landingOf } from '@/content/landing';
import { site, startHref } from '@/content/site';
import type { Level } from '@/lib/level';
import { AvtorPlashka } from '@/components/avtor/AvtorPlashka';
import { PLATNYE, rubli, TARIFY_HREF } from '@/lib/tarify/config';
import { Kristall } from './kristall/Kristall';
import { Zherdochka } from './Zherdochka';

/**
 * Первый экран в «Стеклянной сцене». Заголовок и лид — для обеих
 * аудиторий, под ними две стеклянные «двери»: ученику и учителю. Справа —
 * кристалл целиком в кадре, его можно вращать пальцем и мышью. Позади
 * стекла — три свечения: синее, оранжевое и терракотовое, без них
 * размывать было бы нечего. Полоса показателей строится по длине metrics.
 */
/**
 * Добавки первого экрана (docs/audit-prodazhi.md, волна 2). По умолчанию
 * их нет — боевая главная не меняется; варианты размещения показывает
 * /styleguide/prodazhi/.
 *   avtor        — плашка автора под лидом (и под кнопкой на телефоне);
 *   tarify       — тихая ссылка «Тарифы — от 390 ₽ в месяц»: «ryadom» —
 *                  под лидом рядом с кнопкой, «podDveryami» — под дверями.
 */
export interface HeroDobavki {
  avtor?: boolean;
  tarify?: 'ryadom' | 'podDveryami';
}

function TarifySsylka({ className }: { className: string }) {
  return (
    <Link className={`hero-tarify ${className}`} href={TARIFY_HREF}>
      {landing.tarifySsylka(rubli(PLATNYE.uchenik.tsena30))}
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 12h13M12 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

export function HeroSection({
  level = 'profile',
  dobavki = {},
}: {
  level?: Level;
  dobavki?: HeroDobavki;
}) {
  const { hero, metrics } = landingOf(level);
  return (
    <section className="hero">
      <div className="aura" aria-hidden="true">
        <span className="aura__spot aura__spot--blue" />
        <span className="aura__spot aura__spot--orange" />
        <span className="aura__spot aura__spot--terracotta" />
      </div>

      <div className="hero__in">
        <div className="hero__text">
          {/* Вкладки уровня — над заголовком. */}
          <LevelTabs level={level} to="home" />
          <p className="hero__eyebrow">{hero.eyebrow}</p>
          <h1 className="hero__title">
            <TitleWithPerch title={hero.title} perch={hero.perch} />
          </h1>
          <p className="hero__lead">{hero.lead}</p>
          {/* «Начать бесплатно» — основная кнопка первого экрана на
              телефоне (в мобильной шапке её нет). От 768px она в шапке,
              здесь не повторяется (landing.css). Пока регистрация по
              приглашению — ведёт в банк заданий уровня; откроют
              (REGISTRATION_OPEN) — на регистрацию. */}
          <Link className="btn btn--primary btn--lg hero__start" href={startHref(level)}>
            {site.headerActions.signup.label}
          </Link>
          {dobavki.tarify === 'ryadom' || dobavki.avtor ? (
            <div className="hero__dop">
              {dobavki.tarify === 'ryadom' ? <TarifySsylka className="hero-tarify--ryadom" /> : null}
              {dobavki.avtor ? <AvtorPlashka lenivo={false} /> : null}
            </div>
          ) : null}
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
          {dobavki.tarify === 'podDveryami' ? (
            <TarifySsylka className="hero-tarify--pod-dveryami" />
          ) : null}
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
 * Заголовок, где сразу за словом perch висит жёрдочка с попугайчиком.
 * Слово, знак препинания за ним и жёрдочка — в одной неразрывной
 * обёртке: жёрдочка не отрывается от слова на другую строку.
 */
function TitleWithPerch({ title, perch }: { title: string; perch: string }) {
  const at = title.lastIndexOf(perch);
  if (at < 0) return <>{title}</>;
  const wordEnd = at + perch.length;
  const tail = /^[.,!?:;…]*/.exec(title.slice(wordEnd))?.[0] ?? '';
  const end = wordEnd + tail.length;
  return (
    <>
      {title.slice(0, at)}
      <span className="hero__perch-wrap">
        {perch}
        {tail}
        <Zherdochka />
      </span>
      {title.slice(end)}
    </>
  );
}
