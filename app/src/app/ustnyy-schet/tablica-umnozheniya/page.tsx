import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { TablicaRezhim } from '@/components/ustnyySchet/TablicaRezhim';
import '@/components/ustnyySchet/ustnyy.css';
import { USTNYY } from '@/content/ustnyySchet';
import { href, USTNYY as USTNYY_HREF } from '@/lib/paths';
import { tipograf } from '@/lib/tipograf';

export const metadata: Metadata = {
  title: `${USTNYY.tablica.zag} — тренажёр — Будет на ЕГЭ`,
  description: USTNYY.tablica.lead,
};

export default function TablicaPage() {
  return (
    <AppShell active="ustnyy">
      <main className="app-main us-stranica">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: USTNYY.crumbs, href: href(USTNYY_HREF) },
            { label: USTNYY.tablica.zag },
          ]}
        />
        <h1 className="t-h1">{USTNYY.tablica.zag}</h1>
        <p className="us-hero__lead">{tipograf(USTNYY.tablica.lead)}</p>
        <TablicaRezhim />
      </main>
    </AppShell>
  );
}
