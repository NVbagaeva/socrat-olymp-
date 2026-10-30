/**
 * Общее для части 2 ежемесячных вариантов: чертежи теми же движками,
 * что у вариантов повышенной сложности — стереометрия (lib/chertezh3,
 * на экране чертёж вращается руками) и планиметрия (renderPlan).
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { renderPlan } from '@/lib/planimetriya/render';
import type { Scena } from '@/lib/planimetriya/types';
import { obernut3d } from '@/lib/stereo/zhivoy';
import type { Chast2Zadacha, Shablon2 } from '@/lib/povyshennye/chast2/types';

/** Чертёж стереометрии к решению: ракурс выбирает движок, ракурс можно передать готовым. */
export function stereo(sc: Scenariy, rakursIz?: Scenariy): string {
  const s =
    rakursIz === undefined
      ? sVidom(sc, vybratVid(postroit(sc)))
      : { ...sc, rakurs: rakursIz.rakurs, szhatie: rakursIz.szhatie };
  return obernut3d(chertezhSvg(s, { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' }), {
    sc: s,
    vspom: true,
  });
}

/** Ракурс сценария, выбранный движком: им пользуются все чертежи задачи. */
export function sRakursom(sc: Scenariy): Scenariy {
  return sVidom(sc, vybratVid(postroit(sc)));
}

/** Чертёж планиметрии к решению (лист учителя: все слои). */
export function plan(scena: Scena, alt: string): string {
  return renderPlan(scena, { rezhim: { rezhim: 'uchitel' }, shirina: 260, vysota: 260, alt });
}

/** Шаблон части 2 с готовыми числами варианта: параметров нет. */
export function gotovyy(
  no: Chast2Zadacha['no'],
  prototip: string,
  sobrat: () => Chast2Zadacha,
): Shablon2<Record<string, never>> {
  return { no, prototip, sobrat: () => sobrat() };
}
