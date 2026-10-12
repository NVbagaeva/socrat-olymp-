import type { SkillItem } from '@/components/tasks/configurator';
import { eylerSvg } from '@/lib/veroyatnost/dz5/eyler';
import { SHABLONY_5 } from '@/lib/veroyatnost/dz5/shablony';
import { rng, tipOpisanie, type Tip5 } from '@/lib/veroyatnost/dz5/tipy';

/** Сколько задач шаблона можно заказать на лист: «Все» = 10 на шаблон. */
export const NA_SHABLON = 10;

/**
 * Миниатюра типа задачи на карточке шаблона — как чертёж графика на
 * карточке навыка №12: рисунок, по которому тип узнаётся с первого
 * взгляда. У диаграммы Эйлера — настоящая диаграмма движка.
 */
function Miniatyura({ tip }: { tip: Tip5 }) {
  if (tip === 'eyler') {
    const svg =
      eylerSvg({ a: 3, ab: 2, b: 2, vne: 2 }, rng('miniatyura'), 'Диаграмма Эйлера') ?? '';
    return <span className="dz5-mini dz5-mini--eyler" dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return (
    <svg className="dz5-mini" viewBox="0 0 120 72" aria-hidden="true">
      {tip === 'hotya-by' ? (
        <>
          <circle className="dz5-mini__a" cx="44" cy="30" r="20" />
          <circle className="dz5-mini__b" cx="76" cy="30" r="20" />
          <circle className="dz5-mini__a" cx="60" cy="48" r="20" />
        </>
      ) : null}
      {tip === 'bernulli'
        ? [0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              className={[0, 2, 3, 5].includes(i) ? 'dz5-mini__a' : 'dz5-mini__line'}
              x={8 + i * 18}
              y="26"
              width="14"
              height="20"
              rx="3"
            />
          ))
        : null}
      {tip === 'polnaya' || tip === 'bayes' ? (
        <>
          <path
            className="dz5-mini__line"
            d="M12 36 L52 14 M12 36 L52 36 M12 36 L52 58 M52 14 L100 8 M52 36 L100 32 M52 58 L100 60"
          />
          {tip === 'bayes' ? <path className="dz5-mini__hl" d="M12 36 L52 36 L100 32" /> : null}
          <circle className="dz5-mini__dot" cx="12" cy="36" r="5" />
          <circle className="dz5-mini__dot" cx="52" cy="14" r="4" />
          <circle className="dz5-mini__dot" cx="52" cy="36" r="4" />
          <circle className="dz5-mini__dot" cx="52" cy="58" r="4" />
        </>
      ) : null}
      {tip === 'kost' ? (
        <>
          <rect className="dz5-mini__b" x="38" y="14" width="44" height="44" rx="8" />
          {[
            [50, 26],
            [70, 26],
            [60, 36],
            [50, 46],
            [70, 46],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="dz5-mini__dot" cx={x} cy={y} r="4" />
          ))}
        </>
      ) : null}
    </svg>
  );
}

/** Карточки шаблонов для экрана генератора — собираются на сервере. */
export function shablonyItems(): SkillItem[] {
  return SHABLONY_5.map((sh) => ({
    id: sh.id,
    title: sh.nazvanie,
    code: `№ ${sh.nomer} · ${tipOpisanie(sh.tip).metka}`,
    count: NA_SHABLON,
    levels: [],
    chart: <Miniatyura tip={sh.tip} />,
  }));
}
