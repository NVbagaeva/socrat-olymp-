import type { SectionInfo } from '../../types';

/**
 * Задание №4 «Начала теории вероятностей»: подтипы — блоки банка
 * (lib/veroyatnost/blocks.ts, BLOKI_4 — методы списка Б). Названия
 * повторены здесь, чтобы экран фильтров не тянул банк; расхождение с
 * банком адаптер ловит при загрузке (`init` бросает).
 */
export const info: SectionInfo = {
  egeNumber: 4,
  title: 'Начала теории вероятностей',
  subtypes: [
    { id: 'klassicheskaya', label: 'Подсчёт исходов' },
    { id: 'kubiki', label: 'Игральные кости' },
    { id: 'monety', label: 'Броски монеты' },
    { id: 'kruglyy-stol', label: 'Жеребьёвка и рассадка' },
    { id: 'protivopolozhnye', label: 'Через противоположное событие' },
    { id: 'geometricheskoe', label: 'Доля длины и площади' },
    { id: 'statisticheskoe', label: 'Вероятность по частоте' },
  ],
  capabilities: {
    difficulty: false,
    fipi: false,
    own: true,
    studentSolution: 'full',
    figure: 'none',
    notes: [
      'Все задачи — прототипы банка раздела (BANK_4, 10–20 вариантов на прототип); разметки «из открытого банка ФИПИ» нет.',
      'Сложность в разделе не размечена.',
      'Разбор для ученика — разбор тренажёра: метод и шаги словами с формулой; учителю — шаги разбора, как в сборнике №4 (answers.steps).',
    ],
  },
};
