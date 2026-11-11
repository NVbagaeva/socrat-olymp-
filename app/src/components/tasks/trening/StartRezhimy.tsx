'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Ikonka, type IkonkaName } from '../steklo';

export interface Rezhim {
  id: string;
  ikonka: IkonkaName;
  zag: string;
  lead: string;
  /** Тёплая карточка — «Работа над ошибками». */
  warm?: boolean;
  disabled?: boolean;
}

/** Стартовый экран тренажёра: режимы крупными карточками. */
export function StartRezhimy({
  title,
  rezhimy,
  onPick,
  dop,
}: {
  title: string;
  rezhimy: Rezhim[];
  onPick: (id: string) => void;
  /** Под карточками: строка «Отложенные задачи», панель прогресса. */
  dop?: ReactNode;
}) {
  return (
    <section className="trn-start" aria-labelledby="trn-start-title">
      <h3 className="stk-h3" id="trn-start-title">
        {title}
      </h3>
      <div className="trn-rezhimy">
        {rezhimy.map((r) => (
          <button
            type="button"
            key={r.id}
            className={clsx('trn-rezhim stk-glass', r.warm && 'stk-glass--warm trn-rezhim--warm')}
            onClick={() => onPick(r.id)}
            disabled={r.disabled}
            aria-disabled={r.disabled || undefined}
          >
            <span className="trn-rezhim__ico">
              <Ikonka name={r.ikonka} />
            </span>
            <span className="trn-rezhim__text">
              <b>{r.zag}</b>
              <span>{r.lead}</span>
            </span>
            <span className="trn-rezhim__strelka">
              <Ikonka name="strelka" />
            </span>
          </button>
        ))}
      </div>
      {dop}
    </section>
  );
}
