'use client';

import { clsx } from 'clsx';
import type { KeyboardEvent, ReactNode } from 'react';
import { PrepCardLink } from '@/components/tasks/prep/PrepScroll';
import { AnswerInput, FormatHint } from '@/components/tasks/otvet/AnswerInput';
import { Ikonka, Metka, Polosa, ShagiResheniya, Znak, type Shag, type Ton } from '../steklo';
import './opornye.css';

/**
 * «Опорные задачи» в «Стеклянной сцене»: список блоков по навыкам и
 * экран блока. Образец — опорные задачи №3 (components/tasks/zadanie3/
 * Navyki3 и экран блока стереометрии): та же карточка блока — значок,
 * название, прогресс, без формул — и та же задача: плашка «Задача k из
 * n», условие с оранжевой чертой, поле ответа, «Проверить»,
 * «Подсказка», «Пропустить».
 *
 * Компоненты не знают о номере задания: названия, условия (готовый
 * HTML) и прогресс приходят пропсами. Первым их берёт №7; следом на
 * них переходят опорные №8.
 */

export interface OpornyyBlok {
  slug: string;
  href: string;
  nazvanie: string;
  /** Значок блока: готовый HTML (KaTeX) или рисунок. */
  znakHtml: string;
  znak?: ReactNode;
  /** Сколько задач в блоке и сколько решено верно. */
  vsego: number;
  resheno: number;
}

export interface OpornyyNavyk {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton;
  bloki: OpornyyBlok[];
}

export interface OpornyeSpisokLabels {
  blokov: (n: number) => string;
  neNachato: string;
  zadach: (resheno: number, vsego: number) => string;
  gotovo: string;
}

/**
 * Список блоков по навыкам. На карточке блока — только название,
 * значок и прогресс ученика: ни формул, ни служебных меток
 * (docs/razdel-pravila.md, п. 3).
 */
