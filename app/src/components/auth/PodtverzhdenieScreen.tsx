'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ErrorState, SuccessState } from '@/components/ui';
import { CONFIRM_SCREEN } from '@/content/auth';
import { AUTH_HREF } from '@/lib/auth/config';

type View = 'busy' | 'signup' | 'emailChange' | 'expired';

/** Параметры из якоря адреса: #access_token=…&type=signup. */
export function hashParams(hash: string): URLSearchParams {
  return new URLSearchParams(hash.replace(/^#/, ''));
}

/**
 * Куда ведёт ссылка из письма подтверждения. SDK разбирает якорь сам
 * и сохраняет сессию; здесь — только экран результата и перенос фактов
 * онбординга из браузера в профиль.
 */
export function PodtverzhdenieScreen() {
  const [view, setView] = useState<View>('busy');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = hashParams(window.location.hash);
      const failed =
        params.has('error') || params.has('error_code') || params.has('error_description');
      const type = params.get('type');
      if (failed || !params.has('access_token')) {
        setView('expired');
        return;
      }
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session === null) {
        setView('expired');
        return;
      }
      setView(type === 'email_change' ? 'emailChange' : 'signup');
      const { loadProfile, syncOnboarding } = await import('@/lib/auth/profile');
      const profile = await loadProfile().catch(() => null);
      if (profile !== null) await syncOnboarding(profile);
    })().catch(() => {
      if (!cancelled) setView('expired');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (view === 'busy') {
    return (
      <p className="auth-busy" role="status">
        {CONFIRM_SCREEN.busy}
      </p>
    );
  }
  if (view === 'expired') {
    return (
      <ErrorState
        title={CONFIRM_SCREEN.expired.title}
        description={CONFIRM_SCREEN.expired.text}
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
            {CONFIRM_SCREEN.expired.go}
          </Link>
        }
      />
    );
  }
  const text = view === 'emailChange' ? CONFIRM_SCREEN.emailChange : CONFIRM_SCREEN.signup;
  return (
    <SuccessState
      title={text.title}
      description={text.text}
      action={
        <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
          {text.go}
        </Link>
      }
    />
  );
}
