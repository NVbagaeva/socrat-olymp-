import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { ReytingStranica } from '@/components/ustnyySchet/ReytingStranica';
import '@/components/ustnyySchet/ustnyy.css';
import { USTNYY } from '@/content/ustnyySchet';
import { href, USTNYY as USTNYY_HREF } from '@/lib/paths';
import { tipograf } from '@/lib/tipograf';

export const metadata: Metadata = {
  title: USTNYY.reyting.meta.title,
  description: USTNYY.reyting.meta.description,
};

/** Рейтинг устного счёта: данные — только в браузере вошедшего. */
export default function ReytingPage() {
  return (
    <AppShell active="ustnyy">
      <main className="app-main us-stranica">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: USTNYY.crumbs, href: href(USTNYY_HREF) },
            { label: USTNYY.reyting.zag },
          ]}
        />
        <h1 className="t-h1">{USTNYY.reyting.zag}</h1>
        <p className="us-hero__lead">{tipograf(USTNYY.reyting.lead)}</p>
        <ReytingStranica />
      </main>
    </AppShell>
  );
}
