'use client';

import { Polosa } from '@/components/tasks/steklo';
import { STSENA_STEREO } from '@/content/stereo/zadaniya';
import { distinctSolved } from '@/lib/progressLog';
import { log3 } from '@/lib/zadanie3/trening/progress';
import { razobratKlyuch3 } from '@/lib/zadanie3/trening/session';

/**
 * «Решено 12 из 92» в шапке №3: разные задачи банка, решённые в
 * тренажёре, — из общего журнала попыток. У гостя без попыток — «Пока
 * ничего не решено», полоса пустая. Клиентский островок в серверной
 * шапке.
 */
export function ProgressStseny3({ iz }: { iz: number }) {
  const log = log3.use();
  const n = distinctSolved(log, (task) => razobratKlyuch3(task) !== null);
  return (
    <>
      <p className="stsena__progress-text">
        {n === 0 ? STSENA_STEREO.nichego : STSENA_STEREO.resheno(n, iz)}
      </p>
      <Polosa dolya={iz === 0 ? 0 : n / iz} ton="terra" />
    </>
  );
}
