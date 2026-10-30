import { Fragment } from 'react';
import { Chart } from '@/components/graph/Chart';
import { Tex } from '@/components/ui/Tex';
import { Znachok16 } from '@/components/zadanie16/Teoriya16';
import { BLOKI_16 } from '@/content/teoriya16';
import { BLOKI_19 } from '@/content/zadanie19';
import type { Bukva19, Etap19, Kartochka19, Risunok19 } from '@/content/teoriya19/tipy';
import { katex } from '@/lib/graph/katex';
import { typesetKrupno } from '@/lib/tex';
import { Zhivoy19 } from './Zhivoy19';

/**
 * Части страниц №19, набранные на сервере: карточка теории, рисунок,
 * этапы решения, ответ. Оформление — слой №16 (z16-*): карточки,
 * метки со значками, шаги и плашка ответа; своё — только рисунок и
 * отступы этапов (zadanie19.css).
 */

/** Текст условия: дроби в системах — крупные (\dfrac не ужимается). */
export function TexK({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: typesetKrupno(text) }} />;
}

/** Формула крупно по центру. */
export function Krupno19({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: true });
  return (
    <div className="z16-card__formula z19-formula" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** «Ответ: a ∈ …» плашкой. */
export function Otvet19({ tex, bukva }: { tex: string; bukva: Bukva19 }) {
  const html = katex.renderToString(`${bukva}\\in${tex}`, { throwOnError: true });
  return (
    <p className="z16-otvet">
      <span className="z16-otvet__label">{BLOKI_19.otvet}:</span>{' '}
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </p>
  );
}

/** Рисунок движка и подпись под ним. */
export function Risunok({ r }: { r: Risunok19 }) {
  return (
    <figure className="z19-ris">
      <Chart scene={r.scena} className="z19-ris__svg" />
      {r.podpis === undefined ? null : (
        <figcaption className="z16-card__podpis z19-ris__podpis">
          <Tex text={r.podpis} />
        </figcaption>
      )}
    </figure>
  );
}

/** Этапы решения: подзаголовок, строки, формулы, случаи, рисунок. */
export function Etapy19({ etapy }: { etapy: readonly Etap19[] }) {
  return (
    <div className="z19-etapy">
      {etapy.map((e, i) => (
        <section className="z19-etap" key={i}>
          {e.title === undefined ? null : (
            <h5 className="z16-card__title z19-etap__title">
              <span className="z16-punkt__no">{i + 1}</span> <Tex text={e.title} />
            </h5>
          )}
          {e.lines.map((l) => (
            <p className="z16-card__text" key={l}>
              <Tex text={l} />
            </p>
          ))}
          {(e.tex ?? []).map((t) => (
            <Krupno19 tex={t} key={t} />
          ))}
          {e.spisok === undefined ? null : (
            <ul className="z19-spisok">
              {e.spisok.map((s) => (
                <li key={s}>
                  <Tex text={s} />
                </li>
              ))}
            </ul>
          )}
          {(e.posle ?? []).map((l) => (
            <p className="z16-card__text" key={l}>
              <Tex text={l} />
            </p>
          ))}
          {e.risunok === undefined ? null : <Risunok r={e.risunok} />}
          {e.zhivoy === undefined ? null : <Zhivoy19 id={e.zhivoy} />}
        </section>
      ))}
    </div>
  );
}

/** Карточка теории: метка со значком, заголовок, абзацы, шаги, рисунок. */
export function Kartochka({ k }: { k: Kartochka19 }) {
  return (
    <section className={`z16-card z19-card z16-card--${k.ton} z16-shir--${k.shirina ?? 2}`}>
      <p className="z16-metka">
        <Znachok16 ton={k.ton} />
        {k.metka ?? BLOKI_16.metki[k.ton]}
      </p>
      {k.title === undefined ? null : (
        <h5 className="z16-card__title">
          <Tex text={k.title} zagolovok />
        </h5>
      )}
      {(k.text ?? []).map((t) => (
        <p className="z16-card__text" key={t}>
          <Tex text={t} />
        </p>
      ))}
      {k.tex === undefined ? null : <Krupno19 tex={k.tex} />}
      {k.shagi === undefined ? null : (
        <ol className="z16-shagi">
          {k.shagi.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ol>
      )}
      {k.punkty === undefined ? null : (
        <ul className="z19-spisok">
          {k.punkty.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ul>
      )}
      {k.risunok === undefined ? null : <Risunok r={k.risunok} />}
      {k.itog === undefined ? null : (
        <p className="z16-card__itog">
          <Tex text={k.itog} />
        </p>
      )}
    </section>
  );
}

/** Абзацы с переносами в условии — по строкам. */
export function Uslovie19({ text }: { text: string }) {
  return (
    <p className="z16-card__text z19-uslovie">
      {text.split('\n').map((s, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          <TexK text={s} />
        </Fragment>
      ))}
    </p>
  );
}
