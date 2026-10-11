'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { checkObraztsy, checkStress } from '@/lib/planimetriya/selftest';

/**
 * Стресс-тест движка прямо в браузере: те же проверки, что у
 * pnpm test:planimetriya. Нужен, чтобы глазами убедиться, что
 * автотест действительно гоняет 1000 генераций.
 */
export function StressTest() {
  const [itog, setItog] = useState<string | null>(null);
  const [idet, setIdet] = useState(false);
  const zapusk = () => {
    setIdet(true);
    /* Отдаём кадр, чтобы кнопка успела показать загрузку. */
    setTimeout(() => {
      const t0 = performance.now();
      const o = checkObraztsy();
      const s = checkStress(1000, `brauzer-${Date.now()}`);
      const ms = Math.round(performance.now() - t0);
      const vse = [...o.problems, ...s.problems];
      setItog(
        `Образцы: ${o.risunkov} рисунков. Стресс-тест: 1000 генераций, ${s.risunkov} рисунков. ` +
          `Нарушений: ${vse.length}. ${ms} мс.` +
          (vse.length ? `\n${vse.slice(0, 20).join('\n')}` : ''),
      );
      setIdet(false);
    }, 30);
  };
  return (
    <div className="pl1__stress">
      <Button onClick={zapusk} loading={idet}>
        Прогнать 1000 случайных генераций
      </Button>
      {itog && <pre className="pl1__itog t-sm">{itog}</pre>}
    </div>
  );
}
