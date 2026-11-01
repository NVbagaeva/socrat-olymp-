import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { OnlaynStart } from '@/components/variant/online/OnlaynStart';
import '@/components/variant/variant.css';
import '@/components/variant/online/online.css';
import { VARIANT_HREF, VARIANT_SCREEN } from '@/content/variant';
import { ONLINE_TEXT } from '@/content/variantOnline/text';

const T = ONLINE_TEXT.nachalo;

export const metadata: Metadata = {
  title: `${T.title} — Будет на ЕГЭ`,
  description: T.lead,
};

/**
 * «Решить вариант онлайн» из меню «Варианты»: ученик выбирает режим и
 * сразу решает новый вариант с автопроверкой — без ссылки от учителя.
 */
export default function Page() {
  return (
    <AppShell active="variant">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: VARIANT_SCREEN.crumbs.home, href: '/' },
            { label: VARIANT_SCREEN.title, href: VARIANT_HREF },
            { label: T.crumb },
          ]}
          title={T.title}
          lead={T.lead}
        />
        <OnlaynStart />
      </main>
    </AppShell>
  );
}
