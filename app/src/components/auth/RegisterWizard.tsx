'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FieldLabel, FieldMessage, Input } from '@/components/ui';
import { ConsentChecks } from '@/components/account/ConsentChecks';
import { legalDocs } from '@/content/legal/documents';
import { LOGIN_FORM, PASSWORD_MIN, REGISTER_FORM, emailLooksValid } from '@/content/auth';
import { birthYearValid, parentConsentNeeded } from '@/lib/account/consents';
import { AUTH_HREF } from '@/lib/auth/config';
import {
  ALLOWED_EMAIL_DOMAINS,
  emailDomainAllowed,
  suggestEmailDomain,
} from '@/lib/auth/allowed-domains';
import { AUTH_ERRORS, describeAuthError, isDomainRejected } from '@/lib/auth/errors';
import { setRememberMe, type UserRole } from '@/lib/auth/session';
import { documentsVersion, operator, operatorFilled } from '@/lib/legal/operator';
import { PasswordField } from './PasswordField';
import { RoleCards } from './RoleCards';

const DRAFT_KEY = 'budetege:register-draft:v1';
const RESEND_COOLDOWN = 60;
type Draft = {
  name: string;
  email: string;
  role: UserRole | null;
  birthYear: string;
  parentEmail: string;
  consents: { soglashenie: boolean; soglasie: boolean };
  step: number;
};

type FieldKey = 'role' | 'name' | 'email' | 'password' | 'birthYear' | 'parentEmail' | 'consents';

function getDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (raw === null) return null;
    const saved = JSON.parse(raw) as Partial<Draft>;
    return {
      name: typeof saved.name === 'string' ? saved.name : '',
      email: typeof saved.email === 'string' ? saved.email : '',
      role: saved.role === 'student' || saved.role === 'tutor' ? saved.role : null,
      birthYear: typeof saved.birthYear === 'string' ? saved.birthYear : '',
      parentEmail: typeof saved.parentEmail === 'string' ? saved.parentEmail : '',
      consents: {
        soglashenie: saved.consents?.soglashenie === true,
        soglasie: saved.consents?.soglasie === true,
      },
      step: Number.isInteger(saved.step) ? Math.max(0, saved.step ?? 0) : 0,
    };
  } catch {
    return null;
  }
}

function useResendCooldown(): [number, () => void] {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= now) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [until, now]);
  return [
    Math.max(0, Math.ceil((until - now) / 1000)),
    () => setUntil(Date.now() + RESEND_COOLDOWN * 1000),
  ];
}

function FieldHelp({ children, label }: { children: ReactNode; label: string }) {
  return (
    <details className="register-help">
      <summary aria-label={label}>?</summary>
      <span>{children}</span>
    </details>
  );
}

