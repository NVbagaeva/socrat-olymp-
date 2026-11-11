/**
 * Карта задания №8: пять групп, 26 типов (прототипы 8.A … 8.Z).
 *
 * Группы — утверждены заказчиком (шаг 0 редизайна): Степени, Корни,
 * Логарифмы, Тригонометрия (с тремя подзаголовками), Буквенные
 * выражения. Прототипы при этом те же, что в lib/vychisleniya/
 * prototypes: здесь только раскладка для вкладки «О задании» и
 * выбора тем в тренажёре. Навыки S1–S11 (lib/vychisleniya/skills.ts)
 * остаются для листов генератора и кабинета.
 */

export type Ton8 = 'blue' | 'navy' | 'orange' | 'terra' | 'green';

export interface Podgruppa8 {
  nazvanie: string;
  prototypes: string[];
}

export interface Gruppa8 {
  id: string;
  nazvanie: string;
  /** Формула-значок, TeX. */
  znak: string;
  ton: Ton8;
  /** Блок опорных задач (lib/vychisleniya/prep/blocks.ts → slug). */
  opornye: string;
  /** Подзаголовки внутри группы; без них — один список. */
  podgruppy?: Podgruppa8[];
  prototypes: string[];
}

export const GRUPPY8: Gruppa8[] = [
  {
    id: 'stepeni',
    nazvanie: 'Степени',
    znak: 'a^{n}',
    ton: 'blue',
    opornye: 'stepeni-korni',
    prototypes: ['8.A', '8.C', '8.D'],
  },
  {
    id: 'korni',
    nazvanie: 'Корни',
    znak: '\\sqrt{a}',
    ton: 'navy',
    opornye: 'stepeni-korni',
    prototypes: ['8.B', '8.E', '8.F', '8.G'],
  },
  {
    id: 'logarifmy',
    nazvanie: 'Логарифмы',
    znak: '\\log_{a} b',
    ton: 'orange',
    opornye: 'logarifmy',
    prototypes: ['8.H', '8.J', '8.I', '8.K', '8.L'],
  },
  {
    id: 'trigonometriya',
    nazvanie: 'Тригонометрия',
    znak: '\\sin\\alpha',
    ton: 'terra',
    opornye: 'znaki-chetverti',
    podgruppy: [
      { nazvanie: 'Значение по известной функции', prototypes: ['8.M', '8.N', '8.O'] },
      { nazvanie: 'Формулы двойного угла', prototypes: ['8.P', '8.R', '8.S'] },
      { nazvanie: 'Табличные значения и приведение', prototypes: ['8.Q', '8.T', '8.U', '8.V'] },
    ],
    prototypes: ['8.M', '8.N', '8.O', '8.P', '8.R', '8.S', '8.Q', '8.T', '8.U', '8.V'],
  },
  {
    id: 'bukvennye',
    nazvanie: 'Буквенные выражения',
    znak: 'a^{2} - b^{2}',
    ton: 'green',
    opornye: 'bukvennye',
    prototypes: ['8.W', '8.X', '8.Y', '8.Z'],
  },
];

export function gruppaById(id: string): Gruppa8 | undefined {
  return GRUPPY8.find((g) => g.id === id);
}

/** Группа, в которую входит прототип. */
export function gruppaOfPrototype(prototype: string): Gruppa8 | undefined {
  return GRUPPY8.find((g) => g.prototypes.includes(prototype));
}

/** Все 26 прототипов в порядке карты. */
export const PROTOTYPES8_ORDER: string[] = GRUPPY8.flatMap((g) => g.prototypes);
