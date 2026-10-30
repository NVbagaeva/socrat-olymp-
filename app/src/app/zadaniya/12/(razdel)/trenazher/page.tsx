import type { Metadata } from 'next';
import { TrainerStats } from '@/components/tasks/trainer/TrainerStats';
import { Trenazher12 } from '@/components/tasks/trainer/Trenazher12';
import { ssylki12 } from '@/components/tasks/trainer/TrainerShell';
import { trenazherAllText } from '@/content/ves12';
import { trenazherConfig12, zadachi12 } from '@/lib/ves12/trenazher12';
import { ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../../[task]/[type]/topic.css';
import '../../../[task]/[type]/prep.css';
import '../../../[task]/[type]/trainer.css';

export const metadata: Metadata = {
  title: `${trenazherAllText.pageTitle} — Будет на ЕГЭ`,
  description: trenazherAllText.lead,
};

const BASE = `${ZADANIYA}/12/trenazher/`;

/**
 * Вкладка «Тренажёр» №12 — по всем типам функций: та же панель
 * фильтров, что у подтем, чипы — типы функций, под выбранным типом —
 * его наборы. Шапка и лента — в layout раздела.
 */
export default function TrenazherAllPage() {
  const config = trenazherConfig12();
  const refs = zadachi12();
  return (
    <section className="trainer">
      <Trenazher12
        config={config}
        refs={refs}
        backHref={BASE}
        ssylki={ssylki12()}
        pod={<TrainerStats total={refs.length} />}
      />
    </section>
  );
}
