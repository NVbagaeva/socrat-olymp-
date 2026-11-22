import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { Trenirovka, TrenirovkaIzAdresa } from '@/components/ustnyySchet/Trenirovka';
import '@/components/ustnyySchet/ustnyy.css';
import { USTNYY } from '@/content/ustnyySchet';
import { href, USTNYY as USTNYY_HREF } from '@/lib/paths';
import { ZAPROS_PO_UMOLCHANIYU } from '@/lib/ustnyySchet/zapros';

export const metadata: Metadata = {
  title: `${USTNYY.trenirovka.zag} — ${USTNYY.nazvanie} — Будет на ЕГЭ`,
  description: USTNYY.meta.description,
  /* Страница-инструмент: настройки в строке запроса, искать её незачем. */
  robots: { index: false },
};

/**
 * Экран тренировки. Что тренировать — в строке запроса: при сборке
 * страница собирается с настройками по умолчанию, в браузере читает
 * адрес (lib/ustnyySchet/zapros.ts).
 */
export default function TrenirovkaPage() {
  return (
    <AppShell active="ustnyy">
      <main className="app-main us-stranica us-trenirovka">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: USTNYY.crumbs, href: href(USTNYY_HREF) },
            { label: USTNYY.trenirovka.zag },
          ]}
        />
        <h1 className="sr-only">{USTNYY.trenirovka.zag}</h1>
        <Suspense fallback={<Trenirovka zapros={ZAPROS_PO_UMOLCHANIYU} />}>
          <TrenirovkaIzAdresa />
        </Suspense>
      </main>
    </AppShell>
  );
}
