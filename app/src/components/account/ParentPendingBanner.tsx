'use client';

import './account.css';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { parentPendingText } from '@/content/legal/account';
import { resendWaitSeconds } from '@/lib/account/consents';

/**
 * Плашка в кабинете ученика младше 18, пока родитель не подтвердил
 * согласие. Повторное письмо — не чаще раза в минуту: кнопка неактивна
 * и показывает, сколько ждать (сервер держит тот же интервал сам).
 */
export function ParentPendingBanner({
  parentEmail,
  lastSentAt,
  onResend,
}: {
  parentEmail: string;
  lastSentAt: string | null;
  onResend: () => Promise<void>;
}) {
  const t = parentPendingText;
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const wait = resendWaitSeconds(lastSentAt, now);

  useEffect(() => {
    if (wait === 0) return undefined;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [wait]);

  const resend = async () => {
    setBusy(true);
    try {
      await onResend();
    } finally {
      setNow(new Date());
      setBusy(false);
    }
  };

  return (
    <section className="parent-pending" role="status" aria-live="polite">
      <div>
        <h2 className="parent-pending__t">{t.title}</h2>
        <p className="parent-pending__b">{t.body(parentEmail)}</p>
        {wait > 0 ? <p className="parent-pending__w">{t.wait(wait)}</p> : null}
      </div>
      <Button variant="secondary" size="sm" onClick={resend} disabled={wait > 0} loading={busy}>
        {t.resend}
      </Button>
    </section>
  );
}