export function OpornyeSpisok({
  navyki,
  labels,
}: {
  navyki: OpornyyNavyk[];
  labels: OpornyeSpisokLabels;
}) {
  return (
    <div className="op-navyki">
      {navyki.map((navyk) => (
        <section
          className={clsx('op-navyk', `stk-ton--${navyk.ton}`)}
          key={navyk.id}
          aria-labelledby={`op-navyk-${navyk.id}`}
        >
          <div className="op-navyk__head">
            <h3 className="stk-h4 op-navyk__zag" id={`op-navyk-${navyk.id}`}>
              {navyk.nazvanie}
            </h3>
            <p className="op-navyk__lead">
              {navyk.lead} · {labels.blokov(navyk.bloki.length)}
            </p>
          </div>
          <ul className="op-bloki">
            {navyk.bloki.map((blok) => {
              const gotovo = blok.vsego > 0 && blok.resheno === blok.vsego;
              return (
                <li key={blok.slug}>
                  <PrepCardLink
                    className={clsx('op-blok stk-glass', gotovo && 'is-gotovo')}
                    href={blok.href}
                  >
                    <Znak html={blok.znakHtml} figura={blok.znak} ton={navyk.ton} />
                    <span className="op-blok__text">
                      <b>{blok.nazvanie}</b>
                      <span className="op-blok__schet">
                        {blok.resheno === 0
                          ? labels.neNachato
                          : labels.zadach(blok.resheno, blok.vsego)}
                      </span>
                    </span>
                    {gotovo ? <Metka ton="green">{labels.gotovo}</Metka> : null}
                    <span className="op-blok__polosa">
                      <Polosa
                        dolya={blok.vsego === 0 ? 0 : blok.resheno / blok.vsego}
                        ton={gotovo ? 'green' : 'blue'}
                      />
                    </span>
                  </PrepCardLink>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ── Экран блока ─────────────────────────────────────────────── */

/** Чем закрыта задача блока: для точек-номеров. */
export type OpornyyIshod = 'right' | 'wrong' | null;

export interface OpornayaZadachaLabels {
  zadacha: (k: number, n: number) => string;
  nazad: string;
  vpered: string;
  otvet: string;
  placeholder: string;
  proverit: string;
  podskazka: string;
  reshenie: string;
  skrytReshenie: string;
  propustit: string;
  sleduyushchaya: string;
  verno: string;
  vernoLead: string;
  neverno: string;
  nevernoLead: string;
  shagi: string;
  zadachiBloka: string;
  nomer: (k: number) => string;
}

export interface OpornayaZadachaProps {
  /** Номер текущей задачи (с нуля) и исходы всех задач блока. */
  index: number;
  ishody: OpornyyIshod[];
  onOpen: (index: number) => void;
  uslovieHtml: string;
  /** Чертёж или картинка задачи: под условием. Нет — ничего не выводится. */
  risunok?: ReactNode;
  value: string;
  onValue: (value: string) => void;
  /** Итог проверки текущего ответа. */
  checked: 'right' | 'wrong' | null;
  onCheck: () => void;
  /** Подсказка о записи ответа: попытка не тратится. */
  formatHint?: string | null;
  /** Подсказка (HTML): открыта ли, открыть. null — подсказки нет. */
  podskazka: {
    html: string;
    open: boolean;
    onOpen: () => void;
    /**
     * Подсказка-вопросы с кнопками (№11): показывается вместо текста —
     * как в тренажёре (EkranZadachi, podskazka.telo).
     */
    telo?: ReactNode;
  } | null;
  /** Решение по шагам: доступно после ответа; открыто ли, переключить. */
  reshenie: { shagi: Shag[]; open: boolean; onToggle: () => void } | null;
  /** Плашка «Запомни» блока: над задачей. */
  zapomni?: ReactNode;
  /** Ответ выбором (№2): варианты вместо поля ответа, value — номер выбранного. */
  vybory?: readonly { number: string; labelHtml: string }[];
  /** Ещё кнопки в ряду действий (№2: «Ещё вариант»). */
  dop?: ReactNode;
  labels: OpornayaZadachaLabels;
}

/**
 * Задача блока: плашка «Задача k из n» со стрелками, условие с
 * оранжевой чертой, поле ответа бланка ЕГЭ, вердикт, подсказка,
 * решение по шагам и точки-номера задач блока. Состояние держит
 * раздел; здесь — только вид и клавиатура (Enter — проверить).
 */
export function OpornayaZadacha({
  index,
  ishody,
  onOpen,
  uslovieHtml,
  risunok,
  value,
  onValue,
  checked,
  onCheck,
  formatHint = null,
  podskazka,
  reshenie,
  zapomni,
  vybory,
  dop,
  labels,
}: OpornayaZadachaProps) {
  const total = ishody.length;
  const solved = checked === 'right';
  const ready = value.trim() !== '';
  const last = index === total - 1;

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    if (solved) {
      if (!last) onOpen(index + 1);
    } else if (ready) {
      onCheck();
    }
  }

  return (
    <div className="op-ekran">
      {zapomni === undefined ? null : <aside className="op-zapomni stk-glass">{zapomni}</aside>}

      <article className="op-zad stk-glass">
        <div className="op-zad__verh">
          <p className="op-plashka">{labels.zadacha(index + 1, total)}</p>
          <span className="op-zad__strelki">
            <button
              type="button"
              className="op-strelka"
              aria-label={labels.nazad}
              disabled={index === 0}
              onClick={() => onOpen(index - 1)}
            >
              <Ikonka name="nazad" />
            </button>
            <button
              type="button"
              className="op-strelka"
              aria-label={labels.vpered}
              disabled={last}
              onClick={() => onOpen(index + 1)}
            >
              <Ikonka name="strelka" />
            </button>
          </span>
        </div>

        <div className="op-zad__uslovie" dangerouslySetInnerHTML={{ __html: uslovieHtml }} />
        {risunok === undefined ? null : <div className="op-zad__ris">{risunok}</div>}

        {vybory === undefined ? (
          <label className="op-zad__pole">
            <span className="stk-podpis">{labels.otvet}</span>
            <AnswerInput
              className="op-zad__input"
              placeholder={labels.placeholder}
              value={value}
              state={checked === null ? 'default' : solved ? 'success' : 'error'}
              readOnly={solved}
              onChange={onValue}
              onKeyDown={onKey}
            />
          </label>
        ) : (
          <fieldset className="op-zad__pole op-vybory">
            <legend className="stk-podpis">{labels.otvet}</legend>
            <ul>
              {vybory.map((v) => {
                const vybran = value === v.number;
                return (
                  <li key={v.number}>
                    <button
                      type="button"
                      className={clsx(
                        'op-vybor',
                        vybran && 'is-vybran',
                        vybran && checked === 'right' && 'is-verno',
                        vybran && checked === 'wrong' && 'is-neverno',
                      )}
                      aria-pressed={vybran}
                      disabled={solved}
                      onClick={() => onValue(v.number)}
                    >
                      <span className="op-vybor__no">{v.number}</span>
                      <span
                        className="op-vybor__text"
                        dangerouslySetInnerHTML={{ __html: v.labelHtml }}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}
        {formatHint === null ? null : <FormatHint text={formatHint} />}

        {checked === null ? null : (
          <div
            className={clsx('op-verdikt', solved ? 'op-verdikt--da' : 'op-verdikt--net')}
            role="status"
          >
            <span className="op-verdikt__ico">
              <Ikonka name={solved ? 'da' : 'net'} />
            </span>
            <span className="op-verdikt__text">
              <b>{solved ? labels.verno : labels.neverno}</b>
              <span>{solved ? labels.vernoLead : labels.nevernoLead}</span>
            </span>
          </div>
        )}

        {podskazka !== null && podskazka.open && !solved ? (
          podskazka.telo === undefined ? (
            <p className="op-podskazka" role="note">
              <Ikonka name="lampa" />
              <span dangerouslySetInnerHTML={{ __html: podskazka.html }} />
            </p>
          ) : (
            <div className="op-podskazka op-podskazka--voprosy" role="note">
              {podskazka.telo}
            </div>
          )
        ) : null}

        {reshenie !== null && reshenie.open ? (
          <div className="op-reshenie" role="region" aria-label={labels.shagi}>
            <p className="stk-podpis">{labels.shagi}</p>
            <ShagiResheniya shagi={reshenie.shagi} />
          </div>
        ) : null}

        <div className="op-zad__knopki">
          {solved ? (
            last ? null : (
              <button
                type="button"
                className="stk-btn stk-btn--primary stk-btn--lg op-zad__glavnaya"
                onClick={() => onOpen(index + 1)}
              >
                {labels.sleduyushchaya} <Ikonka name="strelka" />
              </button>
            )
          ) : (
            <button
              type="button"
              className="stk-btn stk-btn--primary stk-btn--lg op-zad__glavnaya"
              onClick={onCheck}
              disabled={!ready}
            >
              {labels.proverit}
            </button>
          )}
          {podskazka !== null && !podskazka.open && !solved ? (
            <button type="button" className="op-podskazka-knopka" onClick={podskazka.onOpen}>
              <Ikonka name="lampa" /> {labels.podskazka}
            </button>
          ) : null}
          {reshenie === null ? null : (
            <button
              type="button"
              className="stk-btn stk-btn--tihaya"
              onClick={reshenie.onToggle}
              aria-expanded={reshenie.open}
            >
              {reshenie.open ? labels.skrytReshenie : labels.reshenie}
            </button>
          )}
          {dop}
          {!solved && !last ? (
            <button type="button" className="op-propustit" onClick={() => onOpen(index + 1)}>
              {labels.propustit}
            </button>
          ) : null}
        </div>
      </article>

      <nav className="op-tochki" aria-label={labels.zadachiBloka}>
        <ol>
          {ishody.map((ishod, k) => (
            <li key={k}>
              <button
                type="button"
                className={clsx(
                  'op-tochka',
                  ishod === 'right' && 'is-verno',
                  ishod === 'wrong' && 'is-neverno',
                )}
                aria-current={k === index ? 'step' : undefined}
                aria-label={labels.nomer(k + 1)}
                onClick={() => onOpen(k)}
              >
                {ishod === 'right' ? <Ikonka name="da" /> : k + 1}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
