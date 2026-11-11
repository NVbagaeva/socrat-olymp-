'use client';

import { useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui';
import { Metka, Polosa, Znak } from '../steklo';
import type { StrokaGruppy } from './types';

export interface ProgressPanelLabels {
  title: string;
  pusto: string;
  sbros: string;
  sbrosVopros: string;
  otmena: string;
}

/** Компактная сворачиваемая панель прогресса по группам. */
export function ProgressPanel({
  stroki,
  resheno,
  verno,
  counter,
  onReset,
  labels,
  open = false,
  children,
}: {
  stroki: StrokaGruppy[];
  resheno: number;
  verno: number;
  /** Строка-счётчик под заголовком: «Решено X из N задач банка». */
  counter?: ReactNode;
  onReset: () => void;
  labels: ProgressPanelLabels;
  open?: boolean;
  /** Под строками групп: списки ошибок, отложенных, истории. */
  children?: ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <details className="trn-progress stk-glass" open={open}>
      <summary className="trn-progress__summary stk-summary">
        <span>
          {labels.title}
          {resheno > 0 ? (
            <span className="trn-progress__schet">
              {' '}
              · решено {resheno} · верно {verno}
            </span>
          ) : null}
        </span>
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      <div className="trn-progress__telo">
        {counter}
        {resheno === 0 ? (
          <p className="stk-lead">{labels.pusto}</p>
        ) : (
          <>
            <ul className="trn-razbivka">
              {stroki.map((s) => (
                <li key={s.id}>
                  <Znak html={s.znakHtml} figura={s.znak} ton={s.ton} size="sm" />
                  <span className="trn-razbivka__nazvanie">{s.nazvanie}</span>
                  <Polosa
                    dolya={s.vsego === 0 ? 0 : s.verno / s.vsego}
                    ton={s.metka !== undefined ? 'terra' : 'blue'}
                  />
                  <span className="trn-razbivka__schet">
                    {s.vsego === 0 ? '—' : `${s.verno} из ${s.vsego}`}
                  </span>
                  {s.metka === undefined ? null : <Metka ton="terra">{s.metka}</Metka>}
                </li>
              ))}
            </ul>
            <button type="button" className="stk-ssylka" onClick={() => setConfirm(true)}>
              {labels.sbros}
            </button>
            <Modal
              open={confirm}
              onClose={() => setConfirm(false)}
              title={labels.sbros}
              description={labels.sbrosVopros}
              footer={
                <>
                  <button
                    type="button"
                    className="stk-btn stk-btn--tihaya"
                    onClick={() => setConfirm(false)}
                  >
                    {labels.otmena}
                  </button>
                  <button
                    type="button"
                    className="stk-btn stk-btn--warm"
                    onClick={() => {
                      setConfirm(false);
                      onReset();
                    }}
                  >
                    {labels.sbros}
                  </button>
                </>
              }
            />
          </>
        )}
        {children}
      </div>
    </details>
  );
}
