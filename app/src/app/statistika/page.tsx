import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Breadcrumbs } from '@/components/ui';
import { StatistikaUstnyy } from '@/components/ustnyySchet/StatistikaUstnyy';
import '@/components/ustnyySchet/ustnyy.css';
import { tasksPage } from '@/content/tasks';
import { USTNYY } from '@/content/ustnyySchet';

const TITLE = 'Статистика';

export const metadata: Metadata = { title: `${TITLE} — Будет на ЕГЭ` };

/**
 * Статистика ученика. Пока здесь устный счёт (данные браузера и
 * аккаунта, результаты в рейтинге); статистика по заданиям ЕГЭ — позже.
 */
export default function Page() {
  return (
    <AppShell active="stats">
      <main className="app-main us-stranica">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: TITLE }]} />
        <h1 className="t-h1">{TITLE}</h1>
        <StatistikaUstnyy />
        <p className="us-blok__lead">
          {USTNYY.statistika.ostalnoe} <Link href={tasksPage.href}>{USTNYY.statistika.bank}</Link>
        </p>
      </main>
    </AppShell>
  );
}
