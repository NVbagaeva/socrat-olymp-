'use client';

import { useEffect, useState } from 'react';
import { ZhivoyChertezh3d } from '@/components/stereo/ZhivoyChertezh3d';
import type { Model } from '@/lib/solid/model';

/**
 * Чертёж задачи по модели, приехавшей с данными (тренажёр): первый
 * кадр рисует в браузере тот же движок lib/solid, что и на сборке,
 * дальше фигура вращается рукой. Движок грузится отдельным куском,
 * когда чертёж появился на экране; до этого место под него занято,
 * страница не прыгает.
 */

type Kadr = (model: Model) => { svg: string; azimuth: number; elevation: number };

let dvizhok: Promise<Kadr> | null = null;

function zagruzitDvizhok(): Promise<Kadr> {
  dvizhok ??= Promise.all([import('@/lib/solid/render'), import('@/lib/solid/project')]).then(
    ([{ renderSolid }, { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt }]) =>
      (model: Model) => {
        const azimuth = model.rakurs?.azimuth ?? ORTHO_AZIMUTH;
        const elevation = model.rakurs?.elevation ?? ORTHO_ELEVATION;
        return {
          svg: renderSolid(model, {
            view: orthoAt(azimuth, elevation),
            ustoychivo: true,
            tema: 'ekran',
          }),
          azimuth,
          elevation,
        };
      },
  );
  dvizhok.catch(() => {
    dvizhok = null;
  });
  return dvizhok;
}

export function ChertezhZadachi({ model, alt }: { model: Model; alt: string }) {
  /* Кадр помнит свою модель: у новой задачи старый чертёж не мелькнёт. */
  const [gotov, setGotov] = useState<{ model: Model; kadr: ReturnType<Kadr> } | null>(null);
  useEffect(() => {
    let zhiv = true;
    zagruzitDvizhok()
      .then((narisovat) => {
        if (zhiv) setGotov({ model, kadr: narisovat(model) });
      })
      .catch(() => {
        /* Чертёж не нарисовался — задача решается и по условию. */
      });
    return () => {
      zhiv = false;
    };
  }, [model]);
  const kadr = gotov !== null && gotov.model === model ? gotov.kadr : null;
  if (kadr === null) {
    return <div className="z3-chertezh z3-chertezh--zhdyot" role="img" aria-label={alt} />;
  }
  return (
    <ZhivoyChertezh3d
      className="z3-chertezh"
      model={model}
      svg={kadr.svg}
      azimuth={kadr.azimuth}
      elevation={kadr.elevation}
      podpisi={[]}
      tema="ekran"
    />
  );
}
