'use client';

import { useState } from 'react';
import { Button, Card, FieldMessage } from '@/components/ui';
import { KABINET } from '@/content/auth';
import { AVATAR_OPTIONS, DEFAULT_AVATAR, randomAvatar, type AvatarConfig } from '@/lib/avatar';
import type { Profile } from '@/lib/auth/profile';
import { AvatarIllustration } from './AvatarIllustration';
import './avatar.css';

type Part = keyof AvatarConfig;
type Option = { id: string; label: string; color?: string };

const GROUPS: { part: Part; title: string; options: readonly Option[]; swatches: boolean }[] = [
  { part: 'skin', title: KABINET.avatar.groups.skin, options: AVATAR_OPTIONS.skin, swatches: true },
  { part: 'hair', title: KABINET.avatar.groups.hair, options: AVATAR_OPTIONS.hair, swatches: false },
  {
    part: 'hairColor',
    title: KABINET.avatar.groups.hairColor,
    options: AVATAR_OPTIONS.hairColor,
    swatches: true,
  },
  {
    part: 'accessory',
    title: KABINET.avatar.groups.accessory,
    options: AVATAR_OPTIONS.accessory,
    swatches: false,
  },
  {
    part: 'outfit',
    title: KABINET.avatar.groups.outfit,
    options: AVATAR_OPTIONS.outfit,
    swatches: true,
  },
  {
    part: 'background',
    title: KABINET.avatar.groups.background,
    options: AVATAR_OPTIONS.background,
    swatches: true,
  },
];

export function AvatarStudio({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState<AvatarConfig>(profile.avatarConfig ?? DEFAULT_AVATAR);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const text = KABINET.avatar;

  const choose = (part: Part, value: string) => {
    setDraft((current) => ({ ...current, [part]: value }));
    setSaved(false);
    setError(null);
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const { updateAvatarConfig } = await import('@/lib/auth/profile');
      onSaved(await updateAvatarConfig(draft));
      setSaved(true);
    } catch {
      setError('Не получилось сохранить аватар. Проверьте интернет и попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      className="kabinet__card avatar-studio"
      title={text.title[profile.role]}
      data-section="avatar"
      action={
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setDraft(randomAvatar());
            setSaved(false);
            setError(null);
          }}
        >
          {text.random}
        </Button>
      }
    >
      <p className="avatar-studio__lead">
        {text.lead[profile.role]}
      </p>
      <div className="avatar-studio__layout">
        <div className="avatar-studio__preview">
          <AvatarIllustration config={draft} size={184} label={text.previewLabel} />
          <span className="t-caption muted">{text.preview}</span>
        </div>
        <div className="avatar-studio__groups">
          {GROUPS.map(({ part, title, options, swatches }) => (
            <fieldset key={part} className="avatar-studio__group">
              <legend>{title}</legend>
              <div
                className={
                  swatches
                    ? 'avatar-studio__options avatar-studio__options--swatches'
                    : 'avatar-studio__options'
                }
              >
                {options.map((option) => {
                  const selected = draft[part] === option.id;
                  const sample = { ...draft, [part]: option.id } as AvatarConfig;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={[
                        'avatar-studio__option',
                        selected && 'is-selected',
                        swatches && 'avatar-studio__option--swatch',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-label={`${title}: ${option.label}`}
                      aria-pressed={selected}
                      disabled={busy}
                      onClick={() => choose(part, option.id)}
                    >
                      {swatches ? (
                        <span className="avatar-studio__color" style={{ backgroundColor: option.color }} />
                      ) : (
                        <AvatarIllustration config={sample} size={48} />
                      )}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
      <div className="avatar-studio__footer">
        <span className="avatar-studio__status" role="status" aria-live="polite">
          {saved ? text.saved : ''}
        </span>
        <Button loading={busy} onClick={() => void save()}>
          {text.save}
        </Button>
      </div>
      {error !== null ? <FieldMessage tone="error">{text.failed}</FieldMessage> : null}
    </Card>
  );
}
