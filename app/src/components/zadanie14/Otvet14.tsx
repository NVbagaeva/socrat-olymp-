'use client';

import { clsx } from 'clsx';
import { MathPole } from '@/components/chast2/MathPole';
import { Tex } from '@/components/ui/Tex';
import type { Itog14, Vvod14 } from '@/lib/zadanie14/proverkaZadachi';
import type { Zadacha14 } from '@/lib/zadanie14/tipy';

const METKA: Record<string, string> = {
  verno: 'верно',
  neverno: 'неверно',
  'ne-razobrano': 'не прочитано',
  pusto: 'нет ответа',
};

function Znachok({ p }: { p: Itog14['a'] | null }) {
  if (p === null) return null;
  return <span className={clsx('z14-otmetka', `z14-otmetka--${p}`)}>{METKA[p]}</span>;
}

/**
 * Поля ответа №14: серии пункта а (каждая — своё поле формулы, можно
 * добавить ещё), корни пункта б через точку с запятой или одно число
 * разминки. Ввод — клавиатура формул: дроби, π, минус.
 */
export function Otvet14({
  z,
  vvod,
  onVvod,
  itog,
  onProverit,
  zakryto = false,
}: {
  z: Zadacha14;
  vvod: Vvod14;
  onVvod: (v: Vvod14) => void;
  itog: Itog14 | null;
  onProverit: () => void;
  zakryto?: boolean;
}) {
  if (z.vid === 'razminka') {
    return (
      <form
        className="z14-vvod"
        onSubmit={(e) => {
          e.preventDefault();
          onProverit();
        }}
      >
        <div className="z14-vvod__stroka">
          <MathPole
            value={vvod.chislo}
            onChange={(t) => onVvod({ ...vvod, chislo: t })}
            label="Ответ — число"
            testId="z14-chislo"
            placeholder="-0,5"
            readOnly={zakryto}
          />
          <Znachok p={itog?.a ?? null} />
        </div>
        {zakryto ? null : (
          <button type="submit" className="btn btn--primary">
            Проверить
          </button>
        )}
      </form>
    );
  }
  const setSeriya = (i: number, t: string) => {
    const serii = [...vvod.serii];
    serii[i] = t;
    onVvod({ ...vvod, serii });
  };
  return (
    <form
      className="z14-vvod"
      onSubmit={(e) => {
        e.preventDefault();
        onProverit();
      }}
    >
      <fieldset className="z14-vvod__punkt">
        <legend>
          {z.promezhutok ? 'а) ' : ''}Серии корней <Znachok p={itog?.a ?? null} />
        </legend>
        <p className="z14-vvod__podskazka">
          <Tex text="Каждую серию — в своё поле: $\dfrac{\pi}{6}+2\pi k$. Можно записать через $\pm$ или $(-1)^k$." />
        </p>
        {vvod.serii.map((t, i) => (
          <div className="z14-vvod__stroka" key={i}>
            <span className="z14-vvod__x">
              <Tex text="$x=$" />
            </span>
            <MathPole
              value={t}
              onChange={(x) => setSeriya(i, x)}
              label={`Серия ${i + 1}`}
              testId={`z14-seriya-${i}`}
              placeholder="\frac{\pi}{6}+2\pi k"
              readOnly={zakryto}
            />
            {vvod.serii.length > 1 && !zakryto ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                aria-label={`Убрать серию ${i + 1}`}
                onClick={() => onVvod({ ...vvod, serii: vvod.serii.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
        {zakryto || vvod.serii.length >= 6 ? null : (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => onVvod({ ...vvod, serii: [...vvod.serii, ''] })}
          >
            + Ещё серия
          </button>
        )}
        <p className="z14-vvod__podskazka">
          <Tex text="Буква серии — любая: $k$, $n$, $m$; везде считаем, что она целая." />
        </p>
      </fieldset>
      {z.promezhutok ? (
        <fieldset className="z14-vvod__punkt">
          <legend>
            б) Корни на промежутке <Znachok p={itog?.b ?? null} />
          </legend>
          <div className="z14-vvod__stroka">
            <MathPole
              value={vvod.korni}
              onChange={(x) => onVvod({ ...vvod, korni: x })}
              label="Корни через точку с запятой"
              testId="z14-korni"
              placeholder="-\frac{7\pi}{6};-\pi"
              readOnly={zakryto}
            />
          </div>
          <p className="z14-vvod__podskazka">Порядок корней не важен.</p>
        </fieldset>
      ) : null}
      {itog !== null && itog.otklik.length > 0 ? (
        <ul className="z14-vvod__otklik" role="status">
          {itog.otklik.map((t) => (
            <li key={t}>
              <Tex text={t} />
            </li>
          ))}
        </ul>
      ) : null}
      {zakryto ? null : (
        <button type="submit" className="btn btn--primary">
          Проверить
        </button>
      )}
    </form>
  );
}
