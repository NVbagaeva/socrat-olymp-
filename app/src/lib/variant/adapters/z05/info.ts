import type { SectionInfo } from '../../types';

/**
 * Задание №5 «Вероятности сложных событий»: подтипы — блоки банка
 * (lib/veroyatnost/blocks.ts, BLOKI_5 — десять методов автора).
 * Названия повторены здесь, чтобы экран фильтров не тянул банк;
 * расхождение с банком адаптер ловит при загрузке (`init` бросает).
 */
export const info: SectionInfo = {
  egeNumber: 5,
  title: 'Вероятности сложных событий',
  subtypes: [
    { id: 'nesovmestnye', label: 'Несовместные события: складываем' },
    { id: 'protivopolozhnoe', label: 'Через противоположное событие' },
    { id: 'koordinatnaya', label: 'Промежутки на числовой прямой' },
    { id: 'sovmestnye', label: 'Совместные события: общая часть' },
    { id: 'uslovnaya', label: 'Вероятность при условии' },
    { id: 'nezavisimye', label: 'Независимые события: перемножаем' },
    { id: 'hotya-by', label: '«Хотя бы один»: через «ни одного»' },
    { id: 'dva-predmeta', label: 'Два предмета без возвращения' },
    { id: 'polnaya', label: 'Полная вероятность: несколько путей' },
    { id: 'do-uspeha', label: 'Пробуем до первой удачи' },
  ],
  capabilities: {
    difficulty: false,
    fipi: false,
    own: true,
    studentSolution: 'full',
    figure: 'none',
    notes: [
      'Все задачи — прототипы банка раздела (BANK_5, 14–18 вариантов на прототип); разметки «из открытого банка ФИПИ» нет.',
      'Сложность в разделе не размечена.',
      'Разбор для ученика — разбор тренажёра: метод и шаги словами с формулой; учителю — шаги разбора, как в сборнике №5 (answers.steps).',
    ],
  },
};
