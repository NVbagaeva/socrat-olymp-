'use client';

import { useId, useState } from 'react';
import { Button, FieldLabel, FieldMessage, Input, Radio } from '@/components/ui';
import { registrationText } from '@/content/legal/account';
import type { AccountSnapshot } from '@/lib/account/api';
import {
  checkRegistration,
  type RegistrationForm as Form,
  type Role,
} from '@/lib/account/consents';
import { documentsVersion } from '@/lib/legal/operator';
import { ConsentChecks } from './ConsentChecks';

const EMPTY: Form = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  birthYear: '',
  parentEmail: '',
  acceptSoglashenie: false,
  acceptSoglasie: false,
};

/**
 * Регистрация: роль, имя, почта, пароль; ученику — год рождения и,
 * если ему меньше 18, почта родителя; две галочки. Кнопка неактивна,
 * пока форма не заполнена и обе галочки не стоят. Ошибки полей
 * показываются после первого ухода из поля, чтобы не ругать сразу.
 */
export function RegistrationForm<T = AccountSnapshot>({
  api,
  onRegistered,
  fixedRole,
  submitLabel,
}: {
  api: { register(form: Form, version: string): Promise<T> };
  onRegistered: (account: T) => void;
  /** Роль задана заранее (приглашение в кабинет) — выбора «Кто вы» нет. */
  fixedRole?: Role;
  submitLabel?: string;
}) {
  const t = registrationText;
  const id = useId();
  const [form, setForm] = useState<Form>(() =>
    fixedRole === undefined ? EMPTY : { ...EMPTY, role: fixedRole },
  );
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const check = checkRegistration(form);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const touch = (key: keyof Form) => () => setTouched((x) => ({ ...x, [key]: true }));
  const error = (key: keyof Form) => (touched[key] ? check.errors[key] : undefined);

  const field = (
    key: 'name' | 'email' | 'password' | 'birthYear' | 'parentEmail',
    label: string,
    props: object,
    hint?: string,
  ) => {
    const msg = error(key);
    return (
      <div className="field">
        <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
        <Input
          id={`${id}-${key}`}
          name={key}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          onBlur={touch(key)}
          state={msg ? 'error' : 'default'}
          {...props}
        />
        {msg ? (
          <FieldMessage tone="error">{msg}</FieldMessage>
        ) : hint ? (
          <FieldMessage>{hint}</FieldMessage>
        ) : null}
      </div>
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!check.canSubmit || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      onRegistered(await api.register(form, documentsVersion));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="reg-form" onSubmit={submit} noValidate>
      {fixedRole === undefined ? (
        <fieldset className="reg-form__roles">
          <legend className="field__label">{t.role}</legend>
          {(['student', 'tutor'] as Role[]).map((role) => (
            <Radio
              key={role}
              name="role"
              checked={form.role === role}
              onChange={() => set('role', role)}
            >
              {t.roles[role]}
            </Radio>
          ))}
        </fieldset>
      ) : null}

      {field('name', t.name, { autoComplete: 'given-name' })}
      {field('email', t.email, { type: 'email', autoComplete: 'email' })}
      {field(
        'password',
        t.password,
        { type: 'password', autoComplete: 'new-password' },
        t.passwordHint,
      )}
      {form.role === 'student'
        ? field(
            'birthYear',
            t.birthYear,
            { inputMode: 'numeric', maxLength: 4, placeholder: '2009' },
            t.birthYearHint,
          )
        : null}
      {form.role === 'student' && check.needsParent
        ? field(
            'parentEmail',
            t.parentEmail,
            { type: 'email', autoComplete: 'off' },
            t.parentEmailHint,
          )
        : null}

      <ConsentChecks
        value={{ soglashenie: form.acceptSoglashenie, soglasie: form.acceptSoglasie }}
        onChange={(v) =>
          setForm((f) => ({ ...f, acceptSoglashenie: v.soglashenie, acceptSoglasie: v.soglasie }))
        }
      />

      <Button type="submit" size="lg" fullWidth disabled={!check.canSubmit} loading={busy}>
        {submitLabel ?? t.submit}
      </Button>
      {!form.acceptSoglashenie || !form.acceptSoglasie ? (
        <FieldMessage className="reg-form__hint">{t.submitHint}</FieldMessage>
      ) : null}
      {failed ? <FieldMessage tone="error">{t.failed}</FieldMessage> : null}
    </form>
  );
}
