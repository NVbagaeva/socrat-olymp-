'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  Checkbox,
  FieldLabel,
  FieldMessage,
  Input,
  SuccessState,
  Tabs,
} from '@/components/ui';
import { AUTH_UI, FORGOT_FORM, LOGIN_FORM, REGISTER_FORM, emailLooksValid } from '@/content/auth';
import { AUTH_HREF } from '@/lib/auth/config';
import { AUTH_ERRORS, describeAuthError } from '@/lib/auth/errors';
import { setRememberMe, useSessionUser } from '@/lib/auth/session';
import { PasswordField } from './PasswordField';
import { RegisterWizard } from './RegisterWizard';

type Tab = 'login' | 'register';

/** Адрес, куда ссылка из письма возвращает в браузер. */
function backTo(path: string): string {
  return `${window.location.origin}${path}`;
}

/** Повторная отправка письма — не чаще раза в минуту (столько же держит сервер). */
const RESEND_COOLDOWN = 60;

function useCooldown(): [number, () => void] {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= now) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [until, now]);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  return [left, () => setUntil(Date.now() + RESEND_COOLDOWN * 1000)];
}

/**
 * Страница /voyti/: вкладки «Войти» и «Зарегистрироваться», внутри
 * первой — сброс пароля. SDK грузится при первом отправлении формы.
 */
export function VoytiScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const user = useSessionUser();
  const [tab, setTab] = useState<Tab>(
    params.get('vkladka') === 'registraciya' ? 'register' : 'login',
  );
  const [loginEmail, setLoginEmail] = useState('');
  const [openForgot, setOpenForgot] = useState(false);

  /* Уже вошли — странице входа нечего показывать. */
  useEffect(() => {
    if (user !== null) router.replace(AUTH_HREF.kabinet);
  }, [user, router]);

  return (
    <section className="auth-card" aria-labelledby="voyti-title">
      <h1 className="auth-card__title" id="voyti-title">
        {AUTH_UI.pageTitle}
      </h1>
      <Tabs
        className="auth-card__tabs"
        label={REGISTER_FORM.tabsLabel}
        value={tab}
        onValueChange={(id) => setTab(id as Tab)}
        items={[
          { id: 'login', label: AUTH_UI.tabs.login },
          { id: 'register', label: AUTH_UI.tabs.register },
        ]}
      />
      {tab === 'login' ? (
        <LoginForm
          initialEmail={loginEmail}
          initialForgot={openForgot}
          onRegister={(email) => {
            setLoginEmail(email);
            setOpenForgot(false);
            setTab('register');
          }}
        />
      ) : (
        <RegisterWizard
          onLogin={(email, forgot) => {
            setLoginEmail(email);
            setOpenForgot(forgot === true);
            setTab('login');
          }}
        />
      )}
    </section>
  );
}

/* ── Вход ─────────────────────────────────────────────────────── */

function LoginForm({
  initialEmail,
  initialForgot,
  onRegister,
}: {
  initialEmail: string;
  initialForgot: boolean;
  onRegister: (email: string) => void;
}) {
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [accountMissing, setAccountMissing] = useState(false);
  const [forgot, setForgot] = useState(initialForgot);
  const [resent, setResent] = useState(false);
  const [cooldown, startCooldown] = useCooldown();

  if (forgot) {
    return <ForgotForm initialEmail={email} onBack={() => setForgot(false)} />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setAccountMissing(false);
    setUnconfirmed(false);
    setResent(false);
    const clean = email.trim();
    if (!emailLooksValid(clean)) {
      setError(REGISTER_FORM.emailInvalid);
      return;
    }
    setBusy(true);
    try {
      setRememberMe(remember);
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const { error: failure } = await supabase.auth.signInWithPassword({
        email: clean,
        password,
      });
      if (failure) {
        setError(describeAuthError(failure, clean));
        setUnconfirmed(failure.code === 'email_not_confirmed');
        setAccountMissing(failure.code === 'user_not_found' || failure.code === 'email_not_found');
        return;
      }
      router.push(AUTH_HREF.kabinet);
    } catch {
      setError(AUTH_ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy || cooldown > 0) return;
    setBusy(true);
    try {
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const { error: failure } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: backTo(AUTH_HREF.podtverzhdenie) },
      });
      if (failure) {
        setError(describeAuthError(failure, email.trim()));
        return;
      }
      setResent(true);
      startCooldown();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="field">
        <FieldLabel htmlFor={`${id}-email`}>{LOGIN_FORM.email}</FieldLabel>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          placeholder={LOGIN_FORM.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={busy}
        />
      </div>
      <PasswordField
        label={LOGIN_FORM.password}
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        disabled={busy}
      />
      <div className="auth-form__row">
        <Checkbox
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          disabled={busy}
        >
          {LOGIN_FORM.remember}
        </Checkbox>
        <button type="button" className="auth-form__link" onClick={() => setForgot(true)}>
          {LOGIN_FORM.forgot}
        </button>
      </div>
      {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
      {accountMissing ? (
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => onRegister(email.trim())}
        >
          {LOGIN_FORM.toRegister}
        </Button>
      ) : null}
      {unconfirmed ? (
        <p className="auth-form__resend">
          {resent ? (
            <span className="auth-form__ok">{LOGIN_FORM.resent}</span>
          ) : cooldown > 0 ? (
            <span>{LOGIN_FORM.wait(cooldown)}</span>
          ) : (
            <button type="button" className="auth-form__link" onClick={resend}>
              {LOGIN_FORM.resend}
            </button>
          )}
        </p>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={busy}>
        {LOGIN_FORM.submit}
      </Button>
      <p className="auth-form__switch">
        {LOGIN_FORM.noAccount}{' '}
        <button type="button" className="auth-form__link" onClick={() => onRegister(email.trim())}>
          {LOGIN_FORM.toRegister}
        </button>
      </p>
    </form>
  );
}

/* ── Сброс пароля ──────────────────────────────────────────────── */

function ForgotForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const id = useId();
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <SuccessState
        title={FORGOT_FORM.sent.title}
        description={FORGOT_FORM.sent.text(email.trim())}
        action={
          <button type="button" className="btn btn--secondary" onClick={onBack}>
            {FORGOT_FORM.back}
          </button>
        }
      />
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    const clean = email.trim();
    if (!emailLooksValid(clean)) {
      setError(REGISTER_FORM.emailInvalid);
      return;
    }
    setBusy(true);
    try {
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const { error: failure } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: backTo(AUTH_HREF.novyyParol),
      });
      if (failure) {
        setError(describeAuthError(failure, clean));
        return;
      }
      setSent(true);
    } catch {
      setError(AUTH_ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <h2 className="auth-form__title">{FORGOT_FORM.title}</h2>
      <p className="auth-form__text">{FORGOT_FORM.text}</p>
      <div className="field">
        <FieldLabel htmlFor={`${id}-email`}>{LOGIN_FORM.email}</FieldLabel>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder={LOGIN_FORM.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={busy}
        />
      </div>
      {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
      <Button type="submit" size="lg" fullWidth loading={busy}>
        {FORGOT_FORM.submit}
      </Button>
      <p className="auth-form__switch">
        <button type="button" className="auth-form__link" onClick={onBack}>
          {FORGOT_FORM.back}
        </button>
      </p>
    </form>
  );
}
