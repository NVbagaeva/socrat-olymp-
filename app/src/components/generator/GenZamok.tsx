'use client';

import { GEN_UI } from '@/content/generatorUi';
import { assetUrl } from '@/lib/assetUrl';
import { href, ZADANIYA } from '@/lib/paths';
import { BESPLATNO, TARIFY_HREF } from '@/lib/tarify/config';
import { GenSheet } from './GenOverlay';
import './zamok.css';

const T = GEN_UI.dostup;

/**
 * Генератор задания закрыт без тарифа (lib/tarify/dostup.ts): вместо
 * экрана генератора — стеклянная карточка со ссылкой на тарифы и на
 * открытые генераторы.
 */
export function GenZakryt({ nomer }: { nomer: string }) {
  return (
    <section className="gen-zamok" aria-labelledby="gen-zamok-z">
      <img
        className="gen-zamok__kartinka"
        src={assetUrl('/images/tarify/kristall-320.webp')}
        alt=""
        width={96}
        height={89}
        loading="lazy"
        decoding="async"
      />
      <h2 id="gen-zamok-z" className="gen-zamok__zagolovok">
        {T.zakryt.zagolovok(nomer)}
      </h2>
      <p className="gen-zamok__tekst">{T.zakryt.tekst}</p>
      <a className="btn btn--primary btn--lg" href={TARIFY_HREF}>
        {T.tarify}
      </a>
      <div className="gen-zamok__probnye">
        <span>{T.zakryt.poprobovat}</span>
        <ul>
          {BESPLATNO.generatorNomera.map((n) => (
            <li key={n}>
              <a href={href(ZADANIYA, n, 'generator')}>№{n}</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Окно «Пробная генерация использована». */
export function ProbnayaPotrachena({ tekst, onClose }: { tekst: string; onClose: () => void }) {
  return (
    <GenSheet
      title={T.potrachena.title}
      onClose={onClose}
      foot={
        <div className="gen-zamok__knopki">
          <a className="btn btn--primary btn--lg" href={TARIFY_HREF}>
            {T.tarify}
          </a>
          <button type="button" className="btn btn--secondary btn--lg" onClick={onClose}>
            {T.ponyatno}
          </button>
        </div>
      }
    >
      <div className="gen-zamok__okno">
        <img
          src={assetUrl('/images/tarify/kristall-320.webp')}
          alt=""
          width={72}
          height={67}
          decoding="async"
        />
        <p>{tekst}</p>
      </div>
    </GenSheet>
  );
}
