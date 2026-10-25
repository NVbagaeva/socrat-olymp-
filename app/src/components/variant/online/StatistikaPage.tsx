'use client';

import { useState } from 'react';
import { Select } from '@/components/ui';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { StatsView } from './StatsView';
import { useArchive } from './useArchive';

/** Статистика ученика по онлайн-вариантам: за всё время или по серии. */
export function StatistikaPage() {
  const works = useArchive();
  const [code, setCode] = useState<string | null>(null);
  if (works === null) return null;
  /* Серии — партии, по которым есть завершённые работы; подпись — название работы. */
  const series = [
    ...new Map(works.map((w) => [w.code, w.title.split(' · ')[0] ?? w.code])).entries(),
  ];
  return (
    <div className="vo-statistika">
      {series.length > 1 ? (
        <label className="vo-field">
          <span className="vo-answer__label">{T.stats.series}</span>
          <Select
            value={code ?? ''}
            onChange={(e) => setCode(e.target.value === '' ? null : e.target.value)}
          >
            <option value="">{T.stats.all}</option>
            {series.map(([c, title]) => (
              <option key={c} value={c}>
                {title} · {c}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      <StatsView works={works} code={code} />
    </div>
  );
}
