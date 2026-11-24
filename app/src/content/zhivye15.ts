/**
 * Тексты живой сцены «Как меняется знак» (теория №15, неравенства,
 * глава «Метод интервалов»): components/zhivye/znaki15. Формулы — в $…$;
 * ключи svg* и aria* — обычный текст (правило в scripts/lib/math-source.mjs).
 */

import type { TekstyUpravleniya } from '@/components/zhivye/Elementy';
import type { Primer15 } from '@/lib/zhivye/znaki15';

export const PRIMERY_15: readonly Primer15[] = [
  {
    id: 'tri',
    mnozhiteli: [
      { a: -2, k: 1 },
      { a: 1, k: 1 },
      { a: 4, k: 1 },
    ],
    znak: '>',
  },
  {
    id: 'kvadrat',
    mnozhiteli: [
      { a: 1, k: 1 },
      { a: 3, k: 2 },
    ],
    znak: '>',
  },
  {
    id: 'nestrogoe',
    mnozhiteli: [
      { a: -1, k: 2 },
      { a: 2, k: 1 },
      { a: 4, k: 1 },
    ],
    znak: '<=',
  },
];

export const ZNAKI15 = {
  nad: 'Посмотри, как это работает',
  zag: 'Как меняется знак произведения',
  lead: 'Точка $x$ идёт по прямой слева направо. У каждого множителя своя полоса: синяя — множитель положителен, оранжевая — отрицателен. Внизу — знак всего произведения: он меняется только там, где меняет знак нечётное число множителей.',
  alt: 'Сверху график произведения и числовая прямая с нулями, под ней полосы знаков каждого множителя и полоса знака произведения; вертикальная линия пробной точки x идёт слева направо.',
  zagruzka: 'Сцена загружается…',
  upravlenie: {
    zapustit: 'Запустить',
    prodolzhit: 'Продолжить',
    pauza: 'Пауза',
    snachala: 'Сначала',
    eshche: 'Ещё раз',
    skorostPokaza: 'Скорость показа',
    klaviatura: 'Пробел — пуск и пауза, стрелки — сдвиг точки на 0,5.',
  } satisfies TekstyUpravleniya,
  primer: 'Неравенство',
  ariaVremya: 'Пробная точка x',
  puzyr: (x: string) => `$x${x}$`,
  ariaPuzyr: (x: string) => `x = ${x}`,
  svgProizvedenie: 'знак',
  svgProizvedenieShiroko: 'произведение',
  status: {
    start: (ner: string, nuli: string) =>
      `Неравенство $${ner}$. Нули множителей: $${nuli}$. Запусти — точка $x$ пройдёт прямую слева направо.`,
    idet: 'Между нулями ни один множитель знак не меняет — значит, и произведение тоже.',
    nechet: (mn: string, a: string, k: number, bylo: string, stalo: string) =>
      `$x=${a}$: множитель $${mn}$ равен нулю. Степень $${k}$ — нечётная, знак меняется: $${bylo}\\;\\to\\;${stalo}$.`,
    chet: (mn: string, a: string, k: number, z: string) =>
      `$x=${a}$: множитель $${mn}$ равен нулю. Степень $${k}$ — чётная: слева и справа «$${z}$», знак не меняется.`,
    vklyuchena: ' Неравенство нестрогое — сама точка входит в ответ.',
    konec: (otvet: string) => `Берём промежутки с нужным знаком. Ответ: $x\\in${otvet}$.`,
  },
};
