import { clsx } from 'clsx';
import Link from 'next/link';
import { AvtorPlashka } from '@/components/avtor/AvtorPlashka';
import { landing, landingOf } from '@/content/landing';
import { site, startHref } from '@/content/site';
import type { Level } from '@/lib/level';
import { PLATNYE, rubli, TARIFY_HREF } from '@/lib/tarify/config';
import { Chertezh } from './Chertezh';
import { KristallSPtitsey } from './KristallSPtitsey';
import './sumerki.css';

/**
 * Первый экран главной — синяя сцена. Синий только он, с чётким краем;
 * ниже — обычный светлый сайт.
 *
 *   vid="vitrina" — синяя сцена в большой скруглённой карточке на светлом
 *                   фоне, под обычной светлой шапкой;
 *   vid="shirina" — синий до краёв экрана, низ — чёткий край с дугой.
 *
 * Тексты — те же, что у первого экрана (content/landing.ts); цена — из
 * lib/tarify/config.ts, числа показателей — из landing.metrics.
 * Порядок на телефоне: надзаголовок и заголовок → кристалл → лид →
 * кнопки → полоса. Сетка — sumerki.css.
 */
export function SumerkiHero({
  vid = 'vitrina',
  oreol = 'silnyy',
  level = 'profile',
}: {
  vid?: 'vitrina' | 'shirina';
  /** Сила светлого ореола за кристаллом: на выбор владельцу. */
  oreol?: 'silnyy' | 'myagkiy';
  level?: Level;
}) {
  const { hero, metrics } = landingOf(level);
  const t = landing.sumerki;
  const [zadach, zadaniy] = metrics;
  /* Заголовок — две фразы, каждая с новой строки на широком экране;
     хвост второй («от теории до тренажёра») светится. */
  const tochka = hero.title.indexOf('. ');
  const frazy =
    tochka < 0 ? [hero.title] : [hero.title.slice(0, tochka + 1), hero.title.slice(tochka + 2)];
  const s_akcentom = (fraza: string) => {
    const i = fraza.lastIndexOf(t.akcentZagolovka);
    if (i < 0) return fraza;
    return (
      <>
        {fraza.slice(0, i)}
        <span className="sm-h1__akcent">{t.akcentZagolovka}</span>
        {fraza.slice(i + t.akcentZagolovka.length)}
      </>
    );
  };
  const zagolovok = frazy.map((fraza, i) => (
    <span key={i} className="sm-h1__fraza">
      {s_akcentom(fraza)}
      {i < frazy.length - 1 ? ' ' : null}
    </span>
  ));

  return (
    <section className={clsx('sm', `sm--${vid}`)} data-oreol={oreol} aria-labelledby="sm-z">
      <div className="sm__okno">
        <div className="sm__fon" aria-hidden="true">
          <span className="sm__svet" />
          <Chertezh />
        </div>

        <div className="sm__in">
          <div className="sm__nad">
            <p className="sm__eyebrow">{hero.eyebrow}</p>
            <h1 id="sm-z" className="sm-h1">
              {zagolovok}
            </h1>
          </div>

          <KristallSPtitsey className="sm__kristall" podskazka={t.pokrutite} />

          <p className="sm__lid">{hero.lead}</p>

          <div className="sm__knopki">
            {hero.doors.map((door) => (
              <Link key={door.id} className={`sm-dver sm-dver--${door.id}`} href={door.href}>
                <span className="sm-dver__tekst">
                  <span className="sm-dver__z">{door.title}</span>
                  <span className="sm-dver__p">{door.action}</span>
                </span>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13M12 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
            {/* «Начать бесплатно» — на телефоне здесь: в узкой шапке её нет. */}
            <Link className="sm-start" href={startHref(level)}>
              {site.headerActions.signup.label}
            </Link>
          </div>

          <div className="sm-polosa">
            <Link className="sm-polosa__punkt sm-polosa__tarify" href={TARIFY_HREF}>
              {landing.tarifySsylka(rubli(PLATNYE.uchenik.tsena30))}
              <svg className="sm-strelka" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h13M12 6l6 6-6 6" />
              </svg>
            </Link>
            <AvtorPlashka
              vid="stroka"
              className="sm-polosa__punkt sm-polosa__avtor"
              lenivo={false}
            />
            {zadach ? (
              <p className="sm-polosa__punkt sm-polosa__chislo">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
                </svg>
                <span>
                  <b>{zadach.value}</b> {t.zadach}
                </span>
              </p>
            ) : null}
            {zadaniy ? (
              <p className="sm-polosa__punkt sm-polosa__chislo">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M8.5 12.2l2.4 2.4 4.6-5" />
                </svg>
                <span>
                  <b>{zadaniy.value}</b> {t.zadaniy}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
