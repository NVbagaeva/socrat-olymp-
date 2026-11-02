'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { BLANKI_KITS, BLANKI_TEXT as T, type BlankKit } from '@/content/blanki';
import { pryamayaSsylka, sobratISkachat } from './skachat';
import './blanki.css';

export interface BlankiEgeProps {
  /** Копий бланка ответов № 1 по умолчанию: на «Собрать вариант» — число вариантов. */
  defaultCopies?: number;
  className?: string;
}

/**
 * Блок «Бланки ЕГЭ»: официальные бланки отдельными файлами. В листы
 * вариантов бланки не входят никогда — только отсюда.
 *
 * Бланк из одной страницы в одной копии — прямая ссылка на файл в
 * public/blanki. Несколько страниц или копий — один PDF, собранный в
 * браузере (lib/blankiPdf.ts, pdf-lib грузится по нажатию).
 *
 * Компонент самостоятельный: ставится на любую страницу (например, в
 * генератор второй части).
 */
export function BlankiEge({ defaultCopies = 1, className }: BlankiEgeProps) {
  /* Копии: пока учитель не трогал поле, оно следует за числом вариантов. */
  const [copiesTyped, setCopiesTyped] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const copies = copiesTyped ?? Math.max(1, defaultCopies);

  async function skachat(kit: BlankKit) {
    setBusy(kit.id);
    setFailed(false);
    try {
      await sobratISkachat(kit, copies);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  function knopka(kit: BlankKit) {
    const cls = clsx('btn', kit.main === true ? 'btn--primary' : 'btn--secondary', 'blanki__btn');
    const label = (
      <>
        <span className="blanki__label">{kit.label}</span>
        {kit.note === undefined ? null : <span className="blanki__note">{kit.note}</span>}
      </>
    );
    const href = pryamayaSsylka(kit, copies);
    if (href !== null) {
      return (
        <a className={cls} href={href} download={`${kit.file}.pdf`}>
          {label}
        </a>
      );
    }
    return (
      <button
        type="button"
        className={cls}
        disabled={busy !== null}
        onClick={() => void skachat(kit)}
      >
        {busy === kit.id ? <span className="blanki__label">{T.busy}</span> : label}
      </button>
    );
  }

  const [main, ...rest] = BLANKI_KITS;
  return (
    <section className={clsx('blanki', className)} aria-labelledby="blanki-h">
      <h2 id="blanki-h" className="blanki__title">
        {T.title}
      </h2>
      <p className="blanki__lead">{T.lead}</p>
      {main === undefined ? null : (
        <div className="blanki__main">
          {knopka(main)}
          <label className="blanki__copies">
            <span className="blanki__copies-label">{T.copies}</span>
            <input
              className="input blanki__copies-input"
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
        </div>
      )}
      <div className="blanki__rest">
        {rest.map((kit) => (
          <div key={kit.id}>{knopka(kit)}</div>
        ))}
      </div>
      {failed ? (
        <p className="blanki__error" role="alert">
          {T.failed}
        </p>
      ) : null}
      <p className="blanki__print">{T.print}</p>
    </section>
  );
}
