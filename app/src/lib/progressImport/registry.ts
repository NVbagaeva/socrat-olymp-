/**
 * Что из хранилища браузера можно перенести в аккаунт при первом входе.
 *
 * Механизм общий: раздел подключается одной записью здесь — название
 * для вопроса и ключи localStorage целиком, как их пишет сам раздел.
 * Модуль намеренно не импортирует код разделов: список нужен кабинету,
 * а тянуть ради него движки тренажёров в его сборку незачем. Что ключи
 * не разошлись с разделами, проверяет scripts/check-progress-import.mjs.
 *
 * Ключ должен начинаться с «budetege:» и состоять из строчных латинских
 * букв, цифр, «:», «_» и «-» — то же правило стоит в базе (таблица
 * user_storage).
 *
 * Чтобы подключить ещё один раздел (№5, №7, №12): добавить запись с его
 * ключами прогресса, опорных задач и сессии тренажёра
 * (budetege:trainer:<раздел>:session). Больше ничего менять не нужно.
 */

export interface ImportGroup {
  /** Короткое имя для данных и проверок. */
  id: string;
  /** Как раздел назван в вопросе «Перенести ваш прогресс…». */
  title: string;
  /** Ключи localStorage целиком. */
  keys: readonly string[];
}

export const IMPORT_GROUPS: readonly ImportGroup[] = [
  {
    id: 'z8',
    title: '№8 «Вычисления»',
    keys: [
      /* Журнал попыток тренажёра (lib/vychisleniya/progress.ts). Прежний
         ключ budetege:vychisleniya-8:v1 сворачивается в него на месте
         (lib/progressLog, LEGACY_LOGS) и сам не переносится. */
      'budetege:vychisleniya-8:log:v1',
      /* Решённые опорные задачи (там же, PREP8_KEY). */
      'budetege:vychisleniya-8:prep:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «8»). */
      'budetege:trainer:8:session',
    ],
  },
  {
    id: 'z3',
    title: '№3 «Стереометрия»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie3/trening/progress.ts). Прежний
         ключ budetege:z3:trainer:v1 сворачивается в него на месте
         (lib/progressLog, LEGACY_LOGS) и сам не переносится. */
      'budetege:zadanie-3:log:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «3»). */
      'budetege:trainer:3:session',
    ],
  },
  {
    id: 'obshchee',
    title: 'Отложенные задачи и история тренировок',
    keys: [
      /* «Отложить на потом» (lib/zakladki). */
      'budetege:zakladki:v1',
      /* Завершённые тренировки (lib/istoriya). */
      'budetege:istoriya:v1',
    ],
  },
];

/** Правило ключа — то же, что в базе. */
export const IMPORT_KEY_PATTERN = /^budetege:[a-z0-9:_-]{1,80}$/;

/** Предел размера одного значения — тот же, что в базе, с запасом на кодировку. */
export const IMPORT_VALUE_LIMIT = 280_000;
