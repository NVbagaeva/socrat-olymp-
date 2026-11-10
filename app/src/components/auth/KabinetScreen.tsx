'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Button,
  Card,
  EmptyState,
  FieldLabel,
  FieldMessage,
  Input,
  Modal,
  SuccessState,
  Tabs,
} from '@/components/ui';
import { KABINET, dateRu, editionRu } from '@/content/auth';
import { legalDocs } from '@/content/legal/documents';
import { AUTH_HREF } from '@/lib/auth/config';
import { AUTH_ERRORS, describeAuthError } from '@/lib/auth/errors';
import type { SavedKit } from '@/lib/auth/kits';
import type { KlassView } from '@/lib/auth/klassy';
import type { AccountConsents, AccountRole, Profile } from '@/lib/auth/profile';
import { currentUser, useSessionUser } from '@/lib/auth/session';
import {
  importedGroups,
  localProgress,
  shouldAskImport,
  type ImportedKey,
  type LocalGroup,
} from '@/lib/progressImport';

type View = 'loading' | 'needLogin' | 'ready' | 'removed';
type Tab = 'home' | 'profile';

/** Вкладка в адресе: /kabinet/?vkladka=profil. */
const PROFILE_QUERY = 'profil';

const TRAINER_8 = '/zadaniya/8/trenazher/';

/**
 * Страница /kabinet/ — одна на все роли: содержимое зависит от роли в
 * базе. Вкладка «Кабинет» — разделы ученика или репетитора (пока с
 * понятными пустыми состояниями), вкладка «Профиль» — имя, что
 * сохранено, документы, выход и удаление аккаунта. Показывает только
 * то, что действительно лежит в базе.
 */
