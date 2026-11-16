import { LinkPoNamereniyu } from './LinkPoNamereniyu';
import type { ReactNode } from 'react';
import './kartochki-tipov.css';

/** Ссылка карточки: на разобранный пример или на главу теории. */
export interface SsylkaTipa {
  href: string;
  label: ReactNode;
  /** «primer» — разобранный пример (треугольник «играть»), «glava» — глава (книга). */
  vid: 'primer' | 'glava';
}

export interface KartochkaTipa {
  id: string;
  title: ReactNode;
  /** Метка у заголовка («Скоро»). */
  metka?: ReactNode;
  /** Строки под заголовком: формула, пояснение, подтипы. */
  telo?: ReactNode;
  ssylki: readonly SsylkaTipa[];
}

function IkPrimer() {
  return (
    <svg className="tipk__ik" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" />
    </svg>
  );
}

function IkGlava() {
  return (
    <svg className="tipk__ik" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M2 3.5c2-.8 4-.8 6 .6 2-1.4 4-1.4 6-.6v9c-2-.8-4-.8-6 .6-2-1.4-4-1.4-6-.6zM8 4.1v9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Ssylka({ ssylka }: { ssylka: SsylkaTipa }) {
  const className = `tipk__ssylka tipk__ssylka--${ssylka.vid}`;
  const telo = (
    <>
      {ssylka.vid === 'primer' ? <IkPrimer /> : <IkGlava />}
      <span>{ssylka.label}</span>
    </>
  );
  /* Якорь на этой же странице — обычная ссылка: Link с одним «#…»
     не нужен и не прокручивает к главе под липкой лентой. */
  return ssylka.href.startsWith('#') ? (
    <a className={className} href={ssylka.href}>
      {telo}
    </a>
  ) : (
    <LinkPoNamereniyu className={className} href={ssylka.href}>
      {telo}
    </LinkPoNamereniyu>
  );
}

/**
 * Карточки типов задач — общие для всего сайта (теория №3, «О задании»
 * №3, №14, №15): «Стеклянная сцена», белое и голубое стекло чередуются
 * шахматкой при любом числе колонок, номер — синим кружком, ссылки —
 * пилюлями с иконками. Стили — kartochki-tipov.css.
 */
export function KartochkiTipov({
  tipy,
  nomera = true,
  label,
}: {
  tipy: readonly KartochkaTipa[];
  /** Номер-кружок слева от заголовка. */
  nomera?: boolean;
  label?: string;
}) {
  return (
    <div className="tipk">
      <ul className="tipk__setka" {...(label === undefined ? {} : { 'aria-label': label })}>
        {tipy.map((tip, i) => (
          <li key={tip.id} className={nomera ? 'tipk__karta' : 'tipk__karta tipk__karta--bez-no'}>
            {nomera ? (
              <span className="tipk__no" aria-hidden="true">
                {i + 1}
              </span>
            ) : null}
            <span className="tipk__telo">
              <span className="tipk__head">
                <span className="tipk__title">{tip.title}</span>
                {tip.metka ?? null}
              </span>
              {tip.telo ?? null}
            </span>
            {tip.ssylki.length === 0 ? null : (
              <span className="tipk__ssylki">
                {tip.ssylki.map((s) => (
                  <Ssylka key={s.href} ssylka={s} />
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
