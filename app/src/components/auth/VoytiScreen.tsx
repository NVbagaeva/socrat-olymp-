'use client';

import Link from 'next/link';
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
import {
  AUTH_UI,
  FORGOT_FORM,
  LOGIN_FORM,
  PASSWORD_MIN,
  REGISTER_FORM,
  emailLooksValid,
} from '@/content/auth';
import { AUTH_HREF } from '@/lib/auth/config';
import { AUTH_ERRORS, describeAuthError } from '@/lib/auth/errors';
import { setRememberMe, useSessionUser, type UserRole } from '@/lib/auth/session';
import { PasswordField } from './PasswordField';
import { RoleCards } from './RoleCards';

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
        label="Вход или регистрация"
        value={tab}
        onValueChange={(id) => setTab(id as Tab)}
        items={[
          { id: 'login', label: AUTH_UI.tabs.login },
          { id: 'register', label: AUTH_UI.tabs.register },
        ]}
      />
      {tab === 'login' ? (
        <LoginForm onRegister={() => setTab('register')} />
      ) : (
        <RegisterForm onLogin={() => setTab('login')} />
      )}
    </section>
  );
}

/* ── Вход ─────────────────────────────────────────────────────── */

function LoginForm({ onRegister }: { onRegister: () => void }) {
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, startCooldown] = useCooldown();

  if (forgot) {
    return <ForgotForm initialEmail={email} onBack={() => setForgot(false)} />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
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
          autoComplete="username"
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
        <button type="button" className="auth-form__link" onClick={onRegister}>
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

/* ── Регистрация ───────────────────────────────────────────────── */

function RegisterForm({ onLogin }: { onLogin: () => void }) {
  const router = useRouter();
  const id = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, startCooldown] = useCooldown();

  if (sentTo !== null) {
    return (
      <SuccessState
        title={REGISTER_FORM.sent.title}
        description={
          <>
            {REGISTER_FORM.sent.text(sentTo)}
            <br />
            <span className="auth-form__hint">{REGISTER_FORM.sent.hint}</span>
          </>
        }
        action={
          <div className="auth-form__actions">
            <button type="button" className="btn btn--secondary" onClick={onLogin}>
              {REGISTER_FORM.toLogin}
            </button>
            {resent ? (
              <span className="auth-form__ok">{LOGIN_FORM.resent}</span>
            ) : cooldown > 0 ? (
              <span className="auth-form__muted">{LOGIN_FORM.wait(cooldown)}</span>
            ) : (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={async () => {
                  const { getClient } = await import('@/lib/auth/client');
                  const supabase = await getClient();
                  const { error: failure } = await supabase.auth.resend({
                    type: 'signup',
                    email: sentTo,
                    options: { emailRedirectTo: backTo(AUTH_HREF.podtverzhdenie) },
                  });
                  if (failure) {
                    setError(describeAuthError(failure, sentTo));
                    return;
                  }
                  setResent(true);
                  startCooldown();
                }}
              >
                {LOGIN_FORM.resend}
              </button>
            )}
            {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
          </div>
        }
      />
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (cleanName === '') {
      setError(REGISTER_FORM.nameRequired);
      return;
    }
    if (!emailLooksValid(cleanEmail)) {
      setError(REGISTER_FORM.emailInvalid);
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(AUTH_ERRORS.weakPassword);
      return;
    }
    if (role === null) {
      setError(REGISTER_FORM.roleRequired);
      return;
    }
    setBusy(true);
    try {
      /* Новый аккаунт — сессию помним: так ссылка из письма сразу откроет кабинет. */
      setRememberMe(true);
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const { data, error: failure } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: cleanName, role },
          emailRedirectTo: backTo(AUTH_HREF.podtverzhdenie),
        },
      });
      if (failure) {
        setError(describeAuthError(failure, cleanEmail));
        return;
      }
      if (data.session !== null) {
        /* Подтверждение почты выключено в настройках — сразу в кабинет. */
        router.push(AUTH_HREF.kabinet);
        return;
      }
      startCooldown();
      setSentTo(cleanEmail);
    } catch {
      setError(AUTH_ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <p className="auth-form__text">{REGISTER_FORM.intro}</p>
      <div className="field">
        <FieldLabel htmlFor={`${id}-name`}>{REGISTER_FORM.name}</FieldLabel>
        <Input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          placeholder={REGISTER_FORM.namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
          disabled={busy}
        />
      </div>
      <div className="field">
        <FieldLabel htmlFor={`${id}-email`}>{REGISTER_FORM.email}</FieldLabel>
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
      <PasswordField
        label={REGISTER_FORM.password}
        value={password}
        onChange={setPassword}
        fresh
        autoComplete="new-password"
        disabled={busy}
      />
      <fieldset className="auth-form__roles">
        <legend className="field__label">{REGISTER_FORM.roleTitle}</legend>
        <RoleCards
          value={role}
          onChange={setRole}
          label={REGISTER_FORM.roleTitle}
          disabled={busy}
        />
      </fieldset>
      {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
      <Button type="submit" size="lg" fullWidth loading={busy}>
        {REGISTER_FORM.submit}
      </Button>
      <p className="auth-form__switch">
        {REGISTER_FORM.haveAccount}{' '}
        <button type="button" className="auth-form__link" onClick={onLogin}>
          {REGISTER_FORM.toLogin}
        </button>
      </p>
      <p className="auth-form__hint">
        <Link href="/">На главную</Link>
      </p>
    </form>
  );
}
