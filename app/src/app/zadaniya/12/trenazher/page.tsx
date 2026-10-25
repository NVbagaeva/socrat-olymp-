import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { TrainerStats, Trenazher12 } from '@/components/tasks/trainer';
import { ssylki12 } from '@/components/tasks/trainer/TrainerShell';
import { trenazherAllText } from '@/content/ves12';
import { tasksPage } from '@/content/tasks';
import { trenazherConfig12, zadachi12 } from '@/lib/ves12/trenazher12';
import { href, ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../zadaniya.css';
import '../../[task]/section.css';
import '../../[task]/[type]/topic.css';
import '../../[task]/[type]/prep.css';
import '../../[task]/[type]/trainer.css';

export const metadata: Metadata = {
  title: `${trenazherAllText.pageTitle} — Будет на ЕГЭ`,
  description: trenazherAllText.lead,
};

const BASE = `${ZADANIYA}/12/trenazher/`;

/**
 * Тренажёр по всем типам №12: та же панель фильтров, что у подтем,
 * чипы — типы функций, под выбранным типом — его наборы.
 */
export default function TrenazherAllPage() {
  const config = trenazherConfig12();
  const refs = zadachi12();
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: '№12', href: href(ZADANIYA, 12) },
            { label: 'Тренажёр по всем типам' },
          ]}
          title={trenazherAllText.pageTitle}
          lead={trenazherAllText.lead}
        />
        <section className="trainer">
          <Trenazher12
            config={config}
            refs={refs}
            backHref={BASE}
            ssylki={ssylki12()}
            pod={<TrainerStats total={refs.length} />}
          />
        </section>
      </main>
    </AppShell>
  );
}
