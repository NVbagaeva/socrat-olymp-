import type { Metadata } from 'next';
import { Trenazher12Tab } from '@/components/tasks/zadanie12/Trenazher12Tab';
import { trenazherAllText } from '@/content/ves12';
import { ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
/* Подсказка по шагам и разбор движка — разметка прежнего тренажёра
   №12 (tstep, thint, solution-*): подключается без правок. */
import '../../../[task]/[type]/topic.css';
import '../../../[task]/[type]/prep.css';
import '../../../[task]/[type]/trainer.css';

export const metadata: Metadata = {
  title: `${trenazherAllText.pageTitle} — Будет на ЕГЭ`,
  description: trenazherAllText.lead,
};

const BASE = `${ZADANIYA}/12/trenazher/`;

/**
 * Вкладка «Тренажёр» №12 — по всем видам функций, на общем тренажёре
 * «Стеклянной сцены» (как у №7, №6, №2). Шапка и лента — в layout раздела.
 */
export default function TrenazherAllPage() {
  return <Trenazher12Tab base={BASE} />;
}
