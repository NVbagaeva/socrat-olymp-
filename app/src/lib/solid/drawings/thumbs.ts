/**
 * Миниатюры разделов: по одной на каждый из восьми разделов.
 *
 * Без подписей и вспомогательных построений: миниатюра должна
 * узнаваться силуэтом на кольце разделов.
 */

import { box, regularPrism, regularPyramid } from '../figures';
import { type Model } from '../model';
import { prismModel, unlabelled } from './common';

export const THUMBS: Record<string, Model> = {
  'thumb-I': prismModel('Прямоугольный параллелепипед', unlabelled(box(5, 3, 3.6))),
  'thumb-II': prismModel(
    'Правильная шестиугольная призма',
    unlabelled(regularPrism(6, 2.6, 4, 'cabinet')),
  ),
  'thumb-III': {
    alt: 'Правильная четырёхугольная пирамида',
    bodies: [unlabelled(regularPyramid(4, 2.9, 4.2))],
  },
  'thumb-IV': { alt: 'Конус', bodies: [{ kind: 'cone', base: [0, 0, 0], r: 2.5, h: 4.6 }] },
  'thumb-V': { alt: 'Цилиндр', bodies: [{ kind: 'cylinder', base: [0, 0, 0], r: 2.2, h: 4.4 }] },
  'thumb-VI': { alt: 'Шар', bodies: [{ kind: 'sphere', center: [0, 0, 0], r: 2.4 }] },
  'thumb-VII': {
    alt: 'Цилиндр и конус с общим основанием',
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: 2.4, h: 4, glass: true },
      { kind: 'cone', base: [0, 0, 0], r: 2.4, h: 4, hideBase: true },
    ],
  },
  'thumb-VIII': (() => {
    const cube = unlabelled(box(4, 4, 4));
    cube.glass = true;
    return {
      alt: 'Шар, вписанный в куб',
      bodies: [cube, { kind: 'sphere', center: [2, 2, 2], r: 2 } as const],
    };
  })(),
};
