'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { VITRINA, type PunktVitriny, type Snimok } from '@/content/vitrina';
import { assetUrl } from '@/lib/assetUrl';
import { Prosmotr, type SlaydProsmotra } from './Prosmotr';
import './vitrina.css';

const kadr = (imya: string) =>
  `${assetUrl(`/images/glavnaya/vitrina-${imya}-520.webp`)} 520w, ${assetUrl(`/images/glavnaya/vitrina-${imya}-1040.webp`)} 1040w`;

/** Кадр снимка: бумага или экран на стекле. Грузится лениво. */
function Kadr({ s, className, sizes }: { s: Snimok; className: string; sizes: string }) {
  return (
    <img
      className={className}
      srcSet={kadr(s.imya)}
      sizes={sizes}
      src={assetUrl(`/images/glavnaya/vitrina-${s.imya}-520.webp`)}
      alt=""
      width={s.w}
      height={s.h}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

/** Заголовок с одним-двумя словами цветом. */
function SAkcentom({ tekst, akcent, klass }: { tekst: string; akcent: string; klass: string }) {
  const i = tekst.indexOf(akcent);
  if (i < 0) return <>{tekst}</>;
  return (
    <>
      {tekst.slice(0, i)}
      <span className={klass}>{akcent}</span>
      {tekst.slice(i + akcent.length)}
    </>
  );
}

/* Сцена не шире 309 px (норма hero), снимок в ней — до 86 % ширины. */
const SIZES = '270px';

/**
 * Сцена пункта: снимки в своей раскладке (веер, внахлёст, коллаж).
 * Раскладку задаёт id пункта — vitrina.css.
 */
function Scena({
  punkt,
  kletka,
  onOtkryt,
}: {
  punkt: PunktVitriny;
  kletka: boolean;
  onOtkryt: () => void;
}) {
  const snimki = punkt.id === 'listy' ? [punkt.snimki[kletka ? 1 : 0] as Snimok] : punkt.snimki;
  return (
    <button
      type="button"
      className={clsx('vit-scena', `vit-scena--${punkt.id}`)}
      data-ill="hero"
      onClick={onOtkryt}
      aria-label={`Рассмотреть: ${punkt.zagolovok}`}
    >
      <span className="vit-scena__oreol" aria-hidden="true" />
      {snimki.map((s, i) => (
        <Kadr key={`${s.imya}-${i}`} s={s} className={`vit-kadr vit-kadr--${i}`} sizes={SIZES} />
      ))}
      {punkt.id === 'onlayn' ? (
        <span className="vit-metka-pdf" aria-hidden="true">
          Печать · PDF
        </span>
      ) : null}
      <span className="vit-scena__lupa" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L20 20M8 10.5h5M10.5 8v5" />
        </svg>
        Рассмотреть
      </span>
    </button>
  );
}

function Punkt({
  p,
  i,
  aktivnyy,
  onVybor,
}: {
  p: PunktVitriny;
  i: number;
  aktivnyy: boolean;
  onVybor: (i: number) => void;
}) {
  return (
    <button
      type="button"
      className={clsx('vit-punkt', aktivnyy && 'is-aktivnyy')}
      aria-pressed={aktivnyy}
      onClick={() => onVybor(i)}
    >
      <span className="vit-punkt__no">{String(i + 1).padStart(2, '0')}</span>
      <span className="vit-punkt__tekst">
        <span className="vit-punkt__z">{p.zagolovok}</span>
        <span className="vit-punkt__p">{p.tekst}</span>
      </span>
    </button>
  );
}

/**
 * Пункты бегущей строкой: набор и его копия едут справа налево,
 * translateX от 0 до −50 % (vitrina.css, .vit-beg). Скорость — в CSS
 * (--vit-beg-skorost, px/с), длительность — от ширины набора: число
 * карточек (--n) × ширина карточки. Копия — aria-hidden и inert.
 * Пауза: наведение, палец на карточке, фокус с клавиатуры, блок вне
 * экрана (IntersectionObserver). prefers-reduced-motion — обычная
 * лента с прокруткой, без копии.
 */
function Begushchaya({
  punkty,
  aktivnyy,
  onVybor,
}: {
  punkty: readonly PunktVitriny[];
  aktivnyy: number;
  onVybor: (i: number) => void;
}) {
  const ramka = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ramka.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([z]) => {
      if (z?.isIntersecting) delete el.dataset.vne;
      else el.dataset.vne = '';
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const palec = (est: boolean) => (e: PointerEvent) => {
    const el = ramka.current;
    if (!el || e.pointerType === 'mouse') return;
    if (est) el.dataset.palec = '';
    else delete el.dataset.palec;
  };

  /* Фокус с клавиатуры на карточке за краем: ставим ленту так, чтобы
     карточка была посередине (лента стоит на паузе — :focus-visible). */
  const kFokusu = (e: FocusEvent<HTMLLIElement>) => {
    const el = ramka.current;
    const lenta = el?.firstElementChild as HTMLElement | null;
    if (!el || !lenta) return;
    el.scrollLeft = 0;
    const anim = lenta.getAnimations?.()[0];
    const dlit = anim?.effect?.getComputedTiming().duration;
    if (!anim || typeof dlit !== 'number' || dlit <= 0) return;
    const r = el.getBoundingClientRect();
    const k = e.currentTarget.getBoundingClientRect();
    if (k.left >= r.left && k.right <= r.right) return;
    const polovina = lenta.scrollWidth / 2;
    const x = e.currentTarget.offsetLeft - (el.clientWidth - k.width) / 2;
    const dolya = (((x % polovina) + polovina) % polovina) / polovina;
    anim.currentTime = dolya * dlit;
  };

  const nabor = (kopiya: boolean) => (
    <ol className="vit-beg__nabor" {...(kopiya ? { 'aria-hidden': true, inert: true } : {})}>
      {punkty.map((p, i) => (
        <li key={p.id} className="vit-beg__el" onFocus={kopiya ? undefined : kFokusu}>
          <Punkt p={p} i={i} aktivnyy={!kopiya && i === aktivnyy} onVybor={onVybor} />
        </li>
      ))}
    </ol>
  );

  return (
    <div
      ref={ramka}
      className="vit-beg"
      onPointerDown={palec(true)}
      onPointerUp={palec(false)}
      onPointerCancel={palec(false)}
      onPointerLeave={palec(false)}
    >
      <div className="vit-beg__lenta" style={{ '--n': punkty.length } as CSSProperties}>
        {nabor(false)}
        {nabor(true)}
      </div>
    </div>
  );
}

function Chast({
  vid,
  metka,
  zagolovok,
  akcent,
  lid,
  punkty,
  knopki,
  kletkaPodpisi,
  begushchaya = false,
}: {
  vid: 'gen' | 'trn';
  metka: string;
  zagolovok: string;
  akcent: string;
  lid: string;
  punkty: readonly PunktVitriny[];
  knopki: readonly { tekst: string; href: string; glavnaya: boolean }[];
  kletkaPodpisi?: { bez: string; s: string; podpis: string };
  /** Пункты — бегущей строкой (Begushchaya), а не вкладками. */
  begushchaya?: boolean;
}) {
  const [aktivnyy, setAktivnyy] = useState(0);
  const [kletka, setKletka] = useState(false);
  const [otkryt, setOtkryt] = useState<number | null>(null);
  const punkt = punkty[aktivnyy] ?? (punkty[0] as PunktVitriny);

  /* Просмотр листает все снимки части по порядку пунктов. */
  const slaydy: SlaydProsmotra[] = punkty.flatMap((p) => p.snimki);
  const nachalo = (i: number) =>
    punkty.slice(0, i).reduce((sum, p) => sum + p.snimki.length, 0) +
    (punkty[i]?.id === 'listy' && kletka ? 1 : 0);

  return (
    <section className={clsx('vit-chast', `vit-chast--${vid}`)} aria-labelledby={`vit-${vid}`}>
      <div className="vit-chast__tekst">
        <p className="vit-metka-chasti">{metka}</p>
        <h3 id={`vit-${vid}`} className="vit-chast__z">
          <SAkcentom tekst={zagolovok} akcent={akcent} klass="vit-akcent" />
        </h3>
        <p className="vit-chast__lid">{lid}</p>
      </div>

      <div className="vit-chast__scena">
        {punkt.id === 'listy' && kletkaPodpisi ? (
          <div className="vit-kletka" role="group" aria-label={kletkaPodpisi.podpis}>
            {[false, true].map((v) => (
              <button
                key={String(v)}
                type="button"
                className={clsx('vit-kletka__var', kletka === v && 'is-aktivnyy')}
                aria-pressed={kletka === v}
                onClick={() => setKletka(v)}
              >
                {v ? kletkaPodpisi.s : kletkaPodpisi.bez}
              </button>
            ))}
          </div>
        ) : null}
        <Scena
          key={punkt.id}
          punkt={punkt}
          kletka={kletka}
          onOtkryt={() => setOtkryt(nachalo(aktivnyy))}
        />
      </div>

      {begushchaya ? (
        <Begushchaya punkty={punkty} aktivnyy={aktivnyy} onVybor={setAktivnyy} />
      ) : (
        <ol className="vit-punkty">
          {punkty.map((p, i) => (
            <li key={p.id}>
              <Punkt p={p} i={i} aktivnyy={i === aktivnyy} onVybor={setAktivnyy} />
            </li>
          ))}
        </ol>
      )}
      {/* Телефон: пункты — полоса вкладок, описание выбранного — здесь. */}
      {/* В бегущей строке описание — в самих карточках. */}
      <p className={clsx('vit-opisanie', begushchaya && 'vit-opisanie--net')} aria-live="polite">
        {punkt.tekst}
      </p>

      <div className="vit-knopki">
        {knopki.map((k) => (
          <Link
            key={k.href}
            className={clsx(
              'vit-knopka',
              k.glavnaya ? 'vit-knopka--zalitaya' : 'vit-knopka--steklo',
            )}
            href={k.href}
          >
            {k.tekst}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12h13M12 6l6 6-6 6" />
            </svg>
          </Link>
        ))}
      </div>

      <Prosmotr slaydy={slaydy} nomer={otkryt} onNomer={setOtkryt} />
    </section>
  );
}

/**
 * Витрина возможностей на главной: генератор рабочих листов (тёплая
 * часть, для учителя) и тренажёр (синяя часть, для ученика). Настоящие
 * снимки страниц сайта — scripts/glavnaya/snimki-vecher.mjs; тексты —
 * content/vitrina.ts, заголовок блока — вариант zagolovok.
 */
export function Vitrina({
  zagolovok = 'a',
  posle,
}: {
  zagolovok?: 'a' | 'b';
  /** Часть после тренажёра — серверная (StereoChast: чертёж рисуется на сборке). */
  posle?: ReactNode;
}) {
  const z = VITRINA.zagolovki[zagolovok];
  const g = VITRINA.generator;
  const t = VITRINA.trenazher;
  return (
    <section className="band vit" id="how" aria-labelledby="vit-z">
      <div className="wrap">
        <h2 id="vit-z" className="vit__z">
          {/* Акцент синий: заголовок общий для всех частей, тёплый цвет —
              только у учительской (vitrina.css). */}
          <SAkcentom tekst={z.tekst} akcent={z.akcent} klass="vit-akcent" />
        </h2>
        <Chast
          vid="gen"
          metka={g.metka}
          zagolovok={g.zagolovok}
          akcent={g.akcent}
          lid={g.lid}
          punkty={g.punkty}
          knopki={g.knopki}
          kletkaPodpisi={g.kletka}
          begushchaya
        />
        <Chast
          vid="trn"
          metka={t.metka}
          zagolovok={t.zagolovok}
          akcent={t.akcent}
          lid={t.lid}
          punkty={t.punkty}
          knopki={[{ ...t.knopka, glavnaya: true }]}
        />
        {posle}
      </div>
    </section>
  );
}
