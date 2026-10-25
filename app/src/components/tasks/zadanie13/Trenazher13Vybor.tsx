'use client';

import { clsx } from 'clsx';
import { Button, Checkbox } from '@/components/ui';
import { TRENAZHER_13 } from '@/content/zadanie13';
import {
  KOLICHESTVO_13,
  type Chto13,
  type Istochnik13,
  type Nastroyki13,
  type Rezhim13,
  type Uroven13,
} from '@/lib/zadanie13/trenazher/plan';

export interface Trenazher13VyborProps {
  n: Nastroyki13;
  izmenit: (patch: Partial<Nastroyki13>) => void;
  /** Сколько прототипов под выбор: 0 — начинать нечего. */
  prototipov: number;
  /** Прототипов с ошибками в выбранной схеме. */
  oshibok: number;
  zagruzka: boolean;
  onStart: () => void;
}

function Knopki<T extends string | number>({
  label,
  items,
  value,
  onPick,
  className,
}: {
  label: string;
  items: readonly { id: T; label: string; note?: string }[];
  value: T;
  onPick: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx('z13-tr__knopki', className)} role="group" aria-label={label}>
      {items.map((it) => (
        <button
          key={String(it.id)}
          type="button"
          className={clsx('z13-tr__knopka', value === it.id && 'is-active')}
          aria-pressed={value === it.id}
          onClick={() => onPick(it.id)}
        >
          <span className="z13-tr__knopka-label">{it.label}</span>
          {it.note === undefined ? null : <span className="z13-tr__knopka-note">{it.note}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Экран выбора тренировки №13 (02-design.md, § 4.1): три вопроса —
 * что тренируем, как проверять, сколько задач; остальное — под
 * «Дополнительно» и по умолчанию.
 */
export function Trenazher13Vybor({
  n,
  izmenit,
  prototipov,
  oshibok,
  zagruzka,
  onStart,
}: Trenazher13VyborProps) {
  return (
    <div className="z13-tr">
      <header className="z13-tr__head">
        <h2 className="t-h2">{TRENAZHER_13.title}</h2>
        <p className="z13-tr__lead">{TRENAZHER_13.lead}</p>
      </header>
      <section className="z13-tr__blok">
        <h3 className="z13-tr__h">{TRENAZHER_13.chto}</h3>
        <Knopki<Chto13>
          label={TRENAZHER_13.chto}
          className="z13-tr__knopki--karty"
          items={TRENAZHER_13.karty}
          value={n.chto}
          onPick={(chto) => izmenit({ chto })}
        />
      </section>

      {n.chto === 'tip' ? null : (
        <section className="z13-tr__blok">
          <h3 className="z13-tr__h">{TRENAZHER_13.kak}</h3>
          <Knopki<Rezhim13>
            label={TRENAZHER_13.kak}
            items={TRENAZHER_13.rezhimy}
            value={n.rezhim}
            onPick={(rezhim) => izmenit({ rezhim })}
          />
        </section>
      )}

      <section className="z13-tr__blok">
        <h3 className="z13-tr__h">{TRENAZHER_13.skolko}</h3>
        <Knopki<number>
          label={TRENAZHER_13.skolko}
          className="z13-tr__knopki--chisla"
          items={KOLICHESTVO_13.map((k) => ({ id: k, label: String(k) }))}
          value={n.count}
          onPick={(count) => izmenit({ count })}
        />
      </section>

      <details className="z13-tr__dop">
        <summary>{TRENAZHER_13.dop}</summary>
        <div className="z13-tr__dop-body">
          <h4 className="z13-tr__h4">{TRENAZHER_13.uroven}</h4>
          <Knopki<Uroven13>
            label={TRENAZHER_13.uroven}
            items={TRENAZHER_13.urovni}
            value={n.uroven}
            onPick={(uroven) => izmenit({ uroven })}
          />
          <h4 className="z13-tr__h4">{TRENAZHER_13.otkuda}</h4>
          <Knopki<Istochnik13>
            label={TRENAZHER_13.otkuda}
            items={TRENAZHER_13.istochniki}
            value={n.istochnik}
            onPick={(istochnik) => izmenit({ istochnik })}
          />
          <Checkbox
            className="z13-tr__oshibki"
            checked={n.oshibki}
            disabled={oshibok === 0 && !n.oshibki}
            onChange={(e) => izmenit({ oshibki: e.target.checked })}
          >
            {TRENAZHER_13.oshibki(oshibok)}
          </Checkbox>
        </div>
      </details>

      {prototipov === 0 ? <p className="z13-tr__pusto">{TRENAZHER_13.pusto}</p> : null}
      <div className="z13-tr__start">
        <Button onClick={onStart} disabled={prototipov === 0 || zagruzka}>
          {TRENAZHER_13.start}
        </Button>
      </div>
    </div>
  );
}
