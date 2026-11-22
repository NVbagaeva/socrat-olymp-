'use client';

import Link from 'next/link';
import { Fragment, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { EGE_CELI, EGE_KNOPKA } from '@/config/ege-countdown';
import { frazaDnya } from '@/content/egeFrazy';
import {
  dve,
  ostalos,
  slovami,
  slovoChasov,
  slovoDney,
  slovoMinut,
  slovoSekund,
  sostoyanie,
  type Sostoyanie,
} from '@/lib/egeCountdown';
import { skriptDoZagruzki } from './doZagruzki';

export type VidOtschyota = 'koltso' | 'karty' | 'lenta';

type Props = {
  /** Момент сборки страницы: с него начинается разметка в HTML. */
  sborka: number;
  vid: VidOtschyota;
  /** Куда ведёт «Начать тренировку». */
  hrefKnopki: string;
  /** Стайлгайд: показать плашку так, будто сейчас этот момент. */
  demo?: number;
};

/**
 * Плашка обратного отсчёта. В HTML — числа на момент сборки, до загрузки
 * кода их правит скрипт doZagruzki.ts, после — ведёт этот компонент:
 * первый проход повторяет HTML (гидрация без расхождений), а эффект до
 * отрисовки ставит настоящее время и включает перелистывание цифр.
 */
export function EgeOtschyotKlient({ sborka, vid, hrefKnopki, demo }: Props) {
  const [t, setT] = useState({ now: demo ?? sborka, zhivoy: false });
  const koren = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  useLayoutEffect(() => {
    const sdvig = demo === undefined ? 0 : demo - Date.now();
    let taymer: ReturnType<typeof setTimeout> | undefined;
    const tik = () => {
      clearTimeout(taymer);
      const now = Date.now() + sdvig;
      setT({ now, zhivoy: true });
      const s = sostoyanie(now, EGE_CELI);
      /* Следующий тик — ровно на смене секунды; в день экзамена — в полночь. */
      if (s) taymer = setTimeout(tik, Math.max(20, s.doTika));
    };
    tik();
    koren.current?.removeAttribute('data-eo-zhdyot');
    koren.current?.removeAttribute('data-eo-ustarel');
    /* Вкладку вернули из фона — таймеры там замирают, пересчитать сразу. */
    const vernulis = () => {
      if (!document.hidden) tik();
    };
    document.addEventListener('visibilitychange', vernulis);
    return () => {
      clearTimeout(taymer);
      document.removeEventListener('visibilitychange', vernulis);
    };
  }, [demo]);

  /* Кольцо и полоса «наливаются» при первом появлении на экране — только
     если плашка была за его краем: видимую не дёргаем. */
  useLayoutEffect(() => {
    const el = koren.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    let pervyy = true;
    const io = new IntersectionObserver(
      ([zapis]) => {
        if (zapis?.isIntersecting) {
          if (!pervyy) el.setAttribute('data-eo-vhod', '');
          io.disconnect();
        }
        pervyy = false;
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const s = sostoyanie(t.now, EGE_CELI);
  if (!s) return null;
  const { cel, faza } = s;
  const zh = t.zhivoy;

  const zagolovok =
    faza === 'segodnya' ? (
      <h2 className="eo__podpis eo__podpis--prazdnik">{cel.segodnya}</h2>
    ) : (
      <h2 className="eo__podpis">
        {cel.podpis}{' '}
        <span data-eo-w="v" suppressHydrationWarning>
          {faza === 'dni' ? ostalos(s.dni) : 'осталось'}
        </span>
      </h2>
    );

  const fraza =
    faza === 'segodnya' ? (
      <p className="eo__fraza eo__fraza--udachi">{cel.segodnyaTekst}</p>
    ) : (
      <p className="eo__fraza">{faza === 'sutki' ? cel.zavtraSovet : frazaDnya(s.den, s.dni)}</p>
    );

  const deystviya = (
    <div className="eo__deystviya">
      {faza === 'segodnya' ? (
        <p className="eo__nachalo">Начало в {cel.vremya} по московскому времени</p>
      ) : (
        <Link className="btn btn--primary btn--lg eo__knopka" href={hrefKnopki}>
          {EGE_KNOPKA}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </Link>
      )}
      {cel.proekt ? <p className="eo__prim">{cel.primechanie}</p> : null}
    </div>
  );

  const dni = (
    <span className="eo__dni" aria-hidden="true">
      <Chislo znachenie={String(s.dni)} kod="d" zhivoy={zh} krupno />
      <span className="eo__dney" data-eo-w="d" suppressHydrationWarning>
        {slovoDney(s.dni)}
      </span>
    </span>
  );
  const zavtra = <span className="eo__zavtra">{cel.zavtra}</span>;
  const god = (
    <p className="eo__god">
      Учебный год пройден на{' '}
      <b>
        <span data-eo-n="p" suppressHydrationWarning>
          {Math.floor(s.progress * 100)}
        </span>
        %
      </b>
    </p>
  );

  let vnutri: ReactNode;
  if (vid === 'koltso') {
    vnutri = (
      <div className="eo__setka">
        {zagolovok}
        <div className="eo__figura">
          <Kolco id={id}>
            {faza === 'dni' ? dni : null}
            {faza === 'sutki' ? (
              <>
                <Taymer s={s} zhivoy={zh} krupno />
                {zavtra}
              </>
            ) : null}
            {faza === 'segodnya' ? (
              <span className="eo__den" aria-hidden="true">
                <span className="eo-ch eo-ch--krupno">
                  <span className="eo-c__n">{cel.dataSlovami.split(' ')[0]}</span>
                </span>
                <span className="eo__dney">{cel.dataSlovami.split(' ')[1]}</span>
              </span>
            ) : null}
          </Kolco>
          {god}
        </div>
        <div className="eo__telo">
          {faza === 'dni' ? <Taymer s={s} zhivoy={zh} /> : null}
          {fraza}
          {deystviya}
        </div>
      </div>
    );
  } else if (vid === 'karty') {
    vnutri = (
      <div className="eo__stolbik">
        {zagolovok}
        {faza === 'segodnya' ? null : (
          <div className="eo__karty" aria-hidden="true">
            {faza === 'dni' ? (
              <Karta
                kod="d"
                n={s.dni}
                znachenie={String(s.dni)}
                slovo={slovoDney}
                zhivoy={zh}
                glavnaya
              />
            ) : null}
            <Karta kod="h" n={s.chasy} znachenie={dve(s.chasy)} slovo={slovoChasov} zhivoy={zh} />
            <Karta kod="m" n={s.minuty} znachenie={dve(s.minuty)} slovo={slovoMinut} zhivoy={zh} />
            <Karta
              kod="s"
              n={s.sekundy}
              znachenie={dve(s.sekundy)}
              slovo={slovoSekund}
              zhivoy={zh}
            />
          </div>
        )}
        {faza === 'sutki' ? zavtra : null}
        <Polosa>{god}</Polosa>
        {fraza}
        {deystviya}
      </div>
    );
  } else {
    vnutri = (
      <div className="eo__lenta">
        <div className="eo__l-tekst">
          {zagolovok}
          {fraza}
        </div>
        {faza === 'segodnya' ? null : (
          <div className="eo__l-schyot">
            {faza === 'dni' ? dni : zavtra}
            <Taymer s={s} zhivoy={zh} krupno={faza === 'sutki'} />
          </div>
        )}
        {deystviya}
        <Polosa>{god}</Polosa>
      </div>
    );
  }

  return (
    <>
      <div
        ref={koren}
        className={clsx('eo', `eo--${vid}`, `eo--${faza}`, zh && 'eo--zhivoy')}
        data-eo=""
        data-eo-cel={s.idx}
        data-eo-faza={faza}
        data-eo-dni={s.dni}
        style={{ '--eo-p': s.progress } as React.CSSProperties}
        suppressHydrationWarning
      >
        <span className="eo__svet" aria-hidden="true" />
        {faza === 'segodnya' ? <Iskry /> : null}
        <p className="sr-only">{slovami(s)}</p>
        {vnutri}
      </div>
      {demo === undefined ? (
        <script dangerouslySetInnerHTML={{ __html: skriptDoZagruzki(EGE_CELI) }} />
      ) : null}
    </>
  );
}

/**
 * Число. До загрузки кода — одним текстом (его правит doZagruzki.ts),
 * потом — по цифрам, каждая перелистывается сама. `celikom` — число
 * меняется целиком, одной карточкой.
 */
function Chislo({
  znachenie,
  kod,
  zhivoy,
  krupno,
  celikom,
}: {
  znachenie: string;
  kod: string;
  zhivoy: boolean;
  krupno?: boolean;
  celikom?: boolean;
}) {
  const klass = clsx('eo-ch', krupno && 'eo-ch--krupno');
  if (!zhivoy) {
    return (
      <span className={klass}>
        <span className="eo-c__n" data-eo-n={kod} suppressHydrationWarning>
          {znachenie}
        </span>
      </span>
    );
  }
  const chasti = celikom ? [znachenie] : [...znachenie];
  return (
    <span className={klass}>
      {chasti.map((c, i) => (
        /* Ключ — разряд справа: при 100 → 99 цифры остаются на местах. */
        <Cifra key={chasti.length - i} ch={c} />
      ))}
    </span>
  );
}

/** Одна цифра: новая выкатывается сверху, прежняя уходит вниз. */
function Cifra({ ch }: { ch: string }) {
  const [s, setS] = useState({ byl: '', stal: ch });
  let { byl } = s;
  if (s.stal !== ch) {
    byl = s.stal;
    setS({ byl, stal: ch });
  }
  return (
    <span className="eo-c">
      <span key={ch} className={clsx('eo-c__n', byl && 'eo-c__n--in')}>
        {ch}
      </span>
      {byl ? (
        <span key={`-${byl}`} className="eo-c__n eo-c__n--out">
          {byl}
        </span>
      ) : null}
    </span>
  );
}

function Taymer({ s, zhivoy, krupno }: { s: Sostoyanie; zhivoy: boolean; krupno?: boolean }) {
  const edinicy = [
    { kod: 'h', n: s.chasy, slovo: slovoChasov },
    { kod: 'm', n: s.minuty, slovo: slovoMinut },
    { kod: 's', n: s.sekundy, slovo: slovoSekund },
  ];
  return (
    <div className={clsx('eo__taymer', krupno && 'eo__taymer--krupno')} aria-hidden="true">
      {edinicy.map((e, i) => (
        <Fragment key={e.kod}>
          {i > 0 ? <span className="eo__dvoetochie">:</span> : null}
          <span className="eo__ed">
            <Chislo znachenie={dve(e.n)} kod={e.kod} zhivoy={zhivoy} />
            <span className="eo__slovo" data-eo-w={e.kod} suppressHydrationWarning>
              {e.slovo(e.n)}
            </span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function Karta({
  kod,
  n,
  znachenie,
  slovo,
  zhivoy,
  glavnaya,
}: {
  kod: string;
  n: number;
  znachenie: string;
  slovo: (n: number) => string;
  zhivoy: boolean;
  glavnaya?: boolean;
}) {
  return (
    <span className={clsx('eo__karta', glavnaya && 'eo__karta--glavnaya')}>
      <span className="eo__k-steklo">
        <Chislo znachenie={znachenie} kod={kod} zhivoy={zhivoy} celikom />
      </span>
      <span className="eo__slovo" data-eo-w={kod} suppressHydrationWarning>
        {slovo(n)}
      </span>
    </span>
  );
}

/** Стеклянное кольцо «пройдено учебного года»; в центре — содержимое. */
function Kolco({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="eo__kolco">
      <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`eo-g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffc27a" />
            <stop offset="0.5" stopColor="#f5a04a" />
            <stop offset="1" stopColor="#e07a2f" />
          </linearGradient>
        </defs>
        <circle className="eo__k-lozhe" cx="100" cy="100" r="86" />
        <circle className="eo__k-kray" cx="100" cy="100" r="93.5" />
        <circle className="eo__k-kray" cx="100" cy="100" r="78.5" />
        <circle className="eo__k-svet" cx="100" cy="100" r="86" pathLength="100" />
        <circle
          className="eo__k-hod"
          cx="100"
          cy="100"
          r="86"
          pathLength="100"
          stroke={`url(#eo-g-${id})`}
        />
        <g className="eo__k-golova">
          <circle cx="100" cy="14" r="3.2" />
        </g>
      </svg>
      <div className="eo__centr">{children}</div>
    </div>
  );
}

/** Тот же прогресс полосой — для вариантов без кольца. */
function Polosa({ children }: { children: ReactNode }) {
  return (
    <div className="eo__polosa">
      <span className="eo__p-lozhe" aria-hidden="true">
        <span className="eo__p-hod" />
      </span>
      {children}
    </div>
  );
}

/* Праздничные блики дня экзамена: [слева %, размер px, задержка с, длительность с, цвет]. */
const ISKRY: [number, number, number, number, 'o' | 's' | 't'][] = [
  [6, 10, 0, 7, 'o'],
  [14, 6, 2.4, 9, 's'],
  [22, 14, 1.1, 8, 't'],
  [31, 7, 3.6, 10, 'o'],
  [39, 11, 0.6, 7.5, 's'],
  [47, 5, 4.2, 9.5, 'o'],
  [55, 13, 1.8, 8.5, 's'],
  [63, 8, 3.1, 7, 't'],
  [71, 6, 0.3, 10, 'o'],
  [79, 12, 2.9, 8, 's'],
  [87, 7, 1.4, 9, 'o'],
  [94, 10, 4.6, 7.5, 't'],
];

function Iskry() {
  return (
    <span className="eo__iskry" aria-hidden="true">
      {ISKRY.map(([x, r, zad, dl, cvet]) => (
        <i
          key={x}
          className={`eo__iskra eo__iskra--${cvet}`}
          style={{
            left: `${x}%`,
            width: r,
            height: r,
            animationDelay: `${zad}s`,
            animationDuration: `${dl}s`,
          }}
        />
      ))}
    </span>
  );
}
