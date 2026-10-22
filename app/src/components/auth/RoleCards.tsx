'use client';

import { clsx } from 'clsx';
import { REGISTER_FORM } from '@/content/auth';
import type { UserRole } from '@/lib/auth/session';

/* Те же значки, что в окне «Впервые здесь?» (components/onboarding):
   шапочка выпускника — ученик, двое — репетитор. */
export function RoleIcon({ role }: { role: UserRole }) {
  return role === 'student' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2v-4M21.5 9.5v5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16.5 13.9c2.4.2 4.1 1.8 4.5 4.6" />
    </svg>
  );
}

export interface RoleCardsProps {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  /** Подпись группы для скринридера. */
  label: string;
  disabled?: boolean;
}

const ROLES: readonly UserRole[] = ['student', 'tutor'];

/** Выбор роли двумя крупными карточками. Это радиогруппа: одна из двух. */
export function RoleCards({ value, onChange, label, disabled = false }: RoleCardsProps) {
  return (
    <div className="role-cards" role="radiogroup" aria-label={label}>
      {ROLES.map((role) => {
        const text = REGISTER_FORM.roles[role];
        const checked = value === role;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled}
            className={clsx('role-card', checked && 'is-checked')}
            data-role={role}
            onClick={() => onChange(role)}
          >
            <span className="role-card__icon">
              <RoleIcon role={role} />
            </span>
            <span className="role-card__title">{text.title}</span>
            <span className="role-card__text">{text.text}</span>
          </button>
        );
      })}
    </div>
  );
}
