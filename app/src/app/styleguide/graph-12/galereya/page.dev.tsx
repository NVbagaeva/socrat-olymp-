'use client';

/* Галерея банка задания №12: все задачи прототипов показательной,
   логарифмической и тригонометрических функций — задачи открытого
   банка ФИПИ и аналоги, с рисунками и ответами. Только для разработки:
   файл page.dev.tsx Next видит лишь в `next dev` или с флагом
   GALEREYA=1 (next.config.ts); в сборке сайта маршрута нет (404),
   проверка — scripts/check-galereya-12.mjs. */

import { useMemo, useState } from 'react';
import 'katex/dist/katex.min.css';
import { katex } from '@/lib/graph/katex';
import GraphGenerate from '@/lib/graph/generate.js';
import { prep, prototypes } from '@/lib/graph/data/index.js';
import { functionTypes } from '@/data/functionTypes';

/* Подтемы, у которых наборы — банк ФИПИ с аналогами. */
const FAMILIES = ['exponential', 'logarithmic', 'trigonometric'];

interface Task {
  id: string;
  svg: string | null;
  questionHtml: string;
  answer: string;
  source?: string | null;
  level: string | null;
}

function typesetHtml(html: string): string {
  return html.replace(/<span class="math" data-tex="([^"]*)"><\/span>/g, (_, tex: string) =>
    katex.renderToString(
      tex
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&'),
      {
        throwOnError: false,
      },
    ),
  );
}

export default function GalereyaPage() {
  const families = functionTypes.filter(
    (type) => FAMILIES.includes(type.id) && type.bank.prototypes.length > 0,
  );
  const [family, setFamily] = useState(families[0]?.id ?? '');
  const [seed, setSeed] = useState<number | null>(null);
  const sets = useMemo(() => {
    GraphGenerate.setSets({ prep, prototypes });
    const type = families.find((item) => item.id === family);
    return (type?.bank.prototypes ?? []).map((id) => ({
      id,
      tasks: GraphGenerate.generateSet(id, seed ?? undefined) as Task[],
    }));
  }, [family, seed, families]);

  return (
    <main style={{ padding: 24, fontFamily: 'var(--font-sans, sans-serif)' }}>
      <h1>Галерея банка задания №12</h1>
      <p>
        Только для разработки. Задачи ФИПИ — дословно, остальные — аналоги, не из открытого банка.
      </p>
      <p>
        {families.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setFamily(type.id)}
            aria-pressed={family === type.id}
            style={{ marginRight: 8 }}
          >
            {type.title}
          </button>
        ))}
        <button type="button" onClick={() => setSeed(Math.floor(Math.random() * 1e6))}>
          Другой seed
        </button>
        <span style={{ marginLeft: 8 }}>seed: {seed ?? 'исходный'}</span>
      </p>
      {sets.map((set) => (
        <section key={set.id}>
          <h2>
            {set.id}: разных ответов среди аналогов{' '}
            {
              new Set(set.tasks.filter((task) => task.source !== 'fipi').map((task) => task.answer))
                .size
            }
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {set.tasks.map((task) => (
              <figure key={task.id} style={{ margin: 0, border: '1px solid #ddd', padding: 8 }}>
                <figcaption>
                  <b>{task.id}</b> ·{' '}
                  {task.source === 'fipi' ? 'открытый банк ФИПИ' : 'не из открытого банка'}
                  {task.level ? ` · ${task.level}` : ''}
                  <div dangerouslySetInnerHTML={{ __html: typesetHtml(task.questionHtml) }} />
                  <div>
                    Ответ: <b>{task.answer}</b>
                  </div>
                </figcaption>
                {task.svg ? <div dangerouslySetInnerHTML={{ __html: task.svg }} /> : null}
              </figure>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
