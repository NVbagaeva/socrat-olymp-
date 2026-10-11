'use client';

import './account.css';
import { Checkbox } from '@/components/ui';
import { legalDocs } from '@/content/legal/documents';
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
}: {
  value: ConsentChecksValue;
  onChange: (next: ConsentChecksValue) => void;
}) {
  const t = registrationText;
  return (
    <div className="consent-checks">
      <Checkbox
        name="accept-soglashenie"
        checked={value.soglashenie}
        onChange={(e) => onChange({ ...value, soglashenie: e.target.checked })}
      >
        {t.acceptSoglashenie.before}{' '}
        <a href={legalDocs.soglashenie.href} target="_blank" rel="noopener">
          {t.acceptSoglashenie.link}
        </a>
      </Checkbox>
      <Checkbox
        name="accept-soglasie"
        checked={value.soglasie}
        onChange={(e) => onChange({ ...value, soglasie: e.target.checked })}
      >
        {t.acceptSoglasie.before}{' '}
        <a href={legalDocs.soglasie.href} target="_blank" rel="noopener">
          {t.acceptSoglasie.link}
        </a>
      </Checkbox>
    </div>
  );
}
