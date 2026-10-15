'use client';

import { useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { legalDocs } from '@/content/legal/documents';
import type { Invitation, Me } from '@/lib/kabinet/types';
import { inviteUrl } from './registration';
import { kabinetText, roleName } from './text';
import { formatDate } from './useKabinet';

/** Инициалы для аватара: «Анна Петрова» → «АП». */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

/** Согласия пользователя (редакция и дата) и ссылки на тексты документов. */
export function DocumentsBlock({ me }: { me: Me }) {
  const t = kabinetText.docs;
  return (
    <Card title={t.title} compact>
      <ul className="kab-docs">
        {me.consents.map((c) => (
          <li key={`${c.kind}-${c.version}`} className="t-caption muted">
            {t.accepted(t.kinds[c.kind], c.version, formatDate(c.acceptedAt))}
          </li>
        ))}
      </ul>
      <p className="t-caption kab-docs__links">
        {Object.values(legalDocs).map((d) => (
          <a key={d.id} href={d.href} target="_blank" rel="noopener">
            {d.linkLabel}
          </a>
        ))}
      </p>
      <p className="t-caption dim">{t.storage}</p>
    </Card>
  );
}

/** Только что созданный код приглашения: ссылка и «Скопировать». */
export function InviteLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(code);
  return (
    <div className="kab-invite" role="status">
      <p className="t-caption muted">{kabinetText.invites.created}</p>
      <div className="kab-invite__row">
        <code className="kab-invite__url">{url}</code>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            void navigator.clipboard?.writeText(url).then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }
        >
          {copied ? kabinetText.invites.copied : kabinetText.invites.copy}
        </Button>
      </div>
    </div>
  );
}

export function invitationStatus(inv: Invitation): keyof typeof kabinetText.invites.status {
  if (inv.usedAt !== null) return 'used';
  if (inv.revokedAt !== null) return 'revoked';
  if (inv.expiresAt <= new Date().toISOString()) return 'expired';
  return 'active';
}

const STATUS_TONE = {
  active: 'info',
  used: 'success',
  revoked: 'neutral',
  expired: 'neutral',
} as const;

/** Список приглашений с «Отозвать» у действующих. */
export function InvitationList({
  items,
  onRevoke,
}: {
  items: Invitation[];
  onRevoke: (id: string) => void;
}) {
  const t = kabinetText.invites;
  if (items.length === 0) return <p className="t-caption muted">{t.none}</p>;
  return (
    <ul className="kab-list">
      {items.map((inv) => {
        const status = invitationStatus(inv);
        return (
          <li key={inv.id} className="kab-list__row">
            <span>
              {roleName[inv.role]}
              {inv.className !== null ? ` · ${inv.className}` : ''}
              {inv.usedBy !== null ? ` · ${inv.usedBy.name}` : ''}
              <span className="dim t-caption"> · создано {formatDate(inv.createdAt, false)}</span>
            </span>
            <span className="kab-list__end">
              <Badge tone={STATUS_TONE[status]}>{t.status[status]}</Badge>
              {status === 'active' ? (
                <Button size="sm" variant="ghost" onClick={() => onRevoke(inv.id)}>
                  {t.revoke}
                </Button>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
