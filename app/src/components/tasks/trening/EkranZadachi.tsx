'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Ikonka, Metka, ShagiResheniya, type Shag } from '../steklo';

export type SostoyanieZadachi = 'vvod' | 'verno' | 'neverno' | 'razbor';

export interface EkranZadachiLabels {
  otvet: string;
  placeholder: string;
  proverit: string;
  podskazka: string;
  reshenie: string;
  skrytReshenie: string;
  pohozhaya: string;
  dalshe: string;
  itogi: string;
  otlozhit: string;
  otlozheno: string;
  verno: string;
  vernoLead: string;
  neverno: string;
  nevernoLead: string;
  sRazborom: string;
  sRazboromLead: string;
  shagi: string;
  bezPodskazok: string;
  iz: string;
}

export interface EkranZadachiProps {
  /** Номер текущей задачи (с единицы) и сколько всего. */
  nomer: number;
  vsego: number;
  /** Название типа над условием, HTML. */
  tipHtml: string;
  uslovieHtml: string;
  value: string;
  onValue: (value: string) => void;
  sostoyanie: SostoyanieZadachi;
  onCheck: () => void;
  /** Подсказка: текст (HTML), открыта ли, открыть. null — подсказок нет. */
  podskazka: { html: string; open: boolean; onOpen: () => void } | null;
  /** Решение по шагам: открыто ли, переключить. null — решения до итогов нет. */
  reshenie: { shagi: Shag[]; open: boolean; onToggle: () => void } | null;
  onPohozhaya?: () => void;
  onNext: () => void;
  /** Последняя задача: «Дальше» становится «К итогам». */
  last: boolean;
  zakladka: { on: boolean; onToggle: () => void } | null;
  /** Правильный ответ, если его показывать после неверного (режим без подсказок — нет). */
  pravilnyOtvet?: string | null;
  bezPodskazok?: boolean;
  labels: EkranZadachiLabels;
  /** Под условием: например, секундомер задачи. */
  pod?: ReactNode;
}

/**
 * Экран задачи: тонкая полоса прогресса, условие крупно, поле ответа с
 * кнопкой, вердикт, подсказка, решение по шагам, кнопки после ответа.
 * Состояние держит тренажёр; здесь — только вид и клавиатура (Enter —
 * проверить или дальше).
 */
