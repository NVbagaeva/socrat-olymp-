'use client';

import { clsx } from 'clsx';
import { StrokaProgressa } from '@/components/tasks/stsena';
import { ishodyZadach, logSbornika, schyot, vGlave, vTipe, type IshodZadachi } from '@/lib/sbornik/progress';

/** «Решено N из M» в шапке главы. */
export function ProgressGlavy({ glava, iz }: { glava: number; iz: number }) {
  const log = logSbornika.use();
  const s = schyot(ishodyZadach(log), vGlave(glava));
  return <StrokaProgressa n={Math.min(s.resheno, iz)} iz={iz} />;
}

/** «Решено 12 · верно 10 из 93» на карточке типа или главы. */
export function SchyotTipa({
  tip,
  glava,
  iz,
  className,
}: {
  tip?: string;
  glava?: number;
  iz: number;
  className?: string;
}) {
  const log = logSbornika.use();
  const otbor = tip !== undefined ? vTipe(tip) : vGlave(glava ?? 0);
  const s = schyot(ishodyZadach(log), otbor);
  const dolya = iz === 0 ? 0 : Math.min(1, s.resheno / iz);
  return (
    <div className={clsx('sb-schyot', className)}>
      <div className="sb-schyot__polosa" aria-hidden="true">
        <span style={{ width: `${Math.round(dolya * 100)}%` }} />
      </div>
      <p className="sb-schyot__tekst">
        {s.resheno === 0 ? (
          <>Не начато · {iz} задач</>
        ) : (
          <>
            Решено {s.resheno} из {iz} · верно {s.verno}
          </>
        )}
      </p>
    </div>
  );
}

/** Значок исхода у номера задачи в списке. */
export function useIshody(): Map<string, IshodZadachi> {
  const log = logSbornika.use();
  return ishodyZadach(log);
}
