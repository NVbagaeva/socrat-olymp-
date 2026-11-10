'use client';

/**
 * Страница класса /kabinet/klassy/?id=…: код и ссылка-приглашение,
 * приём по коду, ученики (переименовать для себя, убрать из класса),
 * переименовать и удалить класс. Видит только владелец класса.
 */

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  FieldLabel,
  FieldMessage,
  Input,
} from '@/components/ui';
import { DZ, dzError } from '@/content/dz';
import type { ClassMember, TutorClass } from '@/lib/dz/api';
import { memberNameOf } from '@/lib/dz/names';
import { DZ_HREF, inviteUrl } from '@/lib/dz/links';
import { Confirm, NeedLogin, dzApi, errorCode, queryParam, useUser } from './common';
import './dz.css';

const t = DZ.klass;

export function ClassScreen() {
  const user = useUser();
  const [klass, setKlass] = useState<TutorClass | null | undefined>(undefined);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState<
    null | { kind: 'rotate' } | { kind: 'archive' } | { kind: 'remove'; member: ClassMember }
  >(null);

  const load = useCallback(async () => {
    const id = queryParam('id');
    try {
      const list = await (await dzApi()).loadTutorClasses();
      setKlass(list.find((k) => k.id === id) ?? null);
    } catch {
      setKlass(null);
    }
  }, []);

  useEffect(() => {
    if (user === null || user.role !== 'tutor') return;
    let alive = true;
    void (async () => {
      const id = queryParam('id');
      const list = await (await dzApi()).loadTutorClasses().catch(() => []);
      if (alive) setKlass(list.find((k) => k.id === id) ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  async function act(run: () => Promise<unknown>, done?: string) {
    setError(null);
    setNote(null);
    try {
      await run();
      if (done !== undefined) setNote(done);
      await load();
    } catch (e) {
      setError(dzError(errorCode(e)));
    }
  }

  if (user === null) return <NeedLogin text="Войдите в кабинет репетитора." />;
  if (user.role !== 'tutor') {
    return (
      <EmptyState
        title="Эта страница — для репетитора."
        description="Ученик видит свой класс в кабинете."
      />
    );
  }
  if (klass === undefined) return <p className="auth-form__muted">…</p>;
  if (klass === null) {
    return (
      <EmptyState
        title={t.notFound}
        description="Возможно, класс удалён. Список классов — в кабинете."
        action={
          <Link className="btn btn--secondary" href={DZ_HREF.kabinet}>
            {t.back}
          </Link>
        }
      />
    );
  }

  const link = inviteUrl(klass.joinCode);

  return (
    <div className="dz-page" data-page="klass">
      <Link className="dz-back" href={DZ_HREF.kabinet}>
        {t.back}
      </Link>
      <ClassName
        klass={klass}
        onSave={(name) => act(async () => (await dzApi()).renameClass(klass.id, name))}
      />

      <Card className="kabinet__card" title={t.codeTitle} data-section="code">
        <p className="auth-form__text">{t.codeText}</p>
        <p className="dz-code" data-code={klass.joinCode}>
          {klass.joinCode}
        </p>
        <p className="dz-link">{link}</p>
        <div className="dz-actions">
          <Button
            variant="secondary"
            onClick={() =>
              void act(async () => {
                await navigator.clipboard?.writeText(link);
              }, t.copied)
            }
          >
            {t.copyLink}
          </Button>
          <Button variant="ghost" onClick={() => setAsk({ kind: 'rotate' })}>
            {t.rotate}
          </Button>
        </div>
        <Checkbox
          checked={klass.joinOpen}
          onChange={(e) =>
            void act(async () => (await dzApi()).setJoinOpen(klass.id, e.target.checked))
          }
        >
          {t.joinOpen}
        </Checkbox>
        {klass.joinOpen ? null : <p className="auth-form__muted">{t.joinClosed}</p>}
      </Card>

      <Card className="kabinet__card" title={t.members} data-section="members">
        {klass.members.length === 0 ? (
          <p className="auth-form__text">{t.noMembers}</p>
        ) : (
          <ul className="dz-members">
            {klass.members.map((member) => (
              <Member
                key={member.userId}
                member={member}
                onAlias={(alias) => act(async () => (await dzApi()).setAlias(member.userId, alias))}
                onRemove={() => setAsk({ kind: 'remove', member })}
              />
            ))}
          </ul>
        )}
      </Card>

      {note === null ? null : (
        <p className="dz-ok" role="status">
          {note}
        </p>
      )}
      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}

      <div className="dz-actions dz-actions--end">
        <Button variant="danger" onClick={() => setAsk({ kind: 'archive' })}>
          {t.archive}
        </Button>
      </div>

      <Confirm
        open={ask?.kind === 'rotate'}
        title={t.rotate}
        text={t.rotateConfirm}
        action={t.rotate}
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          setAsk(null);
          void act(async () => (await dzApi()).rotateCode(klass.id));
        }}
      />
      <Confirm
        open={ask?.kind === 'remove'}
        title={t.remove}
        text={ask?.kind === 'remove' ? t.removeConfirm(memberNameOf(ask.member)) : ''}
        action={t.remove}
        danger
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          const member = ask?.kind === 'remove' ? ask.member : null;
          setAsk(null);
          if (member !== null)
            void act(async () => (await dzApi()).removeMember(klass.id, member.userId));
        }}
      />
      <Confirm
        open={ask?.kind === 'archive'}
        title={t.archive}
        text={t.archiveConfirm}
        action={t.archive}
        danger
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          setAsk(null);
          void (async () => {
            try {
              await (await dzApi()).archiveClass(klass.id);
              window.location.assign(DZ_HREF.kabinet);
            } catch (e) {
              setError(dzError(errorCode(e)));
            }
          })();
        }}
      />
    </div>
  );
}

