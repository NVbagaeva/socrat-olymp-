'use client';

import './account.css';
import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui';
import { legalDocs } from '@/content/legal/documents';
import { REGISTER_FORM } from '@/content/auth';
import { registrationText } from '@/content/legal/account';

export interface ConsentChecksValue {
  soglashenie: boolean;
  soglasie: boolean;
}

/**
 * Две галочки: соглашение и согласие на обработку ПДн. По умолчанию
 * сняты — значение приходит снаружи, сами они ничего не отмечают.
 * Ссылки открываются в новой вкладке, чтобы не потерять заполненную форму.
 */
export function ConsentChecks({
  value,
  onChange,
  registration = false,
  invalid = false,
  errorId,
}: {
  value: ConsentChecksValue;
  onChange: (next: ConsentChecksValue) => void;
  registration?: boolean;
  invalid?: boolean;
  errorId?: string;
}) {
  const t = registrationText;
  const [openDoc, setOpenDoc] = useState<'soglashenie' | 'soglasie' | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const doc = openDoc === null ? null : legalDocs[openDoc];

  useEffect(() => {
    if (doc === null) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenDoc(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc]);

  const check = (key: keyof ConsentChecksValue, checked: boolean) =>
    onChange({ ...value, [key]: checked });

  return (
    <>
      <div className={`consent-checks${invalid ? 'consent-checks--invalid' : ''}`}>
        {(['soglashenie', 'soglasie'] as const).map((key) => {
          const checked = value[key];
          const docText = legalDocs[key];
          const shortText = REGISTER_FORM.consentsShort[key];
          return (
            <div className="consent-checks__item" key={key}>
              <Checkbox
                name={`accept-${key}`}
                checked={checked}
                aria-invalid={invalid && !checked ? true : undefined}
                aria-describedby={invalid && !checked ? errorId : undefined}
                onChange={(event) => check(key, event.target.checked)}
              >
                {registration ? (
                  shortText
                ) : key === 'soglashenie' ? (
                  <>
                    {t.acceptSoglashenie.before}{' '}
                    <a href={docText.href} target="_blank" rel="noopener">
                      {t.acceptSoglashenie.link}
                    </a>
                  </>
                ) : (
                  <>
                    {t.acceptSoglasie.before}{' '}
                    <a href={docText.href} target="_blank" rel="noopener">
                      {t.acceptSoglasie.link}
                    </a>
                  </>
                )}
              </Checkbox>
              {registration ? (
                <button
                  type="button"
                  className="consent-checks__read"
                  onClick={() => setOpenDoc(key)}
                >
                  {REGISTER_FORM.consentsShort.read}
                </button>
              ) : null}
            </div>
          );
        })}
        {invalid && (!value.soglashenie || !value.soglasie) ? (
          <p className="consent-checks__error" id={errorId} role="alert">
            {REGISTER_FORM.consentsHint}
          </p>
        ) : null}
      </div>
      {registration && doc !== null && openDoc !== null ? (
        <div className="consent-drawer__backdrop" onMouseDown={() => setOpenDoc(null)}>
          <section
            className="consent-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="consent-drawer__head">
              <h2 id="consent-drawer-title">{doc.title}</h2>
              <button
                ref={closeRef}
                type="button"
                className="consent-drawer__close"
                aria-label={REGISTER_FORM.consentsShort.close}
                onClick={() => setOpenDoc(null)}
              >
                ×
              </button>
            </header>
            <iframe className="consent-drawer__frame" src={doc.href} title={doc.title} />
            <footer className="consent-drawer__actions">
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={() => {
                  check(openDoc, true);
                  setOpenDoc(null);
                }}
              >
                {REGISTER_FORM.consentsShort.mark}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
