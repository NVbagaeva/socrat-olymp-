import { AppShell } from '@/components/layout/AppShell';
import { StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { RAZDELY_TEORII } from '@/content/theoryVektory';
import { tasksPage } from '@/content/tasks';
import { VEKTORY } from '@/content/vektory';
import { SHAPKA2 } from '@/content/vektory2';
import { BLOKI } from '@/lib/vektory/prep/bloki';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import { RazdelTabs } from '../RazdelTabs';
import { Progress2 } from './Progress2';
import { ZADANIYA } from '@/lib/paths';

/**
 * Оболочка задания №2: шапка «Стеклянная сцена», кольцо прогресса и
 * лента вкладок. Вызывается из layout маршрута — при переходе между
 * вкладками остаётся на месте. Устройство то же, что у №8.
 *
 * Кольцо считает действия ученика: разделы теории, до конца которых
 * он долистал, решённые микрозадачи тренировок и прототипы тренажёра,
 * решённые хоть раз верно. Их общее число приходит отсюда, из тех же
 * списков, из которых строятся содержание теории и лента блоков:
 * отдельного числа нигде нет. Кольцо остаётся справа, на месте
 * обложки: мотив раздела занял бы его место, а прогресс важнее.
 */
export function VektoryShell({ children }: { children: React.ReactNode }) {
  const base = `${ZADANIYA}/${VEKTORY.slug}`;

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(VEKTORY.no)}` },
          ]}
          title={VEKTORY.title}
          lead={VEKTORY.lead}
          tabletki={tabletkiRazdela({
            chast: VEKTORY.badge,
            fakty: SHAPKA2.fakty(PROTOTYPES.length),
          })}
          media={
            <Progress2
              razdely={RAZDELY_TEORII.map((r) => r.id)}
              bloki={BLOKI.map((b) => ({ id: b.id, total: b.zadachi.length }))}
              prototypes={PROTOTYPES.map((p) => p.id)}
            />
          }
        />

        <RazdelTabs
          base={base}
          tabs={VEKTORY.tabs}
          className="topic-tabs-row--stsena"
          {...(VEKTORY.tutors.items.length === 0 ? {} : { tutors: VEKTORY.tutors })}
        />

        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
