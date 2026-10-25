'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  FieldLabel,
  FieldMessage,
  Input,
  Modal,
  SuccessState,
} from '@/components/ui';
import { KABINET, dateRu } from '@/content/auth';
import { AUTH_HREF } from '@/lib/auth/config';
import { AUTH_ERRORS, describeAuthError } from '@/lib/auth/errors';
import type { SavedKit } from '@/lib/auth/kits';
import type { Profile } from '@/lib/auth/profile';
import { currentUser, useSessionUser, type UserRole } from '@/lib/auth/session';
import { RoleCards } from './RoleCards';

type View = 'loading' | 'needLogin' | 'ready' | 'removed';

/**
 * Страница /kabinet/: профиль, что сохранено в аккаунте, выход и
 * удаление. Показывает только то, что действительно лежит в базе.
 */
export function KabinetScreen() {
  const user = useSessionUser();
  const [view, setView] = useState<View>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [kits, setKits] = useState<SavedKit[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      /* Хранилище пустое — SDK грузить незачем: сразу приглашение войти. */
      if (currentUser() === null) {
        setView('needLogin');
        return;
      }
      const [{ getClient }, { loadProfile, syncOnboarding }] = await Promise.all([
        import('@/lib/auth/client'),
        import('@/lib/auth/profile'),
      ]);
      const supabase = await getClient();
      const {
        data: { user: me },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (me === null) {
        setView('needLogin');
        return;
      }
      setEmail(me.email ?? '');
      const loaded = await loadProfile();
      if (cancelled || loaded === null) {
        if (!cancelled) setView('needLogin');
        return;
      }
      const synced = await syncOnboarding(loaded);
      if (cancelled) return;
      setProfile(synced);
      setView('ready');
      if (synced.role === 'tutor') {
        const { loadKits } = await import('@/lib/auth/kits');
        const list = await loadKits();
        if (!cancelled) setKits(list);
      }
    })().catch((failure: unknown) => {
      if (cancelled) return;
      setLoadError(describeAuthError(failure as { message?: string }));
      setView('ready');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Вышли в другой вкладке — кабинет закрывается. */
  const shown: View = view === 'ready' && user === null ? 'needLogin' : view;

  if (shown === 'loading') {
    return (
      <p className="auth-busy" role="status">
        {KABINET.loading}
      </p>
    );
  }
  if (shown === 'needLogin') {
    return (
      <EmptyState
        title={KABINET.needLogin.title}
        description={KABINET.needLogin.text}
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
            {KABINET.needLogin.go}
          </Link>
        }
      />
    );
  }
  if (shown === 'removed') {
    return (
      <SuccessState
        title={KABINET.danger.removed.title}
        description={KABINET.danger.removed.text}
        action={
          <Link className="btn btn--primary" href="/">
            {KABINET.danger.removed.go}
          </Link>
        }
      />
    );
  }
  if (profile === null) {
    return <EmptyState title={KABINET.title} description={loadError ?? AUTH_ERRORS.unknown} />;
  }

  return (
    <div className="kabinet">
      <h1 className="auth-card__title">{KABINET.title}</h1>
      <ProfileCard profile={profile} email={email} onSaved={setProfile} />
      <SavedCard profile={profile} kits={kits} />
      <DangerCard role={profile.role} onRemoved={() => setView('removed')} />
    </div>
  );
}

/* ── Профиль ──────────────────────────────────────────────────── */

function ProfileCard({
  profile,
  email,
  onSaved,
}: {
  profile: Profile;
  email: string;
  onSaved: (profile: Profile) => void;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState<UserRole>(profile.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const { updateProfile } = await import('@/lib/auth/profile');
      const next = await updateProfile({ name, role });
      onSaved(next);
      setEditing(false);
      setSaved(true);
    } catch (failure) {
      setError(describeAuthError(failure as { message?: string; code?: string }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      className="kabinet__card"
      title={KABINET.profile.title}
      action={
        editing ? null : (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setName(profile.name);
              setRole(profile.role);
              setSaved(false);
              setEditing(true);
            }}
          >
            {KABINET.profile.edit}
          </button>
        )
      }
    >
      {editing ? (
        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="field">
            <FieldLabel htmlFor={`${id}-name`}>{KABINET.profile.name}</FieldLabel>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              autoComplete="name"
              disabled={busy}
            />
          </div>
          <fieldset className="auth-form__roles">
            <legend className="field__label">{KABINET.profile.role}</legend>
            <RoleCards
              value={role}
              onChange={setRole}
              label={KABINET.profile.role}
              disabled={busy}
            />
          </fieldset>
          {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
          <div className="auth-form__actions">
            <Button type="submit" loading={busy}>
              {KABINET.profile.save}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>
              {KABINET.profile.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <dl className="kabinet__facts">
          <div>
            <dt>{KABINET.profile.name}</dt>
            <dd data-field="name">{profile.name !== '' ? profile.name : '—'}</dd>
          </div>
          <div>
            <dt>{KABINET.profile.email}</dt>
            <dd data-field="email">{email}</dd>
          </div>
          <div>
            <dt>{KABINET.profile.role}</dt>
            <dd data-field="role">{KABINET.roleName[profile.role]}</dd>
          </div>
          {saved ? (
            <div>
              <dt />
              <dd className="auth-form__ok" role="status">
                {KABINET.profile.saved}
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </Card>
  );
}

/* ── Что сохранено ────────────────────────────────────────────── */

function SavedCard({ profile, kits }: { profile: Profile; kits: SavedKit[] | null }) {
  const t = KABINET.saved;
  const tourName = profile.tourId === null ? null : (t.tourNames[profile.tourId] ?? profile.tourId);
  return (
    <Card className="kabinet__card" title={t.title}>
      <p className="auth-form__text">{t.intro[profile.role]}</p>
      <dl className="kabinet__facts">
        <div>
          <dt>{t.welcome}</dt>
          <dd>
            {profile.welcomeSeenAt !== null
              ? t.welcomeSeen(dateRu(profile.welcomeSeenAt))
              : t.welcomeNot}
          </dd>
        </div>
        <div>
          <dt>{t.tour}</dt>
          <dd>
            {tourName === null
              ? t.tourNone
              : profile.tourDone
                ? t.tourDone(tourName)
                : t.tourStarted(tourName)}
          </dd>
        </div>
      </dl>
      {profile.role === 'tutor' ? (
        <div className="kabinet__kits">
          <h3 className="kabinet__subtitle">{t.kits}</h3>
          {kits === null ? (
            <p className="auth-form__muted">…</p>
          ) : kits.length === 0 ? (
            <p className="auth-form__text">{t.kitsNone}</p>
          ) : (
            <ul className="kit-list">
              {kits.map((kit) => (
                <li key={kit.code} className="kit-list__item">
                  <span className="kit-list__code">{kit.code}</span>
                  <span className="kit-list__section">{kit.section}</span>
                  <span className="kit-list__date">
                    {t.kitsFrom} {dateRu(kit.createdAt)}
                  </span>
                  <span className="kit-list__links">
                    <a href={kit.studentHref} target="_blank" rel="noreferrer">
                      {t.sheetStudent}
                    </a>
                    <a href={kit.teacherHref} target="_blank" rel="noreferrer">
                      {t.sheetTeacher}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Card>
  );
}

/* ── Выход и удаление ─────────────────────────────────────────── */

function DangerCard({ role, onRemoved }: { role: UserRole; onRemoved: () => void }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = KABINET.danger;

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { signOut } = await import('@/lib/auth/client');
      await signOut();
      router.push('/');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { deleteAccount } = await import('@/lib/auth/profile');
      await deleteAccount();
      setConfirm(false);
      onRemoved();
    } catch (failure) {
      setError(describeAuthError(failure as { message?: string; code?: string }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="kabinet__card" title={t.title}>
      <div className="auth-form__actions">
        <Button variant="secondary" onClick={logout} loading={busy && !confirm}>
          {t.logout}
        </Button>
        <Button variant="danger" onClick={() => setConfirm(true)} disabled={busy}>
          {t.remove}
        </Button>
      </div>
      <Modal
        open={confirm}
        onClose={() => (busy ? undefined : setConfirm(false))}
        title={t.confirmTitle}
        description={t.confirmText[role]}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} disabled={busy}>
              {t.cancel}
            </Button>
            <Button variant="danger" onClick={remove} loading={busy}>
              {t.confirm}
            </Button>
          </>
        }
      >
        {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
      </Modal>
    </Card>
  );
}
