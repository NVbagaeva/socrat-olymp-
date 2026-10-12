import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { AUTH_UI } from '@/content/auth';
import { AuthShell } from './AuthShell';

/**
 * Страницы входа при выключенном флаге NEXT_PUBLIC_AUTH_ENABLED.
 * Статический экспорт собирает их всегда, поэтому у адреса должно
 * быть честное содержимое, а не пустой экран.
 */
export function AuthDisabled() {
  return (
    <AuthShell>
      <EmptyState
        title={AUTH_UI.disabled.title}
        description={AUTH_UI.disabled.text}
        action={
          <Link className="btn btn--primary" href="/">
            {AUTH_UI.disabled.back}
          </Link>
        }
      />
    </AuthShell>
  );
}
