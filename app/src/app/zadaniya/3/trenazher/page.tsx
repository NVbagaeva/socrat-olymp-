import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Solid3Trainer } from '@/components/tasks/solid3/Solid3Trainer';
import { Breadcrumbs } from '@/components/ui';
import { stereometria } from '@/content/stereometria';
import { tasksPage } from '@/content/tasks';
import { RAZDELY } from '@/lib/zadanie3';
import { wholePool } from '@/lib/zadanie3/pool';
import '@/lib/solid/solid.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../stereometria.css';
import '../[figura]/trenazher.css';

export const metadata: Metadata = {
  title: 'Общий тренажёр — задание №3 — Будет на ЕГЭ',
  description: 'Смешанный тренажёр по всему банку задания №3.',
};

/**
 * Общий тренажёр задания №3: весь банк сразу.
 *
 * Отдельный адрес, а не вкладка раздела: здесь смешиваются задания
 * всех восьми разделов, и привязывать его к одной фигуре было бы
 * неправдой. Фильтр по типам внутри — те же 91 прототип.
 */
export default function Solid3TrainerPage() {
  const variants = RAZDELY.reduce(
    (sum, razdel) => sum + razdel.prototipy.reduce((n, p) => n + p.varianty.length, 0),
    0,
  );

  return (
    <AppShell active="tasks" task={stereometria.slug}>
      <main className="app-main">
        <Breadcrumbs
          items={[
            { label: 'Задания', href: tasksPage.href },
            {
              label: `№${Number(stereometria.no)} ${stereometria.subtitle}`,
              href: `${tasksPage.href}/${stereometria.slug}`,
            },
            { label: 'Общий тренажёр' },
          ]}
        />

        <header className="section-head figura-head">
          <div className="section-head__text">
            <div className="section-head__title">
              <h1 className="t-h1">Общий тренажёр</h1>
            </div>
            <p className="section-head__lead">
              Задания всех восьми разделов вперемешку: {variants} вариантов по 91 прототипу.
            </p>
          </div>
        </header>

        <Solid3Trainer pool={wholePool()} />
      </main>
    </AppShell>
  );
}
