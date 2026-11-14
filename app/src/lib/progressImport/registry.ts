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
 * Чтобы подключить ещё один раздел: добавить запись с его ключами
 * прогресса, опорных задач и сессии тренажёра
 * (budetege:trainer:<раздел>:session). Больше ничего менять не нужно.
 * У разделов, переведённых на журнал попыток позже №8 и №3, пока
 * подключён только журнал.
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
    id: 'z1',
    title: '№1 «Планиметрия»',
    keys: [
      /* Журнал попыток тренажёра (lib/planimetriya/trening/progress.ts). Прежний ключ
         budetege:planimetriya-1:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:planimetriya-1:log:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «1»). */
      'budetege:trainer:1:session',
    ],
  },
  {
    id: 'z2',
    title: '№2 «Векторы»',
    keys: [
      /* Журнал попыток тренажёра (lib/vektory/trening/progress.ts). Прежний ключ
         budetege:vektory-2:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:vektory-2:log:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «2»). */
      'budetege:trainer:2:session',
    ],
  },
  {
    id: 'z4',
    title: '№4 «Вероятность: простая»',
    keys: [
      /* Журнал попыток тренажёра (components/tasks/veroyatnost/Trenazher.tsx). Прежний ключ
         budetege:veroyatnost-4:v2 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:veroyatnost-4:log:v1',
    ],
  },
  {
    id: 'z5',
    title: '№5 «Вероятность: сложная»',
    keys: [
      /* Журнал попыток тренажёра (components/tasks/veroyatnost/Trenazher.tsx). Прежний ключ
         budetege:veroyatnost-5:v2 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:veroyatnost-5:log:v1',
    ],
  },
  {
    id: 'z6',
    title: '№6 «Случайные величины»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie6/progress.ts). Прежний ключ
         budetege:zadanie-6:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:zadanie-6:log:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «6»). */
      'budetege:trainer:6:session',
    ],
  },
  {
    id: 'z7',
    title: '№7 «Уравнения»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie7/progress.ts). Прежний ключ
         budetege:zadanie-7:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:zadanie-7:log:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «7»). */
      'budetege:trainer:7:session',
    ],
  },
  {
    id: 'z9',
    title: '№9 «Производная»',
    keys: [
      /* Журнал попыток тренажёра (lib/proizvodnaya/trening/progress.ts). Прежний ключ
         budetege:proizvodnaya-9:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:proizvodnaya-9:log:v1',
      /* Решённые опорные задачи (lib/proizvodnaya/progress.ts, PREP9_KEY). */
      'budetege:proizvodnaya-9:prep:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «9»). */
      'budetege:trainer:9:session',
    ],
  },
  {
    id: 'z10',
    title: '№10 «Физический смысл»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie10/progress.ts). */
      'budetege:zadanie-10:log:v1',
    ],
  },
  {
    id: 'z11',
    title: '№11 «Текстовые задачи»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie11/progress.ts). Прежний ключ
         budetege:zadanie-11:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:zadanie-11:log:v1',
    ],
  },
  {
    id: 'z12',
    title: '№12 «Графики функций»',
    keys: [
      /* Журнал попыток тренажёра (lib/trainerProgress.ts). Прежний ключ
         budetege:trainer:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:zadanie-12:log:v1',
      /* Незаконченная тренировка узла (lib/trainerSession/store.ts, раздел «12»). */
      'budetege:trainer:12:session',
    ],
  },
  {
    id: 'z13',
    title: '№13 «Финансовая грамотность»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie13/trening/progress.ts). Прежний ключ
         budetege:zadanie-13:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:zadanie-13:log:v1',
      /* Незаконченная тренировка (lib/trainerSession/store.ts, раздел «13»). */
      'budetege:trainer:13:session',
    ],
  },
  {
    id: 'z14',
    title: '№14 «Уравнение»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie14/progress.ts). Прежний ключ
         budetege:zadanie-14:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:zadanie-14:log:v1',
    ],
  },
  {
    id: 'z18',
    title: '№18 «Планиметрия»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie18/trenazher/progress.ts). Прежний ключ
         budetege:zadanie-18:trenazher:v1 сворачивается в него на месте (LEGACY_LOGS). */
      'budetege:zadanie-18:log:v1',
    ],
  },
  {
    id: 'z19',
    title: '№19 «Параметр»',
    keys: [
      /* Журнал попыток тренажёра (lib/zadanie19/progress.ts). */
      'budetege:zadanie-19:log:v1',
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
