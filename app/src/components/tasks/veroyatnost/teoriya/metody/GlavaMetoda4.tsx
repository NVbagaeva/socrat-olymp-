import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { yarlyki } from '../../navyki';
import {
  GLAVA_METODA,
  RAMKI_METODOV,
  glavaPoMetodu,
  type MiniPrimer,
  type RamkaPravila,
  type ZadachaMetoda,
} from '@/content/veroyatnost4-metody-teoriya';
import { assetUrl } from '@/lib/assetUrl';
import { katex } from '@/lib/graph/katex';
import { TEORIYA_TAIL, ZADANIYA, glavaMetoda, href, teoriyaYakor } from '@/lib/paths';
import { PODGOTOVKA_4 } from '@/lib/veroyatnost/index';
import {
  USLOVIYA_KOSTEY,
  cepochki,
  drobTex,
  kletokKostey,
} from '@/lib/veroyatnost/metody4-interaktiv';
import { bank4Pool } from '@/lib/veroyatnost/pool';
import { blokHref45, opornyeHref45, trenazherHref45 } from '@/lib/veroyatnost/trening/links';
import { typesetKrupno } from '@/lib/tex';
import { Disk4, Derevo4, Kosti4, Shariki4, Stol4 } from './Interaktivy4';
import './metody4.css';

/**
 * Глава теории по одному из пяти ключевых методов задания №4 —
 * раздел вкладки «Теория» (телом в telaRazdelov4). Тексты — из
 * content/veroyatnost4-metody-teoriya.ts, разметки строк здесь нет.
 *
 * Порядок: когда применять → главная рамка (определение или формула)
 * → вторая рамка (исход, таблица, дерево, лайфхак) → алгоритм →
 * разобранные задачи с картинками → связь с №5 → типичные ошибки →
 * интерактив → кнопки «Потренировать этот метод» и «Опорные задачи».
 *
 * Рамки раскрашены как в «Справочнике по планиметрии» (токены
 * --color-spr-*): определение, формула, алгоритм, пример, типичная
 * ошибка, лайфхак. Вся математика набирается KaTeX на сборке.
 */

/** Картинка лежит в public (смотрится на сборке): нет файла — нет и картинки. */
function estFayl(src: string): boolean {
  try {
    return fs.statSync(path.join(process.cwd(), 'public', src)).isFile();
  } catch {
    return false;
  }
}

/** Картинка задачи: 360 px — для 2×, 180 px — для 1×. */
export function kartinkaZadachi(id: string): { s1: string; s2: string } | null {
  const s1 = `/images/zadanie-04/primery/${id}-180.webp`;
  const s2 = `/images/zadanie-04/primery/${id}-360.webp`;
  return estFayl(s1) && estFayl(s2) ? { s1, s2 } : null;
}

/** Картинка карточки метода: 120 px и 240 px. */
export function kartinkaMetoda(imya: string): { s1: string; s2: string } | null {
  const s1 = `/images/zadanie-04/metody/${imya}-120.webp`;
  const s2 = `/images/zadanie-04/metody/${imya}-240.webp`;
  return estFayl(s1) && estFayl(s2) ? { s1, s2 } : null;
}

function Formula({ tex }: { tex: string }) {
  return (
    <div
      className="m4g-formula"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: true, displayMode: true }),
      }}
    />
  );
}

function Primer({ primer }: { primer: MiniPrimer }) {
  return (
    <div className="m4g-ramka__primer">
      <span className="m4g-ramka__primer-label">{RAMKI_METODOV.primer}.</span>{' '}
      <Tex text={primer.tekst} />
      {primer.formula === undefined ? null : <Formula tex={primer.formula} />}
    </div>
  );
}

function Ramka({
  vid,
  title,
  children,
  id,
}: {
  vid: keyof typeof RAMKI_METODOV;
  title?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className={`m4g-ramka m4g-ramka--${vid}`} {...(id === undefined ? {} : { id })}>
      <span className="m4g-ramka__label">{RAMKI_METODOV[vid]}</span>
      {title === undefined ? null : (
        <h5 className="m4g-ramka__title">
          <Tex text={title} zagolovok />
        </h5>
      )}
      {children}
    </section>
  );
}

