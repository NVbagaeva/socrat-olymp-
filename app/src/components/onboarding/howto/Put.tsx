'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { HOWTO, SNIMOK_RAZMER, type HowtoStep } from '@/content/kakPolzovatsya';
import { Kartinka, snimokPut, type HowtoFaily } from './Kartinka';

/* На сервере useLayoutEffect ругается; дорожку меряем только в браузере. */
const useIzomorfnyy = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * «Как работать с сайтом» / «С чего начать» — путь по сайту.
 *
 * Шаги — вкладки (role="tab"): нажатие, стрелки, Home/End и кнопки
 * «Назад / Дальше» выбирают шаг. Шаги соединены дорожкой: она
 * заполняется оранжевым до выбранного шага. Справа от пути (на
 * телефоне — под выбранным шагом) снимок настоящей страницы, строка
 * пояснения и кнопка «Открыть →».
 *
 * Раскладка — одна сетка: шаги в первой колонке по строкам, снимок
 * во второй через все строки. На телефоне колонка одна, и снимок по
 * order встаёт сразу под выбранным шагом. Список шагов — display:
 * contents, чтобы шаги и снимок были соседями в одной сетке.
 */
export function Put({
  title,
  hint,
  steps,
  faily,
}: {
  title: string;
  hint: string;
  steps: readonly HowtoStep[];
  faily: HowtoFaily;
}) {
  const id = useId();
  const [sel, setSel] = useState(0);
  const [nazhato, setNazhato] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const setka = useRef<HTMLDivElement>(null);
  const [dorozhka, setDorozhka] = useState<{ top: number; h: number; zal: number } | null>(
    null,
  );

  const vybrat = useCallback(
    (i: number, fokus = false) => {
      const n = Math.max(0, Math.min(steps.length - 1, i));
      setSel(n);
      setNazhato(true);
      if (fokus) tabs.current[n]?.focus();
    },
    [steps.length],
  );

  /* Дорожка: от центра первого значка до центра последнего, заливка —
     до центра выбранного. Меряем по значкам: шаги разной высоты, а на
     телефоне под выбранным шагом раскрыт снимок. */
  const izmerit = useCallback(() => {
    const root = setka.current;
    if (root === null) return;
    const r = root.getBoundingClientRect();
    const centr = (i: number) => {
      const ik = tabs.current[i]?.querySelector('.put__ikonka');
      if (ik === null || ik === undefined) return 0;
      const b = ik.getBoundingClientRect();
      return b.top + b.height / 2 - r.top;
    };
    const top = centr(0);
    const niz = centr(steps.length - 1);
    setDorozhka({ top, h: Math.max(0, niz - top), zal: Math.max(0, centr(sel) - top) });
  }, [sel, steps.length]);

  useIzomorfnyy(() => {
    izmerit();
  }, [izmerit]);
  useEffect(() => {
    const root = setka.current;
    if (root === null || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => izmerit());
    ro.observe(root);
    return () => ro.disconnect();
  }, [izmerit]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = steps.length;
    let next: number | null = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    vybrat(next, true);
  };

  const shag = steps[sel]!;
  const snimok = faily[snimokPut(shag.snimok)];
  const T = HOWTO.put;

  return (
    <section className="put" aria-labelledby={`${id}-h`}>
      <div className="put__shapka">
        <h2 className="howto__h" id={`${id}-h`}>
          {title}
        </h2>
        <p className={clsx('put__hint', nazhato && 'is-skryt')} aria-hidden={nazhato || undefined}>
          {hint}
        </p>
      </div>

      <div
        className="put__setka"
        ref={setka}
        style={{ '--put-n': steps.length, '--put-sel': sel } as CSSProperties}
      >
        {dorozhka === null ? null : (
          <span
            className="put__dorozhka"
            aria-hidden="true"
            style={
              {
                '--put-top': `${dorozhka.top}px`,
                '--put-h': `${dorozhka.h}px`,
                '--put-zal': `${dorozhka.zal}px`,
              } as CSSProperties
            }
          >
            <span className="put__zalivka" />
          </span>
        )}

        <div className="put__spisok" role="tablist" aria-label={title} aria-orientation="vertical">
          {steps.map((s, i) => (
            <button
              key={s.title}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-t${i}`}
              aria-selected={i === sel}
              aria-controls={`${id}-p`}
              tabIndex={i === sel ? 0 : -1}
              className={clsx('put__shag', i === sel && 'is-active', i < sel && 'is-proyden')}
              style={{ '--ryad': i + 1, '--poryadok': i * 2 } as CSSProperties}
              onClick={() => vybrat(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className="put__ikonka">
                <Kartinka faily={faily} id={s.ikonka} razmer="znachok" px={48} alt="" />
                <span className="put__nomer">{i + 1}</span>
              </span>
              <span className="put__tekst">
                <span className="put__title">{s.title}</span>
                <span className="put__text">{s.text}</span>
              </span>
            </button>
          ))}
        </div>

        <div
          className="put__panel"
          role="tabpanel"
          id={`${id}-p`}
          aria-labelledby={`${id}-t${sel}`}
          style={{ '--poryadok': sel * 2 + 1 } as CSSProperties}
        >
          <figure className="put__snimok" key={sel}>
            <div className="put__ramka">
              {snimok === undefined ? (
                <span className="put__zaglushka" aria-hidden="true" />
              ) : (
                <img
                  src={snimok}
                  alt={shag.snimokAlt}
                  width={SNIMOK_RAZMER.width}
                  height={SNIMOK_RAZMER.height}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <figcaption className="put__podpis">
              <span>{shag.poyasnenie}</span>
              <Link className="btn btn--primary put__otkryt" href={shag.href}>
                {T.otkryt}
              </Link>
            </figcaption>
          </figure>
        </div>

        <div className="put__nav" style={{ '--ryad-nav': steps.length + 1 } as CSSProperties}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => vybrat(sel - 1)}
            disabled={sel === 0}
          >
            {T.nazad}
          </button>
          <span className="put__schet" aria-live="polite">
            {T.shag(sel + 1, steps.length)}
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => vybrat(sel + 1)}
            disabled={sel === steps.length - 1}
          >
            {T.dalshe}
          </button>
        </div>
      </div>
    </section>
  );
}