function ClassName({
  klass,
  onSave,
}: {
  klass: TutorClass;
  onSave: (name: string) => Promise<void>;
}) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(klass.name);
  const id = useId();
  if (!edit) {
    return (
      <header className="dz-head">
        <h1 className="dz-head__title">{klass.name}</h1>
        <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>
          {t.rename}
        </Button>
      </header>
    );
  }
  return (
    <form
      className="dz-inline-form"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') return;
        void onSave(name).then(() => setEdit(false));
      }}
    >
      <FieldLabel htmlFor={id}>{DZ.classes.nameLabel}</FieldLabel>
      <div className="dz-inline-form__row">
        <Input id={id} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">{t.save}</Button>
        <Button variant="ghost" onClick={() => setEdit(false)}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}

function Member({
  member,
  onAlias,
  onRemove,
}: {
  member: ClassMember;
  onAlias: (alias: string) => Promise<void>;
  onRemove: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [alias, setAlias] = useState(member.alias ?? '');
  const id = useId();
  return (
    <li className="dz-members__item" data-member={member.userId}>
      {edit ? (
        <form
          className="dz-inline-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void onAlias(alias).then(() => setEdit(false));
          }}
        >
          <FieldLabel htmlFor={id}>{t.alias}</FieldLabel>
          <div className="dz-inline-form__row">
            <Input
              id={id}
              value={alias}
              maxLength={60}
              placeholder={member.name}
              onChange={(e) => setAlias(e.target.value)}
            />
            <Button type="submit">{t.save}</Button>
            <Button variant="ghost" onClick={() => setEdit(false)}>
              {t.cancel}
            </Button>
          </div>
          <p className="auth-form__muted">{t.aliasHint}</p>
        </form>
      ) : (
        <>
          <span className="dz-members__name">{memberNameOf(member)}</span>
          {member.alias === null ? null : <span className="dz-members__real">{member.name}</span>}
          <span className="dz-members__actions">
            <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>
              {t.renameStudent}
            </Button>
            <Button size="sm" variant="ghost" onClick={onRemove}>
              {t.remove}
            </Button>
          </span>
        </>
      )}
    </li>
  );
}
