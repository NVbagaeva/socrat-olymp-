'use client';

import { useState, useSyncExternalStore } from 'react';
import { AccountDocuments } from '@/components/account/AccountDocuments';
import { DocumentsUpdatedModal } from '@/components/account/DocumentsUpdatedModal';
import { ParentPendingBanner } from '@/components/account/ParentPendingBanner';
import { RegistrationForm } from '@/components/account/RegistrationForm';
import { Button } from '@/components/ui';
import { registrationText } from '@/content/legal/account';
import { outdatedConsents, progressSavingAllowed } from '@/lib/account/consents';
import { createDemoStore } from './mockApi';

const KIND: Record<string, string> = {
  soglashenie: 'соглашение',
  soglasie: 'согласие',
  soglasie_roditelya: 'согласие родителя',
};

export function Demo({ consentText, version }: { consentText: string; version: string }) {
  const [store] = useState(() => createDemoStore(version, consentText));
  useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  const { api } = store;
  const [updatedOpen, setUpdatedOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const { account, consents, outbox, currentVersion } = store.db;

  const relogin = () => {
    if (account && outdatedConsents(account.consents, currentVersion).length > 0)
      setUpdatedOpen(true);
  };

  return (
    <div className="sgl__grid">
      <div className="sgl__col">
        {account ? (
          <section className="sgl__card" data-testid="kabinet">
            <h1 className="sgl__h">Кабинет: {account.name}</h1>
            <p className="sgl__progress" data-testid="progress">
              Прогресс: {progressSavingAllowed(account) ? 'сохраняется' : 'не сохраняется'}
            </p>
            {account.parentRequired && !account.parentConfirmedAt && account.parentEmail ? (
              <ParentPendingBanner
                parentEmail={account.parentEmail}
                lastSentAt={account.parentLetterSentAt}
                onResend={async () => {
                  await api.resendParentLetter();
                }}
              />
            ) : null}
            <AccountDocuments api={api} onDeleted={() => setDeleted(true)} />
            <div className="sgl__demo">
              <p>Демо-управление</p>
              <Button variant="secondary" size="sm" onClick={store.newEdition}>
                Опубликовать новую редакцию
              </Button>
              <Button variant="secondary" size="sm" onClick={relogin}>
                Выйти и войти снова
              </Button>
              <span data-testid="version">Редакция: {currentVersion}</span>
            </div>
          </section>
        ) : (
          <section className="sgl__card">
            <h1 className="sgl__h">{deleted ? 'Аккаунт удалён' : registrationText.title}</h1>
            {deleted ? null : (
              <RegistrationForm
                api={{
                  ...api,
                  register: (form) => api.register(form, store.db.currentVersion),
                }}
                onRegistered={store.changed}
              />
            )}
          </section>
        )}
      </div>

      <div className="sgl__col">
        <section className="sgl__card">
          <h2 className="sgl__h2">Таблица согласий (демо-база)</h2>
          <div className="sgl__scroll">
            <table className="sgl__table" data-testid="consents">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Тип</th>
                  <th>Версия</th>
                  <th>Дата и время</th>
                  <th>IP</th>
                  <th>Аккаунт удалён</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c, i) => (
                  <tr key={i}>
                    <td>{c.email}</td>
                    <td>{KIND[c.kind]}</td>
                    <td>{c.version}</td>
                    <td>{new Date(c.acceptedAt).toLocaleString('ru-RU')}</td>
                    <td>{c.ip}</td>
                    <td>{c.accountDeletedAt ? 'да' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {consents.length === 0 ? <p className="sgl__empty">Пока пусто</p> : null}
        </section>

        <section className="sgl__card">
          <h2 className="sgl__h2">Письма родителю (демо-почта)</h2>
          {outbox.length === 0 ? <p className="sgl__empty">Писем нет</p> : null}
          {outbox.map((l, i) => (
            <article key={l.token} className="sgl__letter" data-testid="letter">
              <p>
                <b>Кому:</b> {l.to} · {new Date(l.sentAt).toLocaleTimeString('ru-RU')}
              </p>
              <p>
                <b>Тема:</b> {l.subject}
              </p>
              <pre>{l.text}</pre>
              {i === 0 && account && !account.parentConfirmedAt ? (
                <Button size="sm" onClick={() => api.confirmParent(l.token)}>
                  Перейти по ссылке из письма
                </Button>
              ) : null}
            </article>
          ))}
        </section>
      </div>

      <DocumentsUpdatedModal
        open={updatedOpen}
        onAccept={async () => {
          await api.acceptDocuments(['soglashenie', 'soglasie'], store.db.currentVersion);
          setUpdatedOpen(false);
        }}
      />
    </div>
  );
}
