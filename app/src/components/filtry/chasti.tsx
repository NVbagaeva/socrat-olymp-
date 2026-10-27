'use client';

import type { ReactNode } from 'react';
import { GenIcon } from '@/components/generator/GenIcons';
import { FILTRY } from '@/content/trenazherFiltry';
import './filtry.css';

/**
 * Общие части панели фильтров: тренажёр (FiltrPanel) и генератор
 * (components/generator/Generator.tsx) собирают из них свои фильтры,
 * поэтому источник, звёзды, активные фильтры и кнопка «Фильтры (N)»
 * выглядят и ведут себя одинаково.
 */

/** Поле с подписью сверху. */
export function Pole({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flt-pole">
      <p className="flt-label">{label}</p>
      {children}
    </div>
  );
}

export interface SegmOption<T> {
  id: T;
  title: string;
  /** Пояснение во всплывающей подсказке. */
  hint?: string;
}

/** Переключатель «одно из»: источник, сколько задач, режим, порядок. */
export function Segm<T extends string | number>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: readonly SegmOption<T>[];
  onPick: (id: T) => void;
}) {
  return (
    <div className="flt-segm" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          aria-pressed={value === o.id}
          title={o.hint}
          onClick={() => onPick(o.id)}
        >
          {o.title}
        </button>
      ))}
    </div>
  );
}

/**
 * Звёзды сложности: можно выбрать несколько. С onLyubaya — первой
 * кнопкой «Любая» (тренажёр: пустой выбор — без ограничения); без неё
 * хотя бы один уровень выбран всегда (генератор).
 */
export function Zvyozdy({
  urovni,
  vybrany,
  onToggle,
  onLyubaya,
}: {
  urovni: readonly { uroven: number; words: string }[];
  vybrany: readonly number[];
  onToggle: (uroven: number) => void;
  onLyubaya?: () => void;
}) {
  return (
    <div className="flt-segm" role="group" aria-label={FILTRY.slozhnost}>
      {onLyubaya === undefined ? null : (
        <button type="button" aria-pressed={vybrany.length === 0} onClick={onLyubaya}>
          {FILTRY.slozhnostVse}
        </button>
      )}
      {urovni.map((u) => (
        <button
          key={u.uroven}
          type="button"
          className="flt-stars"
          aria-pressed={vybrany.includes(u.uroven)}
          aria-label={`${u.words}: ${'★'.repeat(u.uroven)}`}
          title={u.words}
          onClick={() => onToggle(u.uroven)}
        >
          {'★'.repeat(u.uroven)}
        </button>
      ))}
    </div>
  );
}

export interface AktivnyyFiltr {
  id: string;
  label: string;
  onSnyat: () => void;
}

/** Активные фильтры чипами с крестиком и «Сбросить». Нет активных — ничего. */
export function AktivnyeFiltry({
  items,
  onSbrosit,
}: {
  items: readonly AktivnyyFiltr[];
  onSbrosit: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flt-active">
      <ul className="flt-active__list">
        {items.map((a) => (
          <li key={a.id}>
            <span className="flt-active__chip">
              {a.label}
              <button type="button" aria-label={FILTRY.snyat(a.label)} onClick={a.onSnyat}>
                <GenIcon name="x" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="flt-link" onClick={onSbrosit}>
        {FILTRY.sbrosit}
      </button>
    </div>
  );
}

/** Телефон: «Фильтры (N)» — открывает нижний лист со всеми фильтрами. */
export function KnopkaFiltrov({ n, onClick }: { n: number; onClick: () => void }) {
  return (
    <button type="button" className="flt-phone__btn" onClick={onClick}>
      <GenIcon name="filter" />
      {FILTRY.filtry}
      {n > 0 ? <span className="flt-phone__n">{n}</span> : null}
    </button>
  );
}
