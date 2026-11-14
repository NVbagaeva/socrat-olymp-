'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { AnswerInput, FormatHint } from '../otvet/AnswerInput';
import { Ikonka, Metka, ShagiResheniya, type PriznakDelimosti, type Shag } from '../steklo';

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
  /** Идентификатор задачи: data-task на карточке (проверки сайта, кабинет). */
  taskId?: string;
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
  /** Подсказка о записи ответа («1/4», «5 см»): попытка не тратится. */
  formatHint?: string | null;
  /** Подсказка: текст (HTML), открыта ли, открыть. null — подсказок нет. */
  podskazka: {
    html: string;
    /**
     * Подсказка-вопросы с кнопками (PodskazkaVoprosy): показывается вместо
     * текста. Ученик отвечает на вопросы и сам выходит на решение.
     */
    telo?: ReactNode;
    open: boolean;
    onOpen: () => void;
  } | null;
  /** Решение по шагам: открыто ли, переключить. null — решения до итогов нет. */
  reshenie: {
    shagi: Shag[];
    delimost?: PriznakDelimosti[];
    /** Под шагами: панель раздела («Считаем с умом»). */
    posle?: ReactNode;
    open: boolean;
    onToggle: () => void;
  } | null;
  onPohozhaya?: () => void;
  onNext: () => void;
  /** Последняя задача: «Дальше» становится «К итогам». */
  last: boolean;
  /** Кнопка «Отложить на потом» (components/zakladki/BookmarkButton). */
  zakladka?: ReactNode;
  bezPodskazok?: boolean;
  labels: EkranZadachiLabels;
  /** Под условием: например, секундомер задачи. */
  pod?: ReactNode;
  /** Чертёж задачи: над условием (стереометрия, планиметрия). */
  risunok?: ReactNode;
  /**
   * Своё поле ответа вместо числа: кнопки выбора (№13, «Определи тип»).
   * Значение и «Проверить» — те же: value держит выбранный вариант.
   */
  pole?: ReactNode;
  /** Можно ли проверять: у своего поля из нескольких частей (по умолчанию — значение не пустое). */
  gotovo?: boolean;
  /**
   * Условие — текст задачи, а не одно выражение: набирается обычным
   * кеглем по левому краю (у №8 выражение стоит крупно по центру).
   */
  tekst?: boolean;
  /**
   * Ответ выбором варианта вместо поля (№12): номер варианта и его
   * разметка. Значение ответа — номер выбранного варианта.
   */
  varianty?: { id: string; html: string }[] | null;
  /** Пояснение под вердиктом, HTML (№12: откуда ответ, что проверить). */
  poyasnenieHtml?: string;
}

/**
 * Экран задачи: тонкая полоса прогресса, условие крупно, поле ответа с
 * кнопкой, вердикт, подсказка, решение по шагам, кнопки после ответа.
 * Состояние держит тренажёр; здесь — только вид и клавиатура (Enter —
 * проверить или дальше). Поле — общее поле ответа бланка ЕГЭ
 * (components/tasks/otvet): inputmode=decimal, на сенсорном экране
 * кнопка «−».
 */
