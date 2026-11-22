import { TabScrollOnMount } from '../TabScroll';
import { RazdelIkonka } from '../razdely/RazdelIkonka';
import { ikonkaRazdela } from '../razdely/ikonka';
import type { GruppaVybora } from '../trening';
import { TRENAZHER12, VIDY12_TON } from '@/content/zadanie12';
import { skillTitle } from '@/content/skills12';
import { functionTypes } from '@/data/functionTypes';
import { texPlain, typeset } from '@/lib/tex';
import { katalog12 } from '@/lib/ves12/trening/katalog';
import { podtemaNabora } from '@/lib/ves12/trenazher12';
import { Trenazher12Banka } from './Trenazher12Banka';

/** Виды функций с наборами тренажёра: группы выбора тем, типы — наборы. */
export function gruppy12(katalog: ReturnType<typeof katalog12>): GruppaVybora[] {
  const vidNabora = podtemaNabora();
  return functionTypes.flatMap((vid) => {
    const nabory = Object.keys(katalog).filter((id) => vidNabora[id] === vid.id);
    if (nabory.length === 0) return [];
    return [
      {
        id: vid.id,
        nazvanie: vid.title,
        znakHtml: '',
        znak: <RazdelIkonka icon={ikonkaRazdela('12', vid.icon)} sizes="56px" />,
        ton: VIDY12_TON[vid.id] ?? 'blue',
        tipy: nabory.map((id) => ({
          id,
          nazvanieHtml: `<span>${typeset(skillTitle[id] ?? id)}</span>`,
        })),
      },
    ];
  });
}

/**
 * Вкладка «Тренажёр» узла №12 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (семь видов функций, 42 типа), экран задачи, итоги. Задачи
 * на странице не лежат: тренировка собирается в браузере из каталога
 * шаблонов, условие, чертёж и разбор строит движок graph/.
 */
export function Trenazher12Tab({ base }: { base: string }) {
  const katalog = katalog12();
  const gruppy = gruppy12(katalog);
  const nazvaniyaTekst = Object.fromEntries(
    Object.keys(katalog).map((id) => [id, texPlain(skillTitle[id] ?? id)]),
  );
  return (
    <section className="trainer z12-trening trn-host" aria-labelledby="z12-trening-title">
      <h2 className="sr-only" id="z12-trening-title">
        {TRENAZHER12.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher12Banka
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog}
      />
    </section>
  );
}
