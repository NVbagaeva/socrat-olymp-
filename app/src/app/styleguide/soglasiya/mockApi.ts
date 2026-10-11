/**
 * Демо-сервер для витрины /styleguide/soglasiya/: всё в памяти вкладки.
 * Повторяет правила миграции supabase/migrations/20261011120000_soglasiya.sql
 * (две галочки, письмо родителю раз в минуту, одноразовая ссылка,
 * удаление без журнала согласий) — чтобы проверить экраны до сервера.
 * На сайт не попадает: страница существует только в next dev.
 */

import type { AccountApi, AccountSnapshot } from '@/lib/account/api';
import {
  checkRegistration,
  RESEND_INTERVAL_MS,
  type ConsentKind,
  type ConsentRecord,
} from '@/lib/account/consents';
import { buildParentLetter, type ParentLetter } from '@/lib/account/parentLetter';

export interface DemoLetter extends ParentLetter {
  to: string;
  token: string;
  sentAt: string;
}

export interface DemoDb {
  account: AccountSnapshot | null;
  /** Журнал согласий: переживает удаление аккаунта. */
  consents: (ConsentRecord & {
    email: string;
    accountDeletedAt: string | null;
    parentEmail: string | null;
  })[];
  outbox: DemoLetter[];
  validToken: string | null;
  currentVersion: string;
}

const DEMO_IP = '127.0.0.1';

export function createDemoApi(
  db: DemoDb,
  consentText: string,
  changed: () => void,
): AccountApi & {
  confirmParent(token: string): void;
} {
  const now = () => new Date().toISOString();
  const log = (kind: ConsentKind, email: string, parentEmail: string | null = null) =>
    db.consents.push({
      kind,
      version: db.currentVersion,
      acceptedAt: now(),
      ip: DEMO_IP,
      email,
      accountDeletedAt: null,
      parentEmail,
    });
  const own = () => db.consents.filter((c) => c.email === db.account?.email && !c.accountDeletedAt);
  const snap = (): AccountSnapshot => {
    if (!db.account) throw new Error('no_account');
    db.account = { ...db.account, consents: own() };
    changed();
    return db.account;
  };
  const sendLetter = () => {
    const a = db.account;
    if (!a?.parentEmail) return;
    const token = Math.random().toString(36).slice(2, 12);
    db.validToken = token;
    db.outbox.unshift({
      to: a.parentEmail,
      token,
      sentAt: now(),
      ...buildParentLetter({
        childName: a.name,
        confirmUrl: `https://budetege.ru/soglasie-roditelya/?t=${token}`,
        consentText,
      }),
    });
    db.account = { ...a, parentLetterSentAt: now() };
  };

  return {
    async register(form, version) {
      if (!checkRegistration(form).canSubmit) throw new Error('consents_required');
      if (version !== db.currentVersion) throw new Error('outdated_documents');
      const check = checkRegistration(form);
      db.account = {
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role,
        birthYear: form.role === 'student' ? Number(form.birthYear) : null,
        parentEmail: check.needsParent ? form.parentEmail.trim().toLowerCase() : null,
        parentRequired: check.needsParent,
        parentConfirmedAt: null,
        parentLetterSentAt: null,
        consents: [],
      };
      log('soglashenie', db.account.email);
      log('soglasie', db.account.email);
      if (check.needsParent) sendLetter();
      return snap();
    },
    async acceptDocuments(kinds, version) {
      if (version !== db.currentVersion || !db.account) throw new Error('outdated_documents');
      for (const k of kinds) log(k, db.account.email);
      return snap();
    },
    async resendParentLetter() {
      const sent = db.account?.parentLetterSentAt;
      if (sent && Date.now() - new Date(sent).getTime() < RESEND_INTERVAL_MS)
        throw new Error('too_soon');
      sendLetter();
      return snap();
    },
    async exportMyData() {
      return { exported_at: now(), account: db.account, consents: own() };
    },
    async deleteAccount() {
      for (const c of own()) c.accountDeletedAt = now();
      db.account = null;
      changed();
    },
    confirmParent(token) {
      if (!db.account || token !== db.validToken) throw new Error('bad_token');
      db.validToken = null;
      db.account = { ...db.account, parentConfirmedAt: now() };
      log('soglasie_roditelya', db.account.email, db.account.parentEmail);
      snap();
    },
  };
}

/** Демо-база с подпиской — для useSyncExternalStore в витрине. */
export function createDemoStore(version: string, consentText: string) {
  const db: DemoDb = {
    account: null,
    consents: [],
    outbox: [],
    validToken: null,
    currentVersion: version,
  };
  const listeners = new Set<() => void>();
  let tick = 0;
  const changed = () => {
    tick += 1;
    listeners.forEach((l) => l());
  };
  return {
    db,
    api: createDemoApi(db, consentText, changed),
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    snapshot: () => tick,
    /** «Опубликовать новую редакцию»: дата на три месяца позже. */
    newEdition() {
      const d = db.currentVersion === 'chernovik' ? new Date() : new Date(db.currentVersion);
      d.setMonth(d.getMonth() + 3);
      db.currentVersion = d.toISOString().slice(0, 10);
      changed();
    },
    changed,
  };
}
