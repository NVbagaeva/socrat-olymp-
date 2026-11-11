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
  const [kadr, setKadr] = useState<ReturnType<Kadr> | null>(null);
  useEffect(() => {
    let zhiv = true;
    setKadr(null);
    zagruzitDvizhok()
      .then((narisovat) => {
        if (zhiv) setKadr(narisovat(model));
      })
      .catch(() => {
        /* Чертёж не нарисовался — задача решается и по условию. */
      });
    return () => {
      zhiv = false;
    };
  }, [model]);
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
