'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { BLANKI_KITS, BLANKI_TEXT as T } from '@/content/blanki';
import { pryamayaSsylka, sobratISkachat } from './skachat';

export interface BlankiVyborProps {
  /** Копий по умолчанию — число вариантов набора. */
  defaultCopies: number;
  /** Подпись главной кнопки. */
  skachatLabel: string;
}

/**
 * Бланки ЕГЭ в окне «Собрать вариант»: выбор бланка или комплекта (одна
 * строка — один файл), количество копий у бланка ответов № 1 и кнопка
 * «Скачать PDF». То же, что блок BlankiEge, но выбором, а не шестью
 * кнопками подряд. В листы вариантов бланки не входят никогда.
 */
export function BlankiVybor({ defaultCopies, skachatLabel }: BlankiVyborProps) {
  const [vybran, setVybran] = useState(BLANKI_KITS[0]?.id ?? '');
  const [copiesTyped, setCopiesTyped] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const copies = copiesTyped ?? Math.max(1, defaultCopies);
  const kit = BLANKI_KITS.find((k) => k.id === vybran) ?? BLANKI_KITS[0];
  if (kit === undefined) return null;
  const href = pryamayaSsylka(kit, copies);

  async function skachat() {
    if (kit === undefined) return;
    setBusy(true);
    setFailed(false);
    try {
      await sobratISkachat(kit, copies);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bv">
      <p className="bv__lead">{T.lead}</p>
      <div className="bv__list" role="radiogroup" aria-label={T.title}>
        {BLANKI_KITS.map((k) => {
          const on = k.id === kit.id;
          return (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={clsx('bv__row', on && 'is-on')}
              onClick={() => setVybran(k.id)}
            >
              <span className="bv__text">
                <span className="bv__label">{k.label}</span>
                {k.note === undefined ? null : <span className="bv__note">{k.note}</span>}
              </span>
              <span className="bv__galka" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m6 12.5 4 4 8-9" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>
      {kit.copies === true ? (
        <label className="bv__copies">
          <span>{T.copies}</span>
          <input
            className="input bv__copies-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={T.copiesMax}
            value={copies}
            onChange={(e) => {
              const v = Math.round(Number(e.target.value));
              setCopiesTyped(Number.isFinite(v) ? Math.min(T.copiesMax, Math.max(1, v)) : 1);
            }}
          />
        </label>
      ) : null}
      <p className="bv__print">{T.print}</p>
      {failed ? (
        <p className="bv__error" role="alert">
          {T.failed}
        </p>
      ) : null}
      <div className="bv__deystvie">
        {href !== null ? (
          <a className="var-btn var-btn--tyoplyy" href={href} download={`${kit.file}.pdf`}>
            {skachatLabel}
          </a>
        ) : (
          <button
            type="button"
            className="var-btn var-btn--tyoplyy"
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={() => void skachat()}
          >
            {busy ? T.busy : skachatLabel}
          </button>
        )}
      </div>
    </div>
  );
}
