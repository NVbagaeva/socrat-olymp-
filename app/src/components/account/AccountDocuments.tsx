'use client';

import './account.css';
import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { accountDataText } from '@/content/legal/account';
import { legalDocs } from '@/content/legal/documents';
import type { AccountApi } from '@/lib/account/api';

/** Блок кабинета: ссылки на документы, выгрузка данных и удаление аккаунта. */
export function AccountDocuments({ api, onDeleted }: { api: AccountApi; onDeleted: () => void }) {
  const t = accountDataText;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);

  const download = async () => {
    setBusy('export');
    try {
      const data = await api.exportMyData();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = t.exportFile;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await api.deleteAccount();
      setConfirm(false);
      onDeleted();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="account-docs" aria-labelledby="account-docs-t">
      <h2 className="account-docs__t" id="account-docs-t">
        {t.title}
      </h2>
      <ul className="account-docs__links" aria-label={t.docs}>
        {Object.values(legalDocs).map((d) => (
          <li key={d.id}>
            <a href={d.href}>{d.title}</a>
          </li>
        ))}
      </ul>
      <div className="account-docs__actions">
        <Button variant="secondary" onClick={download} loading={busy === 'export'}>
          {t.export}
        </Button>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          {t.remove}
        </Button>
      </div>
      <p className="account-docs__hint">{t.exportHint}</p>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t.removeTitle}
        description={t.removeBody}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              {t.removeCancel}
            </Button>
            <Button variant="danger" onClick={remove} loading={busy === 'delete'}>
              {t.removeConfirm}
            </Button>
          </>
        }
      />
    </section>
  );
}
