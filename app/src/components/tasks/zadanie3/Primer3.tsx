'use client';

import { clsx } from 'clsx';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ZhivoyChertezh3d } from '@/components/stereo/ZhivoyChertezh3d';
import { SHAPKA3 } from '@/content/zadanie3/spravka';
import { dataUrl } from '@/lib/dataUrl';
import { razdelBase } from '@/lib/paths';
import { telo } from '@/lib/solid/sechenie';
import type { Primer3 as Dannye } from '@/lib/zadanie3/primery';

/* Построитель сечения — отдельным куском: грузится по кнопке. */
const PostroitSechenie = lazy(() =>
  import('@/components/stereo/PostroitSechenie').then((m) => ({ default: m.PostroitSechenie })),
);

/**
 * Шаг, который ученик сейчас читает: последний шаг, чей верх поднялся
 * выше линии чтения (чуть ниже закреплённого чертежа). Выше всех шагов —
 * 0, чертёж условия.
 *
 * Шаг, выбранный нажатием, главнее линии чтения, пока ученик сам не
 * прокрутит страницу заметно (больше VYBOR_PX): нажатие подводит кнопку
 * к экрану, и эта прокрутка иначе сразу перебила бы выбор — короткие
 * шаги на телефоне все оказываются выше линии, и гас нажатый шаг.
 */
const VYBOR_PX = 48;

function useShagPoProkrutke(
  spisok: React.RefObject<HTMLOListElement | null>,
  chertezh: React.RefObject<HTMLDivElement | null>,
  vklyucheno: boolean,
  onShag: (n: number) => void,
  vybor: React.RefObject<number | null>,
) {
  useEffect(() => {
    const ol = spisok.current;
    if (ol === null || !vklyucheno) return undefined;
    let kadr = 0;
    const proverit = () => {
      kadr = 0;
      const y0 = vybor.current;
      if (y0 !== null) {
        if (Math.abs(window.scrollY - y0) <= VYBOR_PX) return;
        vybor.current = null;
      }
      const niz = chertezh.current?.getBoundingClientRect().bottom ?? 0;
      /* Линия чтения: под чертежом, но не ниже середины экрана. */
      const liniya = Math.min(Math.max(niz, 0) + 80, window.innerHeight * 0.6);
      const shagi = [...ol.children];
      let n = 0;
      shagi.forEach((li, i) => {
        if (li.getBoundingClientRect().top < liniya) n = i + 1;
      });
      const posledniy = shagi[shagi.length - 1];
      if (posledniy !== undefined && posledniy.getBoundingClientRect().bottom < 0) n = 0;
      onShag(n);
    };
    const naProkrutku = () => {
      if (kadr === 0) kadr = window.requestAnimationFrame(proverit);
    };
    window.addEventListener('scroll', naProkrutku, { passive: true });
    window.addEventListener('resize', naProkrutku);
    return () => {
      window.removeEventListener('scroll', naProkrutku);
      window.removeEventListener('resize', naProkrutku);
      if (kadr !== 0) window.cancelAnimationFrame(kadr);
    };
  }, [spisok, chertezh, vklyucheno, onShag, vybor]);
}

/**
 * Разобранный пример типа на вкладке «О задании» №3.
 *
 * Чертёж закреплён рядом с шагами решения: нажатие на шаг подсвечивает
 * на чертеже то, о чём этот шаг. На широком экране чертёж стоит слева,
 * шаги справа; на телефоне он закреплён сверху и не выше трети экрана,
 * шаги прокручиваются под ним, а кнопка сворачивает чертёж, если он
 * мешает читать. Чертёж вращается рукой.
 */
