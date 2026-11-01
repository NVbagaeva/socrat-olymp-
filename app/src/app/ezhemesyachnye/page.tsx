import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { PovScreen } from '@/components/povyshennye/PovScreen';
import '@/components/variant/sectionStyles';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { SEO_STRANITSY } from '@/content/seo';

export const metadata: Metadata = SEO_STRANITSY.ezhemesyachnye;

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
