import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { PovScreen } from '@/components/povyshennye/PovScreen';
import '@/components/variant/sectionStyles';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { EZH_SCREEN as T } from '@/content/ezhemesyachnye';

export const metadata: Metadata = {
  title: `${T.title} — Будет на ЕГЭ`,
  description: T.lead,
};

/**
 * «Ежемесячные варианты»: четыре варианта (октябрь 2026 — январь 2027),
 * экран тот же, что у вариантов повышенной сложности. Всё считается в
 * браузере — страница статическая.
 */
export default function EzhemesyachnyePage() {
  return (
    <AppShell active="ezhemesyachnye">
      <main className="app-main app-main--pov">
        <PovScreen razdel="ezh" />
      </main>
    </AppShell>
  );
}