export function RegisterWizard({
  onLogin,
}: {
  onLogin: (email: string, forgot?: boolean) => void;
}) {
  const router = useRouter();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const refs = useRef<Partial<Record<FieldKey, HTMLInputElement | null>>>({});
  const pendingFocus = useRef<FieldKey | null>(null);
  const [bypassFor, setBypassFor] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [consents, setConsents] = useState({ soglashenie: false, soglasie: false });
  const [step, setStep] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [consentAttempted, setConsentAttempted] = useState(false);
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [shakeKey, setShakeKey] = useState<FieldKey | null>(null);
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, startCooldown] = useResendCooldown();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const draft = getDraft();
      if (draft !== null) {
        setName(draft.name);
        setEmail(draft.email);
        setRole(draft.role);
        setBirthYear(draft.birthYear);
        setParentEmail(draft.parentEmail);
        setConsents(draft.consents);
        /* Пароль не сохраняется: после перезагрузки возвращаемся к его шагу. */
        setStep(draft.role === null ? 0 : Math.min(draft.step, 2));
      }
      setDraftReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!draftReady || sentTo !== null) return;
    try {
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ name, email, role, birthYear, parentEmail, consents, step }),
      );
    } catch {
      /* Private browsing can disable sessionStorage; the form still works. */
    }
  }, [birthYear, consents, draftReady, email, name, parentEmail, role, sentTo, step]);

  const year = /^\d{4}$/.test(birthYear.trim()) ? Number(birthYear.trim()) : null;
  const yearOk = year !== null && birthYearValid(year);
  const needsParent = role === 'student' && yearOk && parentConsentNeeded(year);
  const cleanEmail = email.trim();
  const normalizedEmail = cleanEmail.toLowerCase();
  const emailHasSpaces = /\s/.test(email);
  const emailRussianLayout = /[а-яё]/i.test(cleanEmail);
  const typoSuggestion = suggestEmailDomain(cleanEmail);
  const domainAllowed = emailDomainAllowed(cleanEmail) || bypassFor === normalizedEmail;
  const domainBlocked =
    emailLooksValid(cleanEmail) && !domainAllowed && !emailRussianLayout && typoSuggestion === null;
  const isStudent = role === 'student';
  const stepNames = isStudent
    ? [
        REGISTER_FORM.steps.role,
        REGISTER_FORM.steps.identity,
        REGISTER_FORM.steps.password,
        REGISTER_FORM.steps.student,
        REGISTER_FORM.steps.consents,
      ]
    : [
        REGISTER_FORM.steps.role,
        REGISTER_FORM.steps.identity,
        REGISTER_FORM.steps.password,
        REGISTER_FORM.steps.consents,
      ];
  const lastStep = stepNames.length - 1;
  const studentStep = 3;
  const consentStep = isStudent ? 4 : 3;
  const show = (key: FieldKey) => touched[key] === true || attempted[key] === true;
  const nameError = show('name') && name.trim() === '' ? REGISTER_FORM.nameRequired : null;
  const emailError =
    show('email') && (emailHasSpaces || emailRussianLayout || !emailLooksValid(cleanEmail))
      ? emailHasSpaces
        ? REGISTER_FORM.emailSpace
        : emailRussianLayout
          ? REGISTER_FORM.emailRussianLayout
          : cleanEmail !== '' && !cleanEmail.includes('@')
            ? REGISTER_FORM.emailMissingAt
            : REGISTER_FORM.emailInvalid
      : null;
  const passwordError =
    show('password') && password.length < PASSWORD_MIN ? AUTH_ERRORS.weakPassword : null;
  const birthYearError = show('birthYear') && !yearOk ? REGISTER_FORM.birthYearInvalid : null;
  const parentEmailError =
    show('parentEmail') && needsParent
      ? !emailLooksValid(parentEmail.trim())
        ? REGISTER_FORM.parentEmailInvalid
        : parentEmail.trim().toLowerCase() === normalizedEmail
          ? REGISTER_FORM.parentEmailSame
          : null
      : null;
  const emailHelpId = `${id}-email-help`;
  const emailErrorId = `${id}-email-error`;
  const emailDomainId = `${id}-email-domain`;
  const allowedDomainsLabel = ALLOWED_EMAIL_DOMAINS.join(', ');

  const focusField = (key: FieldKey) => {
    setShakeKey(key);
    window.setTimeout(() => setShakeKey((current) => (current === key ? null : current)), 420);
    window.requestAnimationFrame(() => {
      const element =
        refs.current[key] ??
        formRef.current?.querySelector<HTMLInputElement>(
          key === 'role' ? '.role-card' : key === 'consents' ? 'input[type="checkbox"]' : 'input',
        );
      if (element === null || element === undefined) return;
      element.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      element.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (!draftReady || sentTo !== null) return;
    window.requestAnimationFrame(() => {
      if (pendingFocus.current !== null) {
        const target = pendingFocus.current;
        pendingFocus.current = null;
        focusField(target);
      } else if (step === 0) focusField('role');
      else if (step === 1) refs.current.name?.focus({ preventScroll: true });
      else if (step === 2) refs.current.password?.focus({ preventScroll: true });
      else if (isStudent && step === studentStep)
        refs.current.birthYear?.focus({ preventScroll: true });
    });
  }, [draftReady, isStudent, sentTo, step]);

  const issueAtStep = (targetStep: number): { key: FieldKey; step: number } | null => {
    if (targetStep === 0) return role === null ? { key: 'role', step: 0 } : null;
    if (targetStep === 1) {
      if (name.trim() === '') return { key: 'name', step: 1 };
      if (emailHasSpaces || emailRussianLayout || !emailLooksValid(cleanEmail) || domainBlocked)
        return { key: 'email', step: 1 };
    }
    if (targetStep === 2 && password.length < PASSWORD_MIN) return { key: 'password', step: 2 };
    if (isStudent && targetStep === studentStep) {
      if (!yearOk) return { key: 'birthYear', step: studentStep };
      if (needsParent && !emailLooksValid(parentEmail.trim()))
        return { key: 'parentEmail', step: studentStep };
      if (needsParent && parentEmail.trim().toLowerCase() === normalizedEmail)
        return { key: 'parentEmail', step: studentStep };
    }
    if (targetStep === consentStep && (!consents.soglashenie || !consents.soglasie)) {
      return { key: 'consents', step: consentStep };
    }
    return null;
  };

  const showIssue = (issue: { key: FieldKey; step: number }) => {
    setError(null);
    if (issue.step !== step) pendingFocus.current = issue.key;
    setStep(issue.step);
    if (issue.key === 'consents') setConsentAttempted(true);
    else setAttempted((current) => ({ ...current, [issue.key]: true }));
    if (issue.step === step) focusField(issue.key);
  };

  const markCurrentAttempt = () => {
    if (step === 1) setAttempted((current) => ({ ...current, name: true, email: true }));
    if (step === 2) setAttempted((current) => ({ ...current, password: true }));
    if (isStudent && step === studentStep) {
      setAttempted((current) => ({ ...current, birthYear: true, parentEmail: true }));
    }
    if (step === consentStep) setConsentAttempted(true);
  };

  const nextStep = () => {
    markCurrentAttempt();
    const issue = issueAtStep(step);
    if (issue !== null) {
      showIssue(issue);
      return;
    }
    setError(null);
    const next = Math.min(lastStep, step + 1);
    pendingFocus.current =
      next === 1
        ? 'name'
        : next === 2
          ? 'password'
          : isStudent && next === studentStep
            ? 'birthYear'
            : null;
    setStep(next);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (step < lastStep) {
      nextStep();
      return;
    }
    setConsentAttempted(true);
    const issues = [
      { key: 'role' as const, step: 0 },
      { key: 'name' as const, step: 1 },
      { key: 'email' as const, step: 1 },
      { key: 'password' as const, step: 2 },
      ...(isStudent
        ? [
            { key: 'birthYear' as const, step: studentStep },
            ...(needsParent ? [{ key: 'parentEmail' as const, step: studentStep }] : []),
          ]
        : []),
      { key: 'consents' as const, step: consentStep },
    ];
    setAttempted({ name: true, email: true, password: true, birthYear: true, parentEmail: true });
    const firstIssue = issues
      .map((candidate) => issueAtStep(candidate.step))
      .find((issue): issue is { key: FieldKey; step: number } => issue !== null);
    if (firstIssue !== undefined) {
      showIssue(firstIssue);
      return;
    }
    if (!consents.soglashenie || !consents.soglasie) {
      showIssue({ key: 'consents', step: consentStep });
      return;
    }
    if (!operatorFilled) {
      setError(REGISTER_FORM.draftDocuments);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      setRememberMe(true);
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const { data, error: failure } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          /* Keep the existing consent trigger and profile metadata contract. */
          data: {
            name: name.trim(),
            role,
            documents_version: documentsVersion,
            accept_soglashenie: true,
            accept_soglasie: true,
            ...(isStudent ? { birth_year: year } : {}),
            ...(needsParent ? { parent_email: parentEmail.trim().toLowerCase() } : {}),
          },
          emailRedirectTo: `${window.location.origin}${AUTH_HREF.podtverzhdenie}`,
        },
      });
      if (failure) {
        if (isDomainRejected(failure)) {
          setBypassFor(null);
          showIssue({ key: 'email', step: 1 });
          return;
        }
        if (failure.code === 'email_exists' || failure.code === 'user_already_exists') {
          setEmailAlreadyRegistered(true);
          showIssue({ key: 'email', step: 1 });
          return;
        }
        setError(describeAuthError(failure, cleanEmail));
        return;
      }
      if (data.user?.identities?.length === 0) {
        setEmailAlreadyRegistered(true);
        showIssue({ key: 'email', step: 1 });
        return;
      }
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* Ignore unavailable storage after a successful signup. */
      }
      if (data.session !== null) {
        router.push(AUTH_HREF.kabinet);
        return;
      }
      setResent(false);
      setSentTo(cleanEmail);
      startCooldown();
    } catch {
      setError(AUTH_ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy || cooldown > 0 || sentTo === null) return;
    setBusy(true);
    setError(null);
    try {
      const { getClient } = await import('@/lib/auth/client');
      const supabase = await getClient();
      const { error: failure } = await supabase.auth.resend({
        type: 'signup',
        email: sentTo,
        options: { emailRedirectTo: `${window.location.origin}${AUTH_HREF.podtverzhdenie}` },
      });
      if (failure) {
        setError(describeAuthError(failure, sentTo));
        return;
      }
      setResent(true);
      startCooldown();
    } catch {
      setError(AUTH_ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  if (sentTo !== null) {
    const domain = sentTo.split('@').at(-1)?.toLowerCase() ?? '';
    const mailLink =
      domain === 'mail.ru' ||
      domain === 'bk.ru' ||
      domain === 'inbox.ru' ||
      domain === 'list.ru' ||
      domain === 'internet.ru'
        ? 'https://e.mail.ru/'
        : domain === 'yandex.ru' ||
            domain === 'ya.ru' ||
            domain === 'yandex.com' ||
            domain === 'yandex.by' ||
            domain === 'yandex.kz' ||
            domain === 'narod.ru'
          ? 'https://mail.yandex.ru/'
          : null;
    return (
      <section className="auth-confirm" aria-labelledby={`${id}-confirm-title`}>
        <div className="auth-confirm__envelope" aria-hidden="true">
          ✉
        </div>
        <h2 className="auth-form__title" id={`${id}-confirm-title`}>
          {REGISTER_FORM.confirm.title}
        </h2>
        <p className="auth-confirm__email">{REGISTER_FORM.confirm.sentTo(sentTo)}</p>
        <button
          type="button"
          className="auth-form__link"
          onClick={() => {
            setSentTo(null);
            setEmailAlreadyRegistered(false);
            pendingFocus.current = 'email';
            setStep(1);
          }}
        >
          {REGISTER_FORM.confirm.editEmail}
        </button>
        <ol className="auth-confirm__steps">
          {REGISTER_FORM.confirm.steps.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        {mailLink !== null ? (
          <a
            className="btn btn--primary btn--lg btn--block"
            href={mailLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {domain === 'mail.ru' ||
            domain === 'bk.ru' ||
            domain === 'inbox.ru' ||
            domain === 'list.ru' ||
            domain === 'internet.ru'
              ? REGISTER_FORM.confirm.openMailru
              : REGISTER_FORM.confirm.openYandex}
          </a>
        ) : null}
        <details className="auth-confirm__missing">
          <summary>{REGISTER_FORM.confirm.missing}</summary>
          <p>{REGISTER_FORM.confirm.missingDetails}</p>
          {resent ? (
            <FieldMessage tone="success">{LOGIN_FORM.resent}</FieldMessage>
          ) : cooldown > 0 ? (
            <FieldMessage>{LOGIN_FORM.wait(cooldown)}</FieldMessage>
          ) : (
            <Button type="button" variant="secondary" onClick={resend} loading={busy}>
              {LOGIN_FORM.resend}
            </Button>
          )}
        </details>
        {error !== null ? (
          <div className="auth-confirm__error">
            <FieldMessage tone="error">{error}</FieldMessage>
            <Button type="button" variant="secondary" onClick={resend} loading={busy}>
              {REGISTER_FORM.retry}
            </Button>
          </div>
        ) : null}
      </section>
    );
  }

  const nameId = `${id}-name`;
  const emailId = `${id}-email`;
  const yearId = `${id}-year`;
  const parentId = `${id}-parent`;
  const nameHint = isStudent ? REGISTER_FORM.nameStudent : REGISTER_FORM.nameTutor;
  const nameState = nameError !== null ? 'error' : name.trim().length > 1 ? 'success' : 'default';
  const emailState =
    emailError !== null
      ? 'error'
      : emailLooksValid(cleanEmail) &&
          !emailHasSpaces &&
          !emailRussianLayout &&
          !domainBlocked &&
          !emailAlreadyRegistered
        ? 'success'
        : 'default';
  const yearState = birthYearError !== null ? 'error' : yearOk ? 'success' : 'default';
  const parentState =
    parentEmailError !== null
      ? 'error'
      : needsParent &&
          emailLooksValid(parentEmail.trim()) &&
          parentEmail.trim().toLowerCase() !== normalizedEmail
        ? 'success'
        : 'default';
  const quickYears = Array.from({ length: 12 }, (_, index) => new Date().getFullYear() - index - 8);
  const consentComplete = consents.soglashenie && consents.soglasie;

  return (
    <form ref={formRef} className="auth-form register-wizard" onSubmit={submit} noValidate>
      <p className="auth-form__text">{REGISTER_FORM.intro}</p>
      <nav
        className="register-progress"
        aria-label={REGISTER_FORM.steps.progress(step + 1, stepNames.length)}
        data-role={role ?? 'none'}
      >
        <p className="register-progress__count" aria-live="polite">
          {REGISTER_FORM.steps.progress(step + 1, stepNames.length)}
        </p>
        <ol>
          {stepNames.map((stepName, index) => {
            const complete = index < step || (index === 0 && role !== null && step > 0);
            return (
              <li
                key={`${index}-${stepName}`}
                className={index === step ? 'is-current' : complete ? 'is-complete' : ''}
                aria-current={index === step ? 'step' : undefined}
                data-step={index}
              >
                <span className="register-progress__mark" aria-hidden="true">
                  {complete ? '✓' : index + 1}
                </span>
                <span>{stepName}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 0 ? (
        <section className="register-step" aria-labelledby={`${id}-role-title`}>
          <h2 className="auth-form__title" id={`${id}-role-title`}>
            {REGISTER_FORM.steps.role}
          </h2>
          <fieldset className="auth-form__roles">
            <legend className="sr-only">{REGISTER_FORM.roleTitle}</legend>
            <RoleCards
              value={role}
              onChange={(value) => {
                setRole(value);
                setAttempted((current) => ({ ...current, role: true }));
                setError(null);
                setStep(1);
              }}
              label={REGISTER_FORM.roleTitle}
              disabled={busy}
            />
          </fieldset>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="register-step" aria-labelledby={`${id}-identity-title`}>
          <h2 className="auth-form__title" id={`${id}-identity-title`}>
            {REGISTER_FORM.steps.identity}
          </h2>
          <div
            className={`field${shakeKey === 'name' ? 'register-field--shake' : ''}`}
            data-field="name"
          >
            <div className="register-field__label">
              <FieldLabel htmlFor={nameId}>{REGISTER_FORM.name}</FieldLabel>
              <FieldHelp label={REGISTER_FORM.help.button}>{REGISTER_FORM.help.name}</FieldHelp>
            </div>
            <Input
              ref={(node) => {
                refs.current.name = node;
              }}
              id={nameId}
              name="name"
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              placeholder={REGISTER_FORM.namePlaceholder}
              value={name}
              onFocus={() => setFocused('name')}
              onBlur={() => {
                setFocused(null);
                setTouched((current) => ({ ...current, name: true }));
              }}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
              disabled={busy}
              state={nameState}
              aria-describedby={
                nameError !== null
                  ? `${id}-name-error`
                  : focused === 'name'
                    ? `${id}-name-hint`
                    : undefined
              }
            />
            {nameError !== null ? (
              <FieldMessage id={`${id}-name-error`} tone="error">
                {nameError}
              </FieldMessage>
            ) : focused === 'name' ? (
              <FieldMessage id={`${id}-name-hint`}>{nameHint}</FieldMessage>
            ) : null}
          </div>
          <div
            className={`field${shakeKey === 'email' ? 'register-field--shake' : ''}`}
            data-field="email"
          >
            <div className="register-field__label">
              <FieldLabel htmlFor={emailId}>{REGISTER_FORM.email}</FieldLabel>
              <FieldHelp label={REGISTER_FORM.help.button}>{REGISTER_FORM.emailHelp}</FieldHelp>
            </div>
            {/* Preserve raw Unicode so the layout hint can run before browser IDN conversion. */}
            <Input
              ref={(node) => {
                refs.current.email = node;
              }}
              id={emailId}
              name="email"
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              enterKeyHint="next"
              placeholder={LOGIN_FORM.emailPlaceholder}
              spellCheck={false}
              value={email}
              onFocus={() => setFocused('email')}
              onBlur={() => {
                setFocused(null);
                setTouched((current) => ({ ...current, email: true }));
              }}
              onChange={(event) => {
                setEmail(event.target.value);
                setBypassFor(null);
                setEmailAlreadyRegistered(false);
                setError(null);
              }}
              required
              disabled={busy}
              state={emailState}
              aria-invalid={emailError !== null || undefined}
              aria-describedby={
                [
                  emailError !== null ? emailErrorId : null,
                  focused === 'email' ? emailHelpId : null,
                  domainBlocked ? emailDomainId : null,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
            {focused === 'email' && emailError === null ? (
              <FieldMessage id={emailHelpId}>{REGISTER_FORM.emailHint}</FieldMessage>
            ) : null}
            {emailError !== null ? (
              <FieldMessage id={emailErrorId} tone="error">
                {emailError}
              </FieldMessage>
            ) : null}
            {emailAlreadyRegistered ? (
              <div className="register-email-status" role="status">
                <FieldMessage>{REGISTER_FORM.emailAlreadyRegistered}</FieldMessage>
                <div className="auth-form__row">
                  <button
                    type="button"
                    className="auth-form__link"
                    onClick={() => onLogin(cleanEmail)}
                  >
                    {REGISTER_FORM.emailLogin}
                  </button>
                  <button
                    type="button"
                    className="auth-form__link"
                    onClick={() => onLogin(cleanEmail, true)}
                  >
                    {REGISTER_FORM.emailForgot}
                  </button>
                </div>
              </div>
            ) : null}
            <p className="register-providers__caption">{REGISTER_FORM.emailProvidersCaption}</p>
            <div
              className="register-providers"
              aria-label={`${REGISTER_FORM.emailProvidersCaption}: ${allowedDomainsLabel}`}
            >
              {ALLOWED_EMAIL_DOMAINS.map((domainName) => (
                <span className="register-providers__chip" key={domainName}>
                  {domainName}
                </span>
              ))}
            </div>
            {typoSuggestion !== null ? (
              <div className="register-email-suggestion" role="status">
                <span>{REGISTER_FORM.emailTypo(typoSuggestion)}</span>
                <button
                  type="button"
                  className="auth-form__link"
                  onClick={() => {
                    setEmail(typoSuggestion);
                    setEmailAlreadyRegistered(false);
                    setTouched((current) => ({ ...current, email: true }));
                  }}
                >
                  {REGISTER_FORM.emailTypoFix}
                </button>
              </div>
            ) : null}
            {domainBlocked ? (
              <div className="auth-form__domain" id={emailDomainId} role="status">
                <p>{REGISTER_FORM.domain.before}</p>
                <div className="auth-form__row">
                  <a href="https://mail.yandex.ru/" target="_blank" rel="noopener noreferrer">
                    {REGISTER_FORM.domain.yandex}
                  </a>
                  <a
                    href="https://account.mail.ru/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {REGISTER_FORM.domain.mailru}
                  </a>
                </div>
                <p>
                  {REGISTER_FORM.domain.school}{' '}
                  <a
                    href={`mailto:${operator.pochta}?subject=${encodeURIComponent(REGISTER_FORM.domain.subject)}`}
                  >
                    {REGISTER_FORM.domain.link}
                  </a>
                </p>
                <button
                  type="button"
                  className="auth-form__link"
                  onClick={() => {
                    setBypassFor(normalizedEmail);
                    setTouched((current) => ({ ...current, email: true }));
                  }}
                >
                  {REGISTER_FORM.domain.added}
                </button>
              </div>
            ) : null}
          </div>
          {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section
          className={`register-step${shakeKey === 'password' ? 'register-field--shake' : ''}`}
          aria-labelledby={`${id}-password-title`}
          data-field="password"
        >
          <h2 className="auth-form__title" id={`${id}-password-title`}>
            {REGISTER_FORM.steps.password}
          </h2>
          <div className="register-password-intro">
            <span aria-hidden="true">{password.length >= PASSWORD_MIN ? '✓' : '○'}</span>
            <span>{REGISTER_FORM.passwordRules}</span>
          </div>
          <PasswordField
            inputId={`${id}-password`}
            inputRef={(node) => {
              refs.current.password = node;
            }}
            help={
              <FieldHelp label={REGISTER_FORM.help.button}>{REGISTER_FORM.help.password}</FieldHelp>
            }
            label={REGISTER_FORM.password}
            value={password}
            onChange={setPassword}
            fresh
            autoComplete="new-password"
            disabled={busy}
            error={passwordError}
            onFocus={() => setFocused('password')}
            onBlur={() => {
              setFocused(null);
              setTouched((current) => ({ ...current, password: true }));
            }}
          />
          {focused === 'password' ? (
            <FieldMessage>{REGISTER_FORM.help.password}</FieldMessage>
          ) : null}
        </section>
      ) : null}

      {isStudent && step === studentStep ? (
        <section className="register-step" aria-labelledby={`${id}-student-title`}>
          <h2 className="auth-form__title" id={`${id}-student-title`}>
            {REGISTER_FORM.steps.student}
          </h2>
          <div
            className={`field${shakeKey === 'birthYear' ? 'register-field--shake' : ''}`}
            data-field="birthYear"
          >
            <div className="register-field__label">
              <FieldLabel htmlFor={yearId}>{REGISTER_FORM.birthYear}</FieldLabel>
              <FieldHelp label={REGISTER_FORM.help.button}>
                {REGISTER_FORM.help.birthYear}
              </FieldHelp>
            </div>
            <Input
              ref={(node) => {
                refs.current.birthYear = node;
              }}
              id={yearId}
              name="birth-year"
              type="text"
              inputMode="numeric"
              autoComplete="bday-year"
              enterKeyHint="next"
              maxLength={4}
              placeholder={REGISTER_FORM.birthYearPlaceholder}
              value={birthYear}
              onFocus={() => setFocused('birthYear')}
              onBlur={() => {
                setFocused(null);
                setTouched((current) => ({ ...current, birthYear: true }));
              }}
              onChange={(event) => setBirthYear(event.target.value.replace(/\D/g, ''))}
              disabled={busy}
              state={yearState}
              aria-describedby={
                birthYearError !== null
                  ? `${id}-year-error`
                  : focused === 'birthYear'
                    ? `${id}-year-hint`
                    : undefined
              }
            />
            {birthYearError !== null ? (
              <FieldMessage id={`${id}-year-error`} tone="error">
                {birthYearError}
              </FieldMessage>
            ) : focused === 'birthYear' ? (
              <FieldMessage id={`${id}-year-hint`}>{REGISTER_FORM.birthYearHint}</FieldMessage>
            ) : null}
            <p className="register-years__caption">{REGISTER_FORM.yearsQuickPick}</p>
            <div className="register-years">
              {quickYears.map((quickYear) => (
                <button
                  type="button"
                  className={birthYear === String(quickYear) ? 'is-selected' : ''}
                  key={quickYear}
                  onClick={() => {
                    setBirthYear(String(quickYear));
                    setTouched((current) => ({ ...current, birthYear: true }));
                  }}
                >
                  {quickYear}
                </button>
              ))}
            </div>
          </div>
          {needsParent ? (
            <>
              <div className="register-parent-note" role="note">
                <p>{REGISTER_FORM.parentUnder18}</p>
                <p className="register-parent-note__trial">{REGISTER_FORM.parentTrialNote}</p>
              </div>
              <div
                className={`field${shakeKey === 'parentEmail' ? 'register-field--shake' : ''}`}
                data-field="parentEmail"
              >
                <div className="register-field__label">
                  <FieldLabel htmlFor={parentId}>{REGISTER_FORM.parentEmail}</FieldLabel>
                  <FieldHelp label={REGISTER_FORM.help.button}>
                    {REGISTER_FORM.help.parentEmail}
                  </FieldHelp>
                </div>
                <Input
                  ref={(node) => {
                    refs.current.parentEmail = node;
                  }}
                  id={parentId}
                  name="parent-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  enterKeyHint="next"
                  placeholder={LOGIN_FORM.emailPlaceholder}
                  value={parentEmail}
                  onFocus={() => setFocused('parentEmail')}
                  onBlur={() => {
                    setFocused(null);
                    setTouched((current) => ({ ...current, parentEmail: true }));
                  }}
                  onChange={(event) => setParentEmail(event.target.value)}
                  disabled={busy}
                  state={parentState}
                  aria-describedby={
                    parentEmailError !== null
                      ? `${id}-parent-error`
                      : focused === 'parentEmail'
                        ? `${id}-parent-hint`
                        : undefined
                  }
                />
                {parentEmailError !== null ? (
                  <FieldMessage id={`${id}-parent-error`} tone="error">
                    {parentEmailError}
                  </FieldMessage>
                ) : focused === 'parentEmail' ? (
                  <FieldMessage id={`${id}-parent-hint`}>
                    {REGISTER_FORM.parentSameHint}
                  </FieldMessage>
                ) : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {step === consentStep ? (
        <section className="register-step" aria-labelledby={`${id}-consents-title`}>
          <h2 className="auth-form__title" id={`${id}-consents-title`}>
            {REGISTER_FORM.steps.consents}
          </h2>
          <div className="register-review" aria-label={REGISTER_FORM.steps.review}>
            <h3>{REGISTER_FORM.steps.review}</h3>
            <div className="register-review__row">
              <span>{REGISTER_FORM.summary.name}</span>
              <strong>{name.trim()}</strong>
              <button type="button" className="auth-form__link" onClick={() => setStep(1)}>
                {REGISTER_FORM.steps.edit}
              </button>
            </div>
            <div className="register-review__row">
              <span>{REGISTER_FORM.summary.email}</span>
              <strong>{cleanEmail}</strong>
              <button type="button" className="auth-form__link" onClick={() => setStep(1)}>
                {REGISTER_FORM.steps.edit}
              </button>
            </div>
            <div className="register-review__row">
              <span>{REGISTER_FORM.summary.role}</span>
              <strong>{role === null ? '' : REGISTER_FORM.roles[role].title}</strong>
              <button type="button" className="auth-form__link" onClick={() => setStep(0)}>
                {REGISTER_FORM.steps.edit}
              </button>
            </div>
          </div>
          <div className={shakeKey === 'consents' ? 'register-field--shake' : undefined}>
            <ConsentChecks
              value={consents}
              onChange={(next) => setConsents(next)}
              registration
              invalid={consentAttempted && !consentComplete}
              errorId={`${id}-consents-error`}
            />
          </div>
          <p className="auth-form__hint auth-form__politika">
            {REGISTER_FORM.politika.before}{' '}
            <a href={legalDocs.politika.href} target="_blank" rel="noopener noreferrer">
              {REGISTER_FORM.politika.link}
            </a>
          </p>
          <div className="register-remaining" aria-live="polite">
            <p>{consentComplete ? REGISTER_FORM.ready : REGISTER_FORM.remaining}</p>
            <button
              type="button"
              className={password.length >= PASSWORD_MIN ? 'is-done' : ''}
              onClick={() => setStep(2)}
            >
              {password.length >= PASSWORD_MIN ? '✓' : '○'} {REGISTER_FORM.password}
            </button>
            <span className={consentComplete ? 'is-done' : ''}>
              {consentComplete ? '✓' : '○'} {REGISTER_FORM.steps.consents}
            </span>
          </div>
          {error !== null ? (
            <div className="register-submit-error" role="alert">
              <FieldMessage tone="error">{error}</FieldMessage>
              {error === AUTH_ERRORS.network ? (
                <Button
                  type="button"
                  variant="secondary"
                  loading={busy}
                  onClick={() => formRef.current?.requestSubmit()}
                >
                  {REGISTER_FORM.retry}
                </Button>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" size="lg" fullWidth loading={busy}>
            {busy ? REGISTER_FORM.creating : REGISTER_FORM.submit}
          </Button>
          {!consentAttempted && !consentComplete ? (
            <FieldMessage>{REGISTER_FORM.consentsHint}</FieldMessage>
          ) : null}
          <p className="auth-form__switch">
            {REGISTER_FORM.haveAccount}{' '}
            <button type="button" className="auth-form__link" onClick={() => onLogin(cleanEmail)}>
              {REGISTER_FORM.toLogin}
            </button>
          </p>
        </section>
      ) : null}

      {step > 0 && step < consentStep ? (
        <div className="register-actions">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={busy}
            onClick={() => {
              setError(null);
              setStep((current) => Math.max(0, current - 1));
            }}
          >
            {REGISTER_FORM.steps.back}
          </Button>
          <Button type="submit" size="lg" fullWidth disabled={busy}>
            {REGISTER_FORM.steps.next}
          </Button>
        </div>
      ) : null}
      {step === 0 ? (
        <p className="auth-form__switch">
          {REGISTER_FORM.haveAccount}{' '}
          <button type="button" className="auth-form__link" onClick={() => onLogin(email)}>
            {REGISTER_FORM.toLogin}
          </button>
        </p>
      ) : null}
      {step > 0 ? (
        <p className="auth-form__hint">
          <button type="button" className="auth-form__link" onClick={() => setStep(0)}>
            {REGISTER_FORM.steps.back} · {REGISTER_FORM.steps.role}
          </button>
        </p>
      ) : null}
    </form>
  );
}
