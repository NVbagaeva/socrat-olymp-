/**
 * Раздел VI. Шар: прототипы P03-71 … P03-73.
 *
 * В условии речь о двух шарах, поэтому на чертеже два шара рядом.
 * Отношение радиусов на чертеже показано, а не вычислено по условию:
 * при отношении девять к одному второй шар выродился бы в точку.
 */

import { type Model, type Sphere } from '../model';
import type { Vec3 } from '../vec';

const ball = (center: Vec3, r: number): Sphere => ({ kind: 'sphere', center, r });

function twoBalls(alt: string, r1: number, r2: number): Model {
  const gap = r1 + r2 + 0.8;
  return {
    alt,
    bodies: [ball([0, 0, 0], r1), ball([gap, 0, 0], r2)],
  };
}

export const SECTION6: Record<string, Model> = {
  'P03-71': twoBalls('Два шара: радиусы относятся как три к четырём', 1.8, 2.4),
  'P03-72': twoBalls('Два шара: радиус первого больше радиуса второго', 2.4, 1.2),
  'P03-73': twoBalls('Два шара: радиус первого больше радиуса второго', 2.4, 1.2),
};
