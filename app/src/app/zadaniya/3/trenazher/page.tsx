import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { Solid3Trainer } from '@/components/tasks/solid3/Solid3Trainer';

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
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          className="figura-head"
          crumbs={[
            { label: 'Задания', href: tasksPage.href },
            {
              label: `№${Number(stereometria.no)} ${stereometria.subtitle}`,
              href: `${tasksPage.href}/${stereometria.slug}`,
            },
            { label: 'Общий тренажёр' },
          ]}
          title="Общий тренажёр"
          lead={`Задания всех восьми разделов вперемешку: ${variants} вариантов по 91 прототипу.`}
        />

        <Solid3Trainer pool={wholePool()} roundKey="z3:all" />
      </main>
    </AppShell>
  );
}
