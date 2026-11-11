import type { Model } from '@/lib/solid/model';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { vybratVidSolid } from '@/lib/solid/vid';
import { prototypeById } from '@/lib/zadanie3';

/**
 * Значок группы или навыка: фигура прототипа банка без подписей и
 * построений, нарисованная движком чертежей на сборке. Это иконка, а
 * не чертёж задачи: она не вращается.
 */
export function figurkaSvg(prototip: string): string {
  const p = prototypeById(prototip);
  const first = p?.varianty[0];
  if (p === undefined || first === undefined) {
    return '';
  }
  const m = vybratVidSolid(p.chertezh(first.params)).model;
  const golaya: Model = {
    alt: '',
    bodies: m.bodies,
    ...(m.rakurs === undefined ? {} : { rakurs: m.rakurs }),
  };
  return renderSolid(golaya, {
    view: orthoAt(m.rakurs?.azimuth ?? ORTHO_AZIMUTH, m.rakurs?.elevation ?? ORTHO_ELEVATION),
    tema: 'ekran',
    bezPodpisey: true,
  });
}

export function Figurka({ prototip }: { prototip: string }) {
  return <span className="z3-figurka" dangerouslySetInnerHTML={{ __html: figurkaSvg(prototip) }} />;
}
