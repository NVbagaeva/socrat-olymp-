import type { Metadata } from 'next';
import { ZaglushkaStereo } from '@/components/stereo/ZaglushkaStereo';
import { Pechat3Panel } from '@/components/tasks/solid3/Pechat3Panel';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';
import { href, ZADANIYA } from '@/lib/paths';
import { RAZDELY } from '@/lib/zadanie3';
import { estScenariy } from '@/lib/zadanie3/chertezhi';

const VKLADKA = vkladkaStereo('repetitory');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/**
 * Листы по урокам №3 — этап 5 плана; пока честная заглушка. Ниже —
 * «Лист для печати»: набор задач раздела листом ученика и листом
 * учителя (раньше стоял под тренажёром; это инструмент репетитора).
 */
export default function Page() {
  const base = `${ZADANIYA}/3`;
  return (
    <>
      <ZaglushkaStereo no="3" vkladka={VKLADKA} />
      {/* Листы — у разделов с многогранниками: их чертежи — сценарии. */}
      <Pechat3Panel
        razdely={RAZDELY.filter((r) => r.prototipy.some(estScenariy)).map((r) => ({
          base: href(base, 'pechat', r.slug),
          nazvanie: r.nazvanie,
        }))}
      />
    </>
  );
}
