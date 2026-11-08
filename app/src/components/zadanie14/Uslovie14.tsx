import { Tex } from '@/components/ui/Tex';
import { uslovieA, uslovieB } from '@/lib/zadanie14/tekst';
import type { Zadacha14 } from '@/lib/zadanie14/tipy';

/** Условие задачи №14: пункт а и, если есть, пункт б. */
export function Uslovie14({ z }: { z: Zadacha14 }) {
  const b = z.vid === 'uravnenie' ? uslovieB(z) : null;
  return (
    <div className="z14-uslovie">
      <p>
        <Tex text={uslovieA(z)} />
      </p>
      {b === null ? null : (
        <p>
          <Tex text={b} />
        </p>
      )}
    </div>
  );
}
