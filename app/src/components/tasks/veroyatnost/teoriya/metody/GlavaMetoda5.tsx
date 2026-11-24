import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { yarlyki } from '../../navyki';
import {
  GLAVA_METODA,
  RAMKI_METODOV,
  type MiniPrimer,
  type RamkaPravila,
  type ZadachaMetoda,
} from '@/content/veroyatnost4-metody-teoriya';
import { glavaPoMetodu5 } from '@/content/veroyatnost5-metody-teoriya';
import { katex } from '@/lib/graph/katex';
import { href } from '@/lib/paths';
import { glavaMetoda, teoriyaYakor } from '@/lib/paths-teoriya';
import { PODGOTOVKA_5 } from '@/lib/veroyatnost/podgotovka5';
import { SUMMY_5, ZAPRETY_5, kostiPriUslovii, nod } from '@/lib/veroyatnost/metody5-interaktiv';
import { bank5Pool } from '@/lib/veroyatnost/pool';
import {
  blokHref45,
  opornyeHref45,
  teoriyaMetodaHref45,
  trenazherHref45,
} from '@/lib/veroyatnost/trening/links';
import { typesetKrupno } from '@/lib/tex';
import { kartinkaUrl } from './GlavaMetoda4';
import { Disk4 } from './Interaktivy4';
import {
  DoUspeha5,
  Derevo5,
  Kosti5,
  Lampy5,
  Para5,
  Polosa5,
  Pryamaya5,
  Vystrely5,
} from './Interaktivy5';
import './metody4.css';
import './metody5.css';

/**
 * Глава теории по одному из десяти ключевых методов задания №5 —
 * раздел вкладки «Теория» (телом в telaRazdelov5). Тексты — из
 * content/veroyatnost5-metody-teoriya.ts, разметки строк здесь нет.
 *
 * Устроена как глава №4 (GlavaMetoda4) и одета в те же классы
 * (metody4.css): когда применять → главная рамка → вторая рамка →
 * алгоритм → разобранные задачи с картинками → связь с №4 → типичные
 * ошибки → интерактив → «Потренировать этот метод» и «Опорные задачи».
 * Своё у №5 — только интерактивы (Interaktivy5, metody5.css).
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
function kartinkaZadachi5(id: string): { s1: string; s2: string } | null {
  const s1 = `/images/zadanie-05/primery/${id}-180.webp`;
  const s2 = `/images/zadanie-05/primery/${id}-360.webp`;
  return estFayl(s1) && estFayl(s2) ? { s1, s2 } : null;
}

/** Картинка карточки метода: 120 px и 240 px. */
export function kartinkaMetoda5(imya: string): { s1: string; s2: string } | null {
  const s1 = `/images/zadanie-05/metody/${imya}-120.webp`;
  const s2 = `/images/zadanie-05/metody/${imya}-240.webp`;
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
}: {
  vid: keyof typeof RAMKI_METODOV;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className={`m4g-ramka m4g-ramka--${vid}`}>
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
  const kartinka = kartinkaZadachi5(z.id);
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
            src={kartinkaUrl(kartinka.s1)}
            srcSet={`${kartinkaUrl(kartinka.s1)} 180w, ${kartinkaUrl(kartinka.s2)} 360w`}
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

/** Дробь m/n: сокращённая и, если конечная, десятичная. */
function drob5(m: number, n: number): string {
  if (m === 0) return '0';
  const d = nod(m, n);
  const sokr = d > 1 ? `=\\dfrac{${m / d}}{${n / d}}` : '';
  const x = m / n;
  let zn = n / d;
  for (const p of [2, 5]) while (zn % p === 0) zn /= p;
  const dec = zn === 1 ? `=${String(Number(x.toFixed(6))).replace('.', '{,}')}` : '';
  return `\\dfrac{${m}}{${n}}${sokr}${dec}`;
}

/** Интерактив главы: обозначения набраны здесь и уходят готовой вёрсткой. */
function Interaktiv({ metod }: { metod: string }) {
  const t = (tex: string) => typesetKrupno(`$${tex}$`);
  const polosa = {
    pa: t('P(A)='),
    pb: t('P(B)='),
    pab: t('P(A\\cap B)='),
    pu: t('P(A\\cup B)='),
  };
  switch (metod) {
    case 'nesovmestnye':
      return <Polosa5 obshchie={false} tex={polosa} />;
    case 'protivopolozhnoe':
      return (
        <Disk4 nachalo={14} tex={{ pa: t('P(A)='), pna: t('P(\\overline A)=1-'), ravno: t('=') }} />
      );
    case 'koordinatnaya':
      return <Pryamaya5 tex={{ pa: t('P(X>a)='), pb: t('P(X>b)='), pab: t('P(a<X\\le b)=') }} />;
    case 'sovmestnye':
      return <Polosa5 obshchie tex={polosa} />;
    case 'uslovnaya':
      return (
        <Kosti5
          formuly={Object.fromEntries(
            ZAPRETY_5.flatMap((z) =>
              SUMMY_5.map((s) => {
                const [m, n] = kostiPriUslovii(z, s);
                return [`${z}-${s}`, t(`P=${drob5(m, n)}`)];
              }),
            ),
          )}
        />
      );
    case 'nezavisimye':
      return <Vystrely5 tex={{ p: t('P=') }} />;
    case 'hotya-by':
      return (
        <Lampy5
          tex={{
            vse: t('P(\\text{все погасли})='),
            hotyaBy: t('P(\\text{хотя бы один горит})=1-'),
            ravno: t('='),
          }}
        />
      );
    case 'dva-predmeta':
      return <Para5 tex={{ p: t('P=') }} />;
    case 'polnaya':
      return <Derevo5 tex={{ p: t('P(A)=') }} />;
    case 'do-uspeha':
      return <DoUspeha5 />;
    default:
      return null;
  }
}

/** Куда ведут кнопки главы: тренажёр с методом и опорные задачи метода. */
function ssylki(metod: string): { trenazher: string; opornye: string } {
  const est = yarlyki(bank5Pool(), 5).some((y) => y.id === metod);
  const blok = PODGOTOVKA_5.find((b) => b.metod === metod);
  return {
    trenazher: est ? href(trenazherHref45(5), metod) : trenazherHref45(5),
    opornye: blok === undefined ? opornyeHref45(5) : blokHref45(5, blok.id),
  };
}

export function GlavaMetoda5({ metod }: { metod: string }) {
  const g = glavaPoMetodu5(metod);
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
              <Link className="stk-ssylka" href={teoriyaMetodaHref45(4, g.svyaz.metod4)}>
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