function RamkaPravilaBlok({ r }: { r: RamkaPravila }) {
  return (
    <Ramka vid={r.vid} title={r.title}>
      {r.tekst.map((t) => (
        <p className="m4g-p" key={t}>
          <Tex text={t} />
        </p>
      ))}
      {r.formula === undefined ? null : <Formula tex={r.formula} />}
      {r.podpis === undefined ? null : (
        <p className="m4g-podpis">
          <Tex text={r.podpis} />
        </p>
      )}
      <Primer primer={r.primer} />
    </Ramka>
  );
}

function Zadacha({ z, nomer }: { z: ZadachaMetoda; nomer: number }) {
  const kartinka = kartinkaZadachi(z.id);
  return (
    <Ramka vid="primer">
      <article className={kartinka === null ? 'm4g-zadacha' : 'm4g-zadacha has-kartinka'}>
        <h5 className="m4g-zadacha__title">
          <span className="m4g-zadacha__no" aria-hidden="true">
            {nomer}
          </span>
          {z.metka}
        </h5>
        {kartinka === null ? null : (
          <img
            className="m4g-zadacha__kartinka"
            src={assetUrl(kartinka.s1)}
            srcSet={`${assetUrl(kartinka.s1)} 180w, ${assetUrl(kartinka.s2)} 360w`}
            sizes="(max-width: 639px) 120px, 180px"
            width={180}
            height={180}
            alt={z.kartinkaAlt}
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="m4g-zadacha__uslovie">
          <p className="m4g-zadacha__sub">{GLAVA_METODA.uslovie}</p>
          <p className="m4g-p">
            <Tex text={z.uslovie} />
          </p>
        </div>
        <div className="m4g-zadacha__reshenie">
          <p className="m4g-zadacha__sub">{GLAVA_METODA.reshenie}</p>
          <ol className="m4g-shagi">
            {z.shagi.map((s) => (
              <li className="m4g-shag" key={s.tekst}>
                <Tex text={s.tekst} />
                {s.formula === undefined ? null : <Formula tex={s.formula} />}
              </li>
            ))}
          </ol>
          <p className="m4g-otvet">
            <b>{GLAVA_METODA.otvet}:</b> {z.otvet}
          </p>
          <p className="m4g-proverka">
            <b>{GLAVA_METODA.proverka}.</b> <Tex text={z.proverka} />
          </p>
        </div>
      </article>
    </Ramka>
  );
}

/** Интерактив главы: формулы набраны здесь и уходят готовой вёрсткой. */
function Interaktiv({ metod }: { metod: string }) {
  const t = (tex: string) => typesetKrupno(`$${tex}$`);
  switch (metod) {
    case 'klassicheskaya':
      return (
        <Shariki4
          n={10}
          formuly={Array.from({ length: 11 }, (_, m) => t(`P(A)=${drobTex(m, 10)}`))}
        />
      );
    case 'kubiki':
      return (
        <Kosti4
          usloviya={USLOVIYA_KOSTEY.map((u) => ({
            id: u.id,
            nazvanie: u.nazvanie,
            formula: t(`P=${drobTex(kletokKostey(u), 36)}`),
          }))}
        />
      );
    case 'monety':
      return (
        <Derevo4
          varianty={[2, 3].map((n) => ({
            n,
            cepochki: cepochki(n),
            formuly: Array.from({ length: 2 ** n + 1 }, (_, m) => t(`P=${drobTex(m, 2 ** n)}`)),
          }))}
        />
      );
    case 'kruglyy-stol':
      return <Stol4 mest={9} formula={t(`P=${drobTex(2, 8)}`)} />;
    case 'protivopolozhnye':
      return (
        <Disk4 nachalo={19} tex={{ pa: t('P(A)='), pna: t('P(\\overline A)=1-'), ravno: t('=') }} />
      );
    default:
      return null;
  }
}

/** Куда ведут кнопки главы: тренажёр с методом и опорные задачи метода. */
function ssylki(metod: string): { trenazher: string; opornye: string } {
  const est = yarlyki(bank4Pool(), 4).some((y) => y.id === metod);
  const blok = PODGOTOVKA_4.find((b) => b.metod === metod);
  return {
    trenazher: est ? href(trenazherHref45(4), metod) : trenazherHref45(4),
    opornye: blok === undefined ? opornyeHref45(4) : blokHref45(4, blok.id),
  };
}

export function GlavaMetoda4({ metod }: { metod: string }) {
  const g = glavaPoMetodu(metod);
  if (g === undefined) {
    return null;
  }
  const yakor = (tail: string) => `${teoriyaYakor(glavaMetoda(metod))}-${tail}`;
  const knopki = ssylki(metod);
  return (
    <div className="m4g">
      <section className="m4g-blok" id={yakor('kogda')}>
        <h4 className="m4g-h">{GLAVA_METODA.kogda}</h4>
        <p className="m4g-p">
          <Tex text={g.kogda.lead} />
        </p>
        <p className="m4g-p m4g-p--sub">{GLAVA_METODA.kogdaSlova}</p>
        <ul className="m4g-slova">
          {g.kogda.slova.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ul>
        <Primer primer={g.kogda.primer} />
      </section>

      <section className="m4g-blok">
        <h4 className="m4g-h">{GLAVA_METODA.glavnoe}</h4>
        <RamkaPravilaBlok r={g.glavnaya} />
        <RamkaPravilaBlok r={g.dopolnenie} />
      </section>

      <section className="m4g-blok" id={yakor('algoritm')}>
        <Ramka vid="algoritm">
          <ol className="m4g-algoritm">
            {g.algoritm.map((s) => (
              <li key={s}>
                <Tex text={s} />
              </li>
            ))}
          </ol>
        </Ramka>
      </section>

      <section className="m4g-blok" id={yakor('zadachi')}>
        <h4 className="m4g-h">{GLAVA_METODA.zadachi}</h4>
        {g.zadachi.map((z, i) => (
          <Zadacha key={z.id} z={z} nomer={i + 1} />
        ))}
        {g.svyaz === undefined ? null : (
          <Ramka vid={g.svyaz.vid} title={g.svyaz.title}>
            {g.svyaz.tekst.map((t) => (
              <p className="m4g-p" key={t}>
                <Tex text={t} />
              </p>
            ))}
            <Primer primer={g.svyaz.primer} />
            <p className="m4g-p">
              <Link
                className="stk-ssylka"
                href={href(ZADANIYA, 5, TEORIYA_TAIL, `#${teoriyaYakor('nezavisimye')}`)}
              >
                {g.svyaz.ssylka}
              </Link>
            </p>
          </Ramka>
        )}
      </section>

      <section className="m4g-blok" id={yakor('oshibki')}>
        <h4 className="m4g-h">{GLAVA_METODA.oshibki}</h4>
        {g.oshibki.map((o) => (
          <Ramka vid="oshibka" title={o.title} key={o.title}>
            <dl className="m4g-oshibka">
              <div className="m4g-oshibka__ryad m4g-oshibka__ryad--ne">
                <dt>{GLAVA_METODA.neverno}</dt>
                <dd>
                  <Tex text={o.neverno} />
                </dd>
              </div>
              <div className="m4g-oshibka__ryad">
                <dt>{GLAVA_METODA.pochemu}</dt>
                <dd>
                  <Tex text={o.pochemu} />
                </dd>
              </div>
              <div className="m4g-oshibka__ryad m4g-oshibka__ryad--da">
                <dt>{GLAVA_METODA.verno}</dt>
                <dd>
                  <Tex text={o.verno} />
                </dd>
              </div>
            </dl>
          </Ramka>
        ))}
      </section>

      <section className="m4g-blok m4g-interaktiv" id={yakor('interaktiv')}>
        <h4 className="m4g-h">{GLAVA_METODA.interaktiv}</h4>
        <p className="m4g-p">
          <Tex text={g.interaktiv.lead} />
        </p>
        <Interaktiv metod={metod} />
      </section>

      <nav className="m4g-knopki" aria-label={GLAVA_METODA.trenirovat}>
        <Link className="btn btn--primary" href={knopki.trenazher}>
          {GLAVA_METODA.trenirovat}
        </Link>
        <Link className="btn btn--secondary" href={knopki.opornye}>
          {GLAVA_METODA.opornye}
        </Link>
      </nav>
    </div>
  );
}
