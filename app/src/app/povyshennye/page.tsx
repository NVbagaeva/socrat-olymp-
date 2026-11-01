import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { PovScreen } from '@/components/povyshennye/PovScreen';
import '@/components/variant/sectionStyles';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { metaPovyshennye } from '@/content/seo';
import { GOTOVY, zagruzitVariant } from '@/lib/povyshennye/dannye';

/* Число вариантов и версий в описании — из данных раздела. Версий у
   вариантов поровну; если когда-нибудь станет по-разному, в описании —
   наименьшее число, чтобы не обещать лишнего. */
export async function generateMetadata(): Promise<Metadata> {
  const varianty = await Promise.all(GOTOVY.map((k) => zagruzitVariant(k)));
  const versiy = Math.min(...varianty.map((v) => v?.versii.length ?? 0));
  return metaPovyshennye(GOTOVY.length, versiy);
}

/**
 * «Варианты повышенной сложности»: 36 вариантов по 6 версий. Всё
 * считается в браузере — страница статическая.
 */
export default function PovyshennyePage() {
  return (
    <AppShell active="povyshennye">
      <main className="app-main app-main--pov">
        <PovScreen />
      </main>
    </AppShell>
  );
}
