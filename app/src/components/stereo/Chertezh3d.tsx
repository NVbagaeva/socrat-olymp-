import { renderSolid } from '@/lib/solid/render';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import type { Model } from '@/lib/solid/model';
import { typeset } from '@/lib/tex';
import { ZhivoyChertezh3d } from './ZhivoyChertezh3d';

export interface Chertezh3dProps {
  /** Модель движка lib/solid: тела, пометки; у пометок — шаги (поле shag). */
  model: Model;
  /**
   * Подписи шагов решения: «Проведём диагональ $AC$». Шаг k показывает
   * элементы модели с shag ≤ k и выделяет элементы шага k. Шаг 0 —
   * рисунок условия. Не заданы — чертёж без шагов, всё сразу.
   */
  shagi?: readonly string[];
  /** Подпись к шагу 0. */
  uslovie?: string;
  /** Начальный ракурс, градусы. */
  azimuth?: number;
  elevation?: number;
  className?: string;
}

/**
 * Интерактивный стереометрический чертёж — один на теорию, разборы,
 * опорные задачи и решения тренажёра.
 *
 * Первый кадр рисуется на сборке тем же движком (lib/solid): страница
 * открывается с готовым чертежом, без скриптов. Движок приезжает в
 * браузер, только когда ученик тронул чертёж (повернул, нажал шаг) —
 * three.js и WebGL здесь не нужны: вид ортогональный, невидимые линии
 * пунктиром, подписи расставляются заново под каждый ракурс.
 */
export function Chertezh3d({
  model,
  shagi,
  uslovie = 'Рисунок условия',
  azimuth = ORTHO_AZIMUTH,
  elevation = ORTHO_ELEVATION,
  className,
}: Chertezh3dProps) {
  const estShagi = shagi !== undefined && shagi.length > 0;
  const svg = renderSolid(model, {
    view: orthoAt(azimuth, elevation),
    ustoychivo: true,
    ...(estShagi ? { shag: 0 } : {}),
  });
  return (
    <ZhivoyChertezh3d
      model={model}
      svg={svg}
      azimuth={azimuth}
      elevation={elevation}
      podpisi={estShagi ? [typeset(uslovie), ...shagi.map((text) => typeset(text))] : []}
      {...(className === undefined ? {} : { className })}
    />
  );
}
