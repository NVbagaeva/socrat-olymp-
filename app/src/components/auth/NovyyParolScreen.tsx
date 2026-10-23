'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, ErrorState, FieldMessage, SuccessState } from '@/components/ui';
import { NEW_PASSWORD_SCREEN, PASSWORD_MIN } from '@/content/auth';
import { AUTH_HREF } from '@/lib/auth/config';
import { AUTH_ERRORS, describeAuthError } from '@/lib/auth/errors';
import { PasswordField } from './PasswordField';
import { hashParams } from './PodtverzhdenieScreen';

type View = 'busy' | 'form' | 'done' | 'noSession';

/**
 * Куда ведёт ссылка из письма «Забыли пароль?». Ссылка приносит
 * временную сессию (type=recovery); форма сохраняет новый пароль,
 * и с ним человек остаётся вошедшим.
 */
export function NovyyParolScreen() {
  const [view, setView] = useState<View>('busy');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = hashParams(window.location.hash);
      if (params.has('error') || params.has('error_code')) {
        setView('noSession');
        return;
      }
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) setView(session === null ? 'noSession' : 'form');
    })().catch(() => {
      if (!cancelled) setView('noSession');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (password.length < PASSWORD_MIN) {
      setError(AUTH_ERRORS.weakPassword);
      return;
    }
    if (password !== repeat) {
      setError(NEW_PASSWORD_SCREEN.mismatch);
      return;
    }
    setBusy(true);
    try {
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const { error: failure } = await supabase.auth.updateUser({ password });
      if (failure) {
        setError(describeAuthError(failure));
        return;
      }
      setView('done');
    } catch {
      setError(AUTH_ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  if (view === 'busy') {
    return (
      <p className="auth-busy" role="status">
        …
      </p>
    );
  }
  if (view === 'noSession') {
    return (
      <ErrorState
        title={NEW_PASSWORD_SCREEN.noSession.title}
        description={NEW_PASSWORD_SCREEN.noSession.text}
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
            {NEW_PASSWORD_SCREEN.noSession.go}
          </Link>
        }
      />
    );
  }
  if (view === 'done') {
    return (
      <SuccessState
        title={NEW_PASSWORD_SCREEN.done.title}
        description={NEW_PASSWORD_SCREEN.done.text}
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
            {NEW_PASSWORD_SCREEN.done.go}
          </Link>
        }
      />
    );
  }
  return (
    <section className="auth-card" aria-labelledby="novyy-parol-title">
      <h1 className="auth-card__title" id="novyy-parol-title">
        {NEW_PASSWORD_SCREEN.title}
      </h1>
      <form className="auth-form" onSubmit={submit} noValidate>
        <p className="auth-form__text">{NEW_PASSWORD_SCREEN.text}</p>
        <PasswordField
          label={NEW_PASSWORD_SCREEN.password}
          value={password}
          onChange={setPassword}
          fresh
          autoComplete="new-password"
          disabled={busy}
        />
        <PasswordField
          name="password-repeat"
          label={NEW_PASSWORD_SCREEN.repeat}
          value={repeat}
          onChange={setRepeat}
          autoComplete="new-password"
          disabled={busy}
          error={repeat !== '' && repeat !== password ? NEW_PASSWORD_SCREEN.mismatch : null}
        />
        {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
        <Button type="submit" size="lg" fullWidth loading={busy}>
          {NEW_PASSWORD_SCREEN.submit}
        </Button>
      </form>
    </section>
  );
}