export function Primer3({
  primer,
  trenirovatHref,
  opornyeHref,
}: {
  primer: Dannye;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const [shag, setShag] = useState(0);
  const [svernut, setSvernut] = useState(false);
  const [sechenie, setSechenie] = useState(false);
  const spisok = useRef<HTMLOListElement>(null);
  const chertezh = useRef<HTMLDivElement>(null);
  const mozhnoSechenie = telo(primer.model) !== null;
  /* Чертёж идёт за чтением: шаг, до которого дочитали, построен на нём. */
  /* Где была прокрутка, когда шаг выбрали нажатием (null — не выбирали). */
  const vybor = useRef<number | null>(null);
  useShagPoProkrutke(spisok, chertezh, primer.shagovChertezha > 0 && !sechenie, setShag, vybor);
  const naChertezhe = Math.min(shag, primer.shagovChertezha);
  /* Подписи чертежу не показываются (кнопки шагов — в тексте решения),
     нужно только их число: по нему он понимает, что шаги есть. */
  const podpisi = Array.from({ length: primer.shagovChertezha + 1 }, () => '');
  return (
    <div className="kz-primer z3-primer">
      <p className="kz-primer__metka">{SHAPKA3.primer}</p>
      <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: primer.uslovieHtml }} />
      <div className="z3-primer__telo">
        <div ref={chertezh} className={clsx('z3-primer__chertezh', svernut && 'is-svernut')}>
          <div className="z3-primer__holst" hidden={svernut || sechenie}>
            <ZhivoyChertezh3d
              model={primer.model}
              svg={primer.svg}
              azimuth={primer.azimuth}
              elevation={primer.elevation}
              podpisi={podpisi}
              shag={naChertezhe}
              onShag={() => {}}
              bezNavigatsii
              tema="ekran"
            />
          </div>
          {sechenie && !svernut ? (
            <Suspense fallback={null}>
              <PostroitSechenie model={primer.model} />
            </Suspense>
          ) : null}
          <div className="z3-primer__panel">
            {sechenie ? null : (
              <p className="z3-primer__gde" aria-live="polite">
                {naChertezhe === 0 ? SHAPKA3.chertezhUsloviya : SHAPKA3.naChertezhe(naChertezhe)}
              </p>
            )}
            {mozhnoSechenie ? (
              <button
                type="button"
                className="stk-ssylka z3-primer__sechenie"
                aria-pressed={sechenie}
                aria-label={sechenie ? SHAPKA3.kRazboru : SHAPKA3.sechenieDlinno}
                onClick={() => {
                  setSechenie(!sechenie);
                  setSvernut(false);
                }}
              >
                {sechenie ? SHAPKA3.kRazboru : SHAPKA3.sechenie}
              </button>
            ) : null}
            <button
              type="button"
              className="stk-ssylka z3-primer__svernut"
              aria-expanded={!svernut}
              onClick={() => setSvernut(!svernut)}
            >
              {svernut ? SHAPKA3.razvernut : SHAPKA3.svernut}
            </button>
          </div>
        </div>
        <ol ref={spisok} className="z3-primer__shagi">
          {primer.shagi.map((s, i) => (
            <li key={i} className={clsx('z3-shag', shag === i + 1 && 'is-on')}>
              <button
                type="button"
                className="z3-shag__knopka"
                aria-pressed={shag === i + 1}
                title={SHAPKA3.shagKnopka}
                onClick={() => {
                  setSechenie(false);
                  vybor.current = window.scrollY;
                  setShag(shag === i + 1 ? 0 : i + 1);
                }}
              >
                <span className="z3-shag__no">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: s.chtoHtml }} />
              </button>
              {s.formulaHtml === '' ? null : (
                <div
                  className="stk-shag__formula"
                  dangerouslySetInnerHTML={{ __html: s.formulaHtml }}
                />
              )}
            </li>
          ))}
        </ol>
      </div>
      <p className="kz-lovushka">
        <b>{SHAPKA3.lovushka}.</b> <span dangerouslySetInnerHTML={{ __html: primer.opasnoHtml }} />
      </p>
      <p className="kz-otvet">
        {SHAPKA3.otvet}: <b dangerouslySetInnerHTML={{ __html: primer.otvetHtml }} />
      </p>
      <div className="kz-knopki">
        {/* Обычные ссылки: тренажёр читает тип из адреса при входе. */}
        <a className="stk-btn stk-btn--primary" href={trenirovatHref}>
          {SHAPKA3.trenirovat}
        </a>
        <a className="stk-btn stk-btn--tihaya" href={opornyeHref}>
          {SHAPKA3.opornye}
        </a>
      </div>
    </div>
  );
}

const KESH = new Map<string, Promise<Dannye>>();

function zagruzit(tip: string): Promise<Dannye> {
  let zhdyot = KESH.get(tip);
  if (zhdyot === undefined) {
    zhdyot = fetch(dataUrl(`${razdelBase(3)}/dannye/primer/${tip}.json`)).then((r) => {
      if (!r.ok) throw new Error(`${tip}.json: ${r.status}`);
      return r.json() as Promise<Dannye>;
    });
    KESH.set(tip, zhdyot);
    zhdyot.catch(() => {
      KESH.delete(tip);
    });
  }
  return zhdyot;
}

/**
 * Пример типа, который приезжает, когда ученик раскрыл карточку
 * (<details>). До этого в разметке только заглушка: страница не несёт
 * все пятнадцать примеров с чертежами сразу.
 */
export function Primer3Lazy({
  tip,
  trenirovatHref,
  opornyeHref,
}: {
  tip: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Dannye | null | 'net'>(null);

  useEffect(() => {
    const details = anchor.current?.closest('details');
    if (details === null || details === undefined) {
      return undefined;
    }
    let alive = true;
    let started = false;
    const load = () => {
      if (started || !details.open) {
        return;
      }
      started = true;
      zagruzit(tip)
        .then((dannye) => {
          if (alive) setPrimer(dannye);
        })
        .catch(() => {
          if (alive) setPrimer('net');
        });
    };
    load();
    details.addEventListener('toggle', load);
    return () => {
      alive = false;
      details.removeEventListener('toggle', load);
    };
  }, [tip]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        <p className="stk-lead">{primer === null ? SHAPKA3.primerZhdyot : SHAPKA3.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <Primer3 primer={primer} trenirovatHref={trenirovatHref} opornyeHref={opornyeHref} />
    </div>
  );
}
