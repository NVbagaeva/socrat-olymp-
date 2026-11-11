'use client';

/**
 * Ссылка-приглашение /kabinet/vstupit/?kod=…: ученик вступает в класс
 * одной кнопкой. Не вошёл — код запоминается в браузере, и после входа
 * кабинет подставит его в форму «Вступить в класс».
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, EmptyState } from '@/components/ui';
import { DZ } from '@/content/dz';
import { AUTH_HREF } from '@/lib/auth/config';
import { DZ_HREF } from '@/lib/dz/links';
import { browserStorage } from '@/lib/storage';
import { JoinClassForm } from './KabinetDz';
import { queryParam, useUser } from './common';
import './dz.css';

/** Код из ссылки, пока ученик входит: ключ браузера, в аккаунт не уходит. */
export const PENDING_CODE_KEY = 'budetege-dz:kod';

export function rememberCode(code: string): void {
  try {
    browserStorage()?.setItem(PENDING_CODE_KEY, code);
  } catch {
    /* Не запомнили — ученик введёт код сам. */
  }
}

export function pendingCode(): string {
  try {
    return browserStorage()?.getItem(PENDING_CODE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function forgetCode(): void {
  try {
    browserStorage()?.removeItem(PENDING_CODE_KEY);
  } catch {
    /* Ничего страшного: код просто останется подсказкой. */
  }
}

export function JoinScreen() {
  const user = useUser();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const kod = (queryParam('kod') ?? '').trim();
    if (kod !== '' && user === null) rememberCode(kod);
    /* Адрес есть только в браузере: читаем после отрисовки. */
    const timer = window.setTimeout(() => setCode(kod), 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  if (code === null) return <p className="auth-form__muted">…</p>;
  if (user === null) {
    return (
      <EmptyState
        title={DZ.join.pageTitle}
        description={DZ.join.needLogin}
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
            {DZ.join.login}
          </Link>
        }
      />
    );
  }
  if (user.role !== 'student') {
    return <EmptyState title={DZ.join.pageTitle} description={DZ.join.tutorOnly} />;
  }
  return (
    <div className="dz-page" data-page="vstupit">
      <Card className="kabinet__card" title={DZ.join.pageTitle}>
        <p className="auth-form__text">{DZ.join.pageText}</p>
        <JoinClassForm initial={code} onJoined={forgetCode} />
        <p className="dz-actions">
          <Link className="btn btn--ghost" href={DZ_HREF.kabinet}>
            {DZ.join.toKabinet}
          </Link>
        </p>
      </Card>
    </div>
  );
}
