import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { PovScreen } from '@/components/povyshennye/PovScreen';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import '@/components/variant/sectionStyles';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { POV_SCREEN as T } from '@/content/povyshennye';

export const metadata: Metadata = {
  title: `${T.title} — Будет на ЕГЭ`,
  description: T.lead,
};

/**
 * «Варианты повышенной сложности»: 36 вариантов по 6 версий. Всё
 * считается в браузере — страница статическая.
 */
export default function PovyshennyePage() {
  return (
    <AppShell active="povyshennye">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[{ label: T.crumbs.home, href: '/' }, { label: T.title }]}
          title={T.title}
          lead={T.lead}
        />
        <PovScreen />
      </main>
    </AppShell>
  );
}
