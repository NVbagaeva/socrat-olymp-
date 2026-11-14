import { TARIFY } from '@/content/tarify';
import { assetUrl } from '@/lib/assetUrl';
import { PODSKAZKI } from '@/lib/tarify/config';

/** Главная ценность — методические подсказки. Стеклянная полоса под плашками. */
export function PodskazkiBlok() {
  return (
    <section className="tf-podskazki tf-sekciya" aria-labelledby="tf-podskazki-z">
      <div className="tf-podskazki__panel">
        <img
          className="tf-podskazki__kartinka"
          src={assetUrl('/images/lightbulb.webp')}
          alt=""
          width={200}
          height={181}
          loading="lazy"
          decoding="async"
        />
        <div className="tf-podskazki__golova">
          <h2 id="tf-podskazki-z" className="tf-sekciya__zagolovok">
            {PODSKAZKI.zagolovok}
          </h2>
          <p className="tf-sekciya__lid">{PODSKAZKI.lid}</p>
        </div>
        <ul className="tf-podskazki__spisok">
          {PODSKAZKI.primery.map((primer, index) => (
            <li key={primer.nazvanie} className="tf-podskazki__punkt">
              <span className="tf-podskazki__nomer" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{primer.nazvanie}</h3>
              <p>{primer.tekst}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** «Как это работает»: три шага. */
export function KakEtoRabotaet() {
  const { kak } = TARIFY;
  return (
    <section className="tf-kak tf-sekciya" aria-labelledby="tf-kak-z">
      <h2 id="tf-kak-z" className="tf-sekciya__zagolovok">
        {kak.zagolovok}
      </h2>
      <ol className="tf-kak__shagi">
        {kak.shagi.map((shag, index) => (
          <li key={shag.nazvanie} className="tf-kak__shag">
            <span className="tf-kak__nomer" aria-hidden="true">
              {index + 1}
            </span>
            <h3>{shag.nazvanie}</h3>
            <p>{shag.tekst}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Вопросы и ответы — родные details, раскрываются без скриптов. */
export function Voprosy() {
  const { voprosy } = TARIFY;
  return (
    <section className="tf-voprosy tf-sekciya" aria-labelledby="tf-voprosy-z">
      <h2 id="tf-voprosy-z" className="tf-sekciya__zagolovok">
        {voprosy.zagolovok}
      </h2>
      <div className="tf-voprosy__spisok">
        {voprosy.spisok.map((punkt) => (
          <details key={punkt.vopros} className="tf-vopros">
            <summary>
              {punkt.vopros}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p>
              {punkt.otvet}
              {'ssylka' in punkt && punkt.ssylka ? (
                <>
                  {' '}
                  <a href={punkt.ssylka.href}>{punkt.ssylka.tekst}</a>.
                </>
              ) : null}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Строка для школ и учебных центров. */
export function Shkoly() {
  const { shkoly } = TARIFY;
  return (
    <p className="tf-shkoly">
      {shkoly.tekst}{' '}
      <a href={shkoly.href} target="_blank" rel="noopener noreferrer">
        {shkoly.ssylka}
      </a>
    </p>
  );
}

/**
 * «Мягкая стена»: стеклянная карточка, когда бесплатные задачи на день
 * закончились. На боевых страницах пока не включена — только витрина
 * /styleguide/tarify/.
 */
export function MyagkayaStena() {
  const { stena } = TARIFY;
  return (
    <aside className="tf-stena" aria-labelledby="tf-stena-z">
      <img
        className="tf-stena__kartinka"
        src={assetUrl('/images/tarify/kristall-320.webp')}
        alt=""
        width={96}
        height={89}
        loading="lazy"
        decoding="async"
      />
      <h2 id="tf-stena-z" className="tf-stena__zagolovok">
        {stena.zagolovok}
      </h2>
      <p className="tf-stena__tekst">{stena.tekst}</p>
      <a className="tf-knopka tf-knopka--sinyaya tf-stena__ssylka" href={stena.href}>
        {stena.ssylka}
      </a>
    </aside>
  );
}