export function EkranZadachi({
  nomer,
  vsego,
  tipHtml,
  uslovieHtml,
  value,
  onValue,
  sostoyanie,
  onCheck,
  podskazka,
  reshenie,
  onPohozhaya,
  onNext,
  last,
  zakladka,
  pravilnyOtvet,
  bezPodskazok = false,
  labels,
  pod,
}: EkranZadachiProps) {
  const input = useRef<HTMLInputElement>(null);
  const otvechen = sostoyanie === 'verno' || sostoyanie === 'razbor';
  const ready = value.trim() !== '';

  /* Новая задача — курсор в поле (на телефоне клавиатура сама не
     открывается без касания, и это правильно). */
  useEffect(() => {
    if (sostoyanie === 'vvod' && window.matchMedia('(pointer: fine)').matches) {
      input.current?.focus();
    }
  }, [nomer, sostoyanie]);

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    if (otvechen) {
      onNext();
    } else if (ready) {
      onCheck();
    }
  }

  /* Поле под клавиатурой телефона: подвести к видимой области. */
  function onFocus() {
    window.setTimeout(() => {
      input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 250);
  }

  return (
    <div className={clsx('trn-ekran', `trn-ekran--${sostoyanie}`)}>
      <div className="trn-polosa" aria-hidden="true">
        <span style={{ width: `${(nomer / Math.max(1, vsego)) * 100}%` }} />
      </div>

      <article className="trn-zadacha stk-glass">
        <div className="trn-zadacha__verh">
          <Metka>
            <span dangerouslySetInnerHTML={{ __html: tipHtml }} />
          </Metka>
          <span className="trn-zadacha__nomer">
            {nomer} {labels.iz} {vsego}
          </span>
          {zakladka === null ? null : (
            <button
              type="button"
              className={clsx(
                'stk-kruglaya stk-kruglaya--tihaya trn-zakladka',
                zakladka.on && 'is-on',
              )}
              onClick={zakladka.onToggle}
              aria-pressed={zakladka.on}
              aria-label={zakladka.on ? labels.otlozheno : labels.otlozhit}
              title={zakladka.on ? labels.otlozheno : labels.otlozhit}
            >
              <Ikonka name={zakladka.on ? 'zakladka-on' : 'zakladka'} />
            </button>
          )}
        </div>
        <div className="trn-uslovie" dangerouslySetInnerHTML={{ __html: uslovieHtml }} />
        {pod}
      </article>

      <div className="trn-otvetnaya stk-glass">
        <label className="trn-pole">
          <span className="stk-podpis">{labels.otvet}</span>
          <span className="trn-pole__ryad">
            <input
              ref={input}
              className="trn-input"
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint={otvechen ? 'next' : 'done'}
              placeholder={labels.placeholder}
              value={value}
              readOnly={otvechen}
              aria-invalid={sostoyanie === 'neverno' || undefined}
              onChange={(e) => onValue(e.target.value)}
              onKeyDown={onKey}
              onFocus={onFocus}
            />
            {otvechen ? null : (
              <button
                type="button"
                className="stk-btn stk-btn--primary stk-btn--lg"
                onClick={onCheck}
                disabled={!ready}
              >
                {labels.proverit}
              </button>
            )}
          </span>
        </label>

        {sostoyanie === 'verno' || sostoyanie === 'neverno' || sostoyanie === 'razbor' ? (
          <div
            className={clsx(
              'trn-verdikt',
              sostoyanie === 'verno'
                ? 'trn-verdikt--da'
                : sostoyanie === 'neverno'
                  ? 'trn-verdikt--net'
                  : 'trn-verdikt--razbor',
            )}
            role="status"
          >
            <span className="trn-verdikt__ico">
              <Ikonka
                name={sostoyanie === 'verno' ? 'da' : sostoyanie === 'neverno' ? 'net' : 'lampa'}
              />
            </span>
            <span className="trn-verdikt__text">
              <b>
                {sostoyanie === 'verno'
                  ? labels.verno
                  : sostoyanie === 'neverno'
                    ? labels.neverno
                    : labels.sRazborom}
              </b>
              <span>
                {sostoyanie === 'verno'
                  ? labels.vernoLead
                  : sostoyanie === 'neverno'
                    ? labels.nevernoLead
                    : labels.sRazboromLead}
                {sostoyanie === 'razbor' && pravilnyOtvet != null ? (
                  <>
                    {' '}
                    {labels.otvet}: <b>{pravilnyOtvet}</b>.
                  </>
                ) : null}
              </span>
            </span>
          </div>
        ) : null}

        {bezPodskazok && sostoyanie !== 'vvod' ? (
          <p className="trn-snoska">{labels.bezPodskazok}</p>
        ) : null}

        {podskazka !== null && !otvechen ? (
          podskazka.open ? (
            <p className="trn-podskazka" role="note">
              <Ikonka name="lampa" />
              <span dangerouslySetInnerHTML={{ __html: podskazka.html }} />
            </p>
          ) : (
            <button type="button" className="trn-podskazka-knopka" onClick={podskazka.onOpen}>
              <Ikonka name="lampa" /> {labels.podskazka}
            </button>
          )
        ) : null}

        {reshenie !== null && reshenie.open ? (
          <div className="trn-reshenie" role="region" aria-label={labels.shagi}>
            <p className="stk-podpis">{labels.shagi}</p>
            <ShagiResheniya shagi={reshenie.shagi} />
          </div>
        ) : null}

        <div className="trn-knopki">
          {otvechen ? (
            <button
              type="button"
              className="stk-btn stk-btn--primary stk-btn--lg trn-knopki__glavnaya"
              onClick={onNext}
            >
              {last ? labels.itogi : labels.dalshe} <Ikonka name="strelka" />
            </button>
          ) : null}
          {reshenie !== null && sostoyanie !== 'vvod' ? (
            <button
              type="button"
              className="stk-btn stk-btn--tihaya"
              onClick={reshenie.onToggle}
              aria-expanded={reshenie.open}
            >
              {reshenie.open ? labels.skrytReshenie : labels.reshenie}
            </button>
          ) : null}
          {onPohozhaya !== undefined && sostoyanie !== 'vvod' ? (
            <button type="button" className="stk-btn stk-btn--tihaya" onClick={onPohozhaya}>
              {labels.pohozhaya}
            </button>
          ) : null}
          {sostoyanie === 'neverno' ? (
            <button type="button" className="stk-btn stk-btn--tihaya" onClick={onNext}>
              {last ? labels.itogi : labels.dalshe}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