export function EkranZadachi({
  taskId,
  nomer,
  vsego,
  tipHtml,
  uslovieHtml,
  value,
  onValue,
  sostoyanie,
  onCheck,
  formatHint = null,
  podskazka,
  reshenie,
  onPohozhaya,
  onNext,
  last,
  zakladka,
  bezPodskazok = false,
  labels,
  pod,
  risunok,
  tekst = false,
  varianty = null,
  poyasnenieHtml,
  pole: svoePole,
  gotovo,
}: EkranZadachiProps) {
  const pole = useRef<HTMLSpanElement>(null);
  const otvechen = sostoyanie === 'verno' || sostoyanie === 'razbor';
  const ready = gotovo ?? value.trim() !== '';
  const input = () => pole.current?.querySelector('input') ?? null;

  /* Новая задача — курсор в поле (на телефоне клавиатура сама не
     открывается без касания, и это правильно). */
  useEffect(() => {
    if (sostoyanie === 'vvod' && window.matchMedia('(pointer: fine)').matches) {
      input()?.focus();
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
      input()?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 250);
  }

  return (
    <div className={clsx('trn-ekran', `trn-ekran--${sostoyanie}`)}>
      <div className="trn-polosa" aria-hidden="true">
        <span style={{ width: `${(nomer / Math.max(1, vsego)) * 100}%` }} />
      </div>

      <article className="trn-zadacha stk-glass" data-task={taskId}>
        <div className="trn-zadacha__verh">
          <Metka>
            <span dangerouslySetInnerHTML={{ __html: tipHtml }} />
          </Metka>
          <span className="trn-zadacha__nomer">
            {nomer} {labels.iz} {vsego}
          </span>
          {zakladka}
        </div>
        {risunok === undefined ? null : <div className="trn-risunok">{risunok}</div>}
        <div
          className={clsx('trn-uslovie', tekst && 'trn-uslovie--tekst')}
          dangerouslySetInnerHTML={{ __html: uslovieHtml }}
        />
        {pod}
      </article>

      <div className="trn-otvetnaya stk-glass">
        {varianty !== null ? (
          <div className="trn-pole">
            <span className="stk-podpis">{labels.otvet}</span>
            <div className="trn-varianty" role="group" aria-label={labels.otvet}>
              {varianty.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  className={clsx(
                    'trn-variant',
                    value === v.id && 'is-on',
                    value === v.id && sostoyanie === 'verno' && 'is-da',
                    value === v.id && sostoyanie === 'neverno' && 'is-net',
                  )}
                  aria-pressed={value === v.id}
                  disabled={otvechen}
                  onClick={() => onValue(v.id)}
                >
                  <span className="trn-variant__no">{v.id}</span>
                  <span
                    className="trn-variant__text"
                    dangerouslySetInnerHTML={{ __html: v.html }}
                  />
                </button>
              ))}
            </div>
            {otvechen ? null : (
              <button
                type="button"
                className="stk-btn stk-btn--primary stk-btn--lg trn-varianty__proverit"
                onClick={onCheck}
                disabled={!ready}
              >
                {labels.proverit}
              </button>
            )}
          </div>
        ) : svoePole === undefined ? (
          <label className="trn-pole">
            <span className="stk-podpis">{labels.otvet}</span>
            <span className="trn-pole__ryad" ref={pole}>
              <AnswerInput
                className="trn-input"
                placeholder={labels.placeholder}
                value={value}
                state={
                  sostoyanie === 'neverno'
                    ? 'error'
                    : sostoyanie === 'verno'
                      ? 'success'
                      : 'default'
                }
                readOnly={otvechen}
                onChange={onValue}
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
        ) : (
          <div className="trn-pole trn-pole--svoe" role="group" aria-label={labels.otvet}>
            <span className="stk-podpis">{labels.otvet}</span>
            {svoePole}
            <span className="trn-pole__ryad">
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
          </div>
        )}
        {formatHint === null ? null : <FormatHint text={formatHint} />}

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
              </span>
              {poyasnenieHtml === undefined || poyasnenieHtml === '' ? null : (
                <span
                  className="trn-verdikt__poyasnenie"
                  dangerouslySetInnerHTML={{ __html: poyasnenieHtml }}
                />
              )}
            </span>
          </div>
        ) : null}

        {bezPodskazok && sostoyanie !== 'vvod' ? (
          <p className="trn-snoska">{labels.bezPodskazok}</p>
        ) : null}

        {podskazka !== null && !otvechen ? (
          podskazka.open ? (
            podskazka.telo === undefined ? (
              <p className="trn-podskazka" role="note">
                <Ikonka name="lampa" />
                <span dangerouslySetInnerHTML={{ __html: podskazka.html }} />
              </p>
            ) : (
              <div className="trn-podskazka trn-podskazka--voprosy" role="note">
                {podskazka.telo}
              </div>
            )
          ) : (
            <button type="button" className="trn-podskazka-knopka" onClick={podskazka.onOpen}>
              <Ikonka name="lampa" /> {labels.podskazka}
            </button>
          )
        ) : null}

        {reshenie !== null && reshenie.open ? (
          <div className="trn-reshenie" role="region" aria-label={labels.shagi}>
            <p className="stk-podpis">{labels.shagi}</p>
            <ShagiResheniya
              shagi={reshenie.shagi}
              delimost={reshenie.delimost}
              posle={reshenie.posle}
            />
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
