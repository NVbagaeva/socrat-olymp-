import type { Metadata } from 'next';
import { Generator3 } from '@/components/tasks/solid3/Generator3';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { info3 } from '@/lib/zadanie3/gen/info';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = vkladkaStereo('generator');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/**
 * Вкладка «Генератор» задания №3: лист ученика и лист учителя из одного
 * набора, варианты, PDF. Разделы и прототипы — на сборке, задачи и
 * чертежи — в браузере, по первому «Сгенерировать».
 */
export default function Page() {
  return (
    <>
      <VariantFromSection />
      <Generator3 razdely={info3()} base={`${ZADANIYA}/3`} />
    </>
  );
}
