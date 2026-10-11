'use client';

import { useState } from 'react';
import { Button, FieldMessage, Modal } from '@/components/ui';
import { documentsUpdatedText } from '@/content/legal/account';
import { operator } from '@/lib/legal/operator';
import { ConsentChecks, type ConsentChecksValue } from './ConsentChecks';

/**
 * Окно при входе, если вышла новая редакция документов
 * (outdatedConsents не пусто). Закрыть его нельзя: без согласия
 * с текущей редакцией кабинет не работает. Галочки снова сняты.
 */
export function DocumentsUpdatedModal({
  open,
  onAccept,
}: {
  open: boolean;
  onAccept: () => Promise<void>;
}) {
  const t = documentsUpdatedText;
  const [value, setValue] = useState<ConsentChecksValue>({ soglashenie: false, soglasie: false });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const accept = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onAccept();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {}}
      title={t.title}
      description={t.description(operator.data)}
      footer={
        <Button onClick={accept} disabled={!value.soglashenie || !value.soglasie} loading={busy}>
          {t.submit}
        </Button>
      }
    >
      <ConsentChecks value={value} onChange={setValue} />
      {failed ? <FieldMessage tone="error">{t.failed}</FieldMessage> : null}
    </Modal>
  );
}