export function KabinetScreen() {
  const user = useSessionUser();
  const [view, setView] = useState<View>('loading');
  const [tab, setTab] = useState<Tab>('home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [kits, setKits] = useState<SavedKit[] | null>(null);
  const [klassy, setKlassy] = useState<KlassView[] | null>(null);
  const [consents, setConsents] = useState<AccountConsents | null>(null);
  const [imported, setImported] = useState<ImportedKey[]>([]);
  const [ask, setAsk] = useState<LocalGroup[] | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  /* Отложенный прогресс гостя (ответ «Нет»): его можно перенести позже. */
  const [stash, setStash] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      /* Хранилище пустое — SDK грузить незачем: сразу приглашение войти. */
      if (currentUser() === null) {
        setView('needLogin');
        return;
      }
      const [{ getClient }, { loadProfile, loadConsents, syncOnboarding }] = await Promise.all([
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
      /* Вкладка из адреса: /kabinet/?vkladka=profil. */
      if (new URLSearchParams(window.location.search).get('vkladka') === PROFILE_QUERY) {
        setTab('profile');
      }
      setView('ready');

      const [{ loadImportedKeys }, { loadKlassy }, { hasStash }] = await Promise.all([
        import('@/lib/progressImport'),
        import('@/lib/auth/klassy'),
        import('@/lib/accountSync'),
      ]);
      const [given, keys, classes] = await Promise.all([
        loadConsents(),
        loadImportedKeys(),
        synced.role === 'admin' ? Promise.resolve([]) : loadKlassy(),
      ]);
      if (cancelled) return;
      setConsents(given);
      setImported(keys);
      setKlassy(classes);
      /* Вопрос о переносе — один раз на аккаунт в этом браузере. Ученику
         младше 18 до согласия родителя его не задаём: база такой перенос
         всё равно не примет. */
      const parentPending = given.parent !== null && given.parent.confirmedAt === null;
      if (!parentPending && shouldAskImport(synced.id)) setAsk(localProgress());
      setStash(!parentPending && hasStash());

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

  const openTab = (next: Tab) => {
    setTab(next);
    const query = next === 'profile' ? `?vkladka=${PROFILE_QUERY}` : '';
    window.history.replaceState(null, '', `${window.location.pathname}${query}`);
  };

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

  const parent = consents?.parent ?? null;
  const parentPending = parent !== null && parent.confirmedAt === null;

  /* «Перенести с этого устройства»: отложенный при «Нет» прогресс гостя. */
  const importLater = async () => {
    const { importStash } = await import('@/lib/accountSync');
    const { loadImportedKeys } = await import('@/lib/progressImport');
    const result = await importStash();
    setStash(false);
    setImported(await loadImportedKeys());
    setImportNote(KABINET.importAsk.done(result.pushed.length));
  };

  return (
    <div className="kabinet" data-role={profile.role}>
      <header className="kabinet__head">
        <h1 className="auth-card__title">{KABINET.title}</h1>
        <p className="kabinet__who">
          <span className="kabinet__role">{KABINET.roleLine[profile.role]}</span>
          {profile.name !== '' ? <span className="kabinet__name">{profile.name}</span> : null}
        </p>
      </header>
      <Tabs
        className="kabinet__tabs"
        label={KABINET.tabsLabel}
        value={tab}
        onValueChange={(id) => openTab(id as Tab)}
        items={[
          { id: 'home', label: KABINET.tabs.home },
          { id: 'profile', label: KABINET.tabs.profile },
        ]}
      />
      {parentPending ? (
        <div className="kabinet__notice" role="status">
          <strong>{KABINET.parentPending.title}</strong>
          <span>{KABINET.parentPending.text(parent.email)}</span>
        </div>
      ) : null}
      {importNote !== null ? (
        <p className="kabinet__notice kabinet__notice--ok" role="status">
          {importNote}
        </p>
      ) : null}

      {tab === 'home' ? (
        <>
          <p className="kabinet__trial">{KABINET.trial}</p>
          {profile.role === 'student' ? <StudentHome klassy={klassy} /> : null}
          {profile.role === 'tutor' ? <TutorHome klassy={klassy} kits={kits} /> : null}
          {profile.role === 'admin' ? (
            <Card className="kabinet__card" title={KABINET.admin.title}>
              <p className="auth-form__text">{KABINET.admin.text}</p>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <ProfileCard profile={profile} email={email} onSaved={setProfile} />
          <SavedCard
            profile={profile}
            imported={imported}
            canImport={stash}
            onImport={() => void importLater()}
          />
          <DocumentsCard consents={consents} />
          <DangerCard role={profile.role} onRemoved={() => setView('removed')} />
        </>
      )}

      <ImportModal
        groups={ask}
        userId={profile.id}
        onClose={() => setAsk(null)}
        onDone={(count, keys) => {
          setImported(keys);
          setImportNote(KABINET.importAsk.done(count));
          setAsk(null);
        }}
      />
    </div>
  );
}

/* ── Пустое состояние раздела ─────────────────────────────────── */

/** Раздел, которого ещё нет: что здесь появится — простыми словами. */
function Stub({
  title,
  empty,
  text,
  action,
  section,
}: {
  title: string;
  empty: string;
  text: string;
  action?: ReactNode;
  /** Имя раздела для проверок и стилей. */
  section: string;
}) {
  return (
    <Card className="kabinet__card kabinet-stub" title={title} data-section={section}>
      <p className="kabinet-stub__empty">{empty}</p>
      <p className="auth-form__text">{text}</p>
      {action}
    </Card>
  );
}

/* ── Кабинет ученика ──────────────────────────────────────────── */

function StudentHome({ klassy }: { klassy: KlassView[] | null }) {
  const t = KABINET.student;
  return (
    <>
      <div className="kabinet__grid">
        <Stub
          section="progress"
          title={t.progress.title}
          empty={t.progress.empty}
          text={t.progress.text}
          action={
            <Link className="btn btn--secondary btn--sm" href={TRAINER_8}>
              {t.progress.go}
            </Link>
          }
        />
        <Stub
          section="mistakes"
          title={t.mistakes.title}
          empty={t.mistakes.empty}
          text={t.mistakes.text}
        />
        <Stub section="later" title={t.later.title} empty={t.later.empty} text={t.later.text} />
        <Stub
          section="homework"
          title={t.homework.title}
          empty={t.homework.empty}
          text={t.homework.text}
        />
      </div>
      <Card className="kabinet__card" title={t.classes.title} data-section="classes">
        {klassy === null ? (
          <p className="auth-form__muted">…</p>
        ) : klassy.length === 0 ? (
          <p className="auth-form__text">{t.classes.none}</p>
        ) : (
          <ul className="klass-list">
            {klassy.map((klass) => (
              <li key={klass.id} className="klass-list__item">
                <span className="klass-list__name">{klass.name}</span>
                {klass.tutorName !== null ? (
                  <span className="klass-list__meta">{t.classes.tutor(klass.tutorName)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ── Кабинет репетитора ───────────────────────────────────────── */

function TutorHome({ klassy, kits }: { klassy: KlassView[] | null; kits: SavedKit[] | null }) {
  const t = KABINET.tutor;
  return (
    <>
      <div className="kabinet__grid">
        {klassy !== null && klassy.length > 0 ? (
          <Card className="kabinet__card" title={t.classes.title} data-section="classes">
            <ul className="klass-list">
              {klassy.map((klass) => (
                <li key={klass.id} className="klass-list__item">
                  <span className="klass-list__name">{klass.name}</span>
                  <span className="klass-list__meta">
                    {t.classes.students(klass.students.length)}
                  </span>
                  {klass.students.length > 0 ? (
                    <ul className="klass-list__students">
                      {klass.students.map((name, index) => (
                        <li key={`${index}-${name}`}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="klass-list__meta">{t.classes.noStudents}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="auth-form__text">{t.classes.text}</p>
          </Card>
        ) : (
          <Stub
            section="classes"
            title={t.classes.title}
            empty={klassy === null ? '…' : t.classes.empty}
            text={t.classes.text}
          />
        )}
        <Stub
          section="homework"
          title={t.homework.title}
          empty={t.homework.empty}
          text={t.homework.text}
        />
      </div>
      <Card className="kabinet__card" title={t.kits.title} data-section="kits">
        {kits === null ? (
          <p className="auth-form__muted">…</p>
        ) : kits.length === 0 ? (
          <p className="auth-form__text">{t.kits.none}</p>
        ) : (
          <ul className="kit-list">
            {kits.map((kit) => (
              <li key={kit.code} className="kit-list__item">
                <span className="kit-list__code">{kit.code}</span>
                <span className="kit-list__section">{kit.section}</span>
                <span className="kit-list__date">
                  {t.kits.from} {dateRu(kit.createdAt)}
                </span>
                <span className="kit-list__links">
                  <a href={kit.studentHref} target="_blank" rel="noreferrer">
                    {t.kits.sheetStudent}
                  </a>
                  <a href={kit.teacherHref} target="_blank" rel="noreferrer">
                    {t.kits.sheetTeacher}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ── Перенос прогресса с устройства ───────────────────────────── */

function ImportModal({
  groups,
  userId,
  onClose,
  onDone,
}: {
  groups: LocalGroup[] | null;
  userId: string;
  onClose: () => void;
  onDone: (count: number, keys: ImportedKey[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = KABINET.importAsk;

  const refuse = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { refuseImport } = await import('@/lib/accountSync');
      refuseImport(userId);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const accept = async () => {
    if (busy || groups === null) return;
    setBusy(true);
    setError(null);
    try {
      const [{ acceptImport }, { loadImportedKeys }] = await Promise.all([
        import('@/lib/accountSync'),
        import('@/lib/progressImport'),
      ]);
      const result = await acceptImport(userId);
      if (result.readOnly) throw new Error('read only');
      onDone(result.pushed.length, await loadImportedKeys());
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={groups !== null}
      onClose={() => void refuse()}
      title={t.title}
      description={t.text}
      footer={
        <>
          <Button variant="secondary" onClick={() => void refuse()} disabled={busy}>
            {t.no}
          </Button>
          <Button onClick={accept} loading={busy}>
            {t.yes}
          </Button>
        </>
      }
    >
      <ul className="import-list">
        {(groups ?? []).map((item) => (
          <li key={item.group.id}>{item.group.title}</li>
        ))}
      </ul>
      <p className="auth-form__hint">{t.note}</p>
      {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
    </Modal>
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (name.trim() === '') {
      setError(KABINET.profile.nameRequired);
      return;
    }
    setBusy(true);
    try {
      const { updateProfile } = await import('@/lib/auth/profile');
      const next = await updateProfile({ name });
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
      data-section="profile"
      action={
        editing ? null : (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setName(profile.name);
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
            <dd>
              <span data-field="role">{KABINET.roleName[profile.role]}</span>
              <span className="kabinet__hint">{KABINET.profile.roleHint}</span>
            </dd>
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

function SavedCard({
  profile,
  imported,
  canImport,
  onImport,
}: {
  profile: Profile;
  imported: ImportedKey[];
  canImport: boolean;
  onImport: () => void;
}) {
  const t = KABINET.saved;
  const tourName = profile.tourId === null ? null : (t.tourNames[profile.tourId] ?? profile.tourId);
  const groups = importedGroups(imported);
  return (
    <Card className="kabinet__card" title={t.title} data-section="saved">
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
        <div>
          <dt>{t.imported}</dt>
          <dd data-field="imported">
            {groups.length === 0
              ? t.importedNone
              : groups.map((group) => (
                  <span key={group.title} className="kabinet__line">
                    {t.importedItem(group.title, dateRu(group.at))}
                  </span>
                ))}
            {canImport ? (
              <button type="button" className="auth-form__link kabinet__line" onClick={onImport}>
                {t.importAgain}
              </button>
            ) : null}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

/* ── Документы и данные ───────────────────────────────────────── */

function DocumentsCard({ consents }: { consents: AccountConsents | null }) {
  const t = KABINET.documents;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { exportMyData } = await import('@/lib/auth/profile');
      const data = await exportMyData();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = t.exportFile;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t.exportFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="kabinet__card" title={t.title} data-section="documents">
      <ul className="kabinet__docs">
        {Object.values(legalDocs).map((doc) => (
          <li key={doc.id}>
            <a href={doc.href} target="_blank" rel="noopener">
              {doc.title}
            </a>
          </li>
        ))}
      </ul>
      {consents !== null ? (
        <p className="auth-form__text" data-field="consent">
          {consents.version !== null && consents.acceptedAt !== null
            ? t.accepted(editionRu(consents.version), dateRu(consents.acceptedAt))
            : t.acceptedUnknown}
        </p>
      ) : null}
      <div className="auth-form__actions">
        <Button variant="secondary" onClick={download} loading={busy}>
          {t.export}
        </Button>
      </div>
      <p className="auth-form__hint">{t.exportHint}</p>
      {error !== null ? <FieldMessage tone="error">{error}</FieldMessage> : null}
    </Card>
  );
}

/* ── Выход и удаление ─────────────────────────────────────────── */

function DangerCard({ role, onRemoved }: { role: AccountRole; onRemoved: () => void }) {
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
    <Card className="kabinet__card" title={t.title} data-section="account">
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
