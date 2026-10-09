import { counted } from '@/lib/plural';

/** Подписи общей оболочки тренажёров. Обращение к ученику — на «вы» или безлично. */
export const sessionText = {
  barLabel: 'Управление тренировкой',
  task: 'Задание',
  of: 'из',
  solved: 'решено',
  timer: 'Время тренировки',
  pause: 'Пауза',
  resume: 'Продолжить',
  finish: 'Завершить',
  finishShort: 'Завершить тренировку',
  cancel: 'Отмена',

  finishTitle: 'Завершить тренировку?',
  finishText: 'Нерешённые задания будут засчитаны как пропущенные.',

  pausedTitle: 'Тренировка на паузе',
  pausedText: 'Время не идёт, задания скрыты. Нажмите «Продолжить», чтобы вернуться к ним.',

  unfinishedTitle: 'Есть незавершённая тренировка',
  unfinishedText: (solved: number, total: number) =>
    `У вас есть незавершённая тренировка (решено ${solved} из ${total}). ` +
    'Продолжить её или начать новую? Прогресс старой будет потерян.',
  keepOld: 'Продолжить старую',
  startNew: 'Начать новую',

  blocked: {
    taken: {
      title: 'Тренировка продолжена в другой вкладке',
      text: 'Чтобы вкладки не затирали ответы друг друга, здесь тренировка остановлена. Можно вернуться к ней в этой вкладке — тогда остановится другая.',
      action: 'Продолжить здесь',
    },
    replaced: {
      title: 'В другой вкладке начата новая тренировка',
      text: 'Эта тренировка заменена. Можно открыть ту, что идёт сейчас.',
      action: 'Открыть текущую',
    },
    gone: {
      title: 'Тренировка завершена в другой вкладке',
      text: 'Здесь она больше не доступна. Можно выбрать новую.',
      action: 'К выбору тренировки',
    },
  },

  noSave:
    'Прогресс не сохранится: браузер не даёт записывать данные (например, включён приватный режим). Если уйти со страницы, тренировка будет потеряна.',
  oldVersion:
    'Сохранённая тренировка устарела после обновления сайта и сброшена. Можно начать новую.',
  brokenSession:
    'Не удалось восстановить сохранённую тренировку — она сброшена. Можно начать новую.',
  dismiss: 'Понятно',

  unknownKind: 'Задание',

  summary: {
    title: 'Тренировка завершена',
    lead: 'Вот как она прошла.',
    scoreLabel: 'Верных ответов',
    percentLabel: 'Результат',
    rows: {
      total: 'Всего заданий',
      right: 'Верно',
      wrong: 'Неверно',
      skipped: 'Пропущено',
      hinted: 'Решено с подсказкой',
      time: 'Потраченное время',
    },
    kinds: 'Статистика по типам заданий',
    list: 'Задания',
    showReview: 'Показать разбор',
    hideReview: 'Скрыть разбор',
    newTraining: 'Новая тренировка',
    retry: (count: number) => `Прорешать ошибки (${count})`,
    back: 'Вернуться к заданиям',
    trophyAlt: 'Кубок',
  },

  marks: {
    right: 'Верно',
    wrong: 'Неверно',
    skipped: 'Пропущено',
    hinted: 'С подсказкой',
  },

  menuDot: 'Есть незавершённая тренировка',
  tasks: (n: number) => counted(n, 'задание', 'задания', 'заданий'),
};

/** «5 мин 12 с». Часы не нужны: подход столько не длится, а если длится — «1 ч 5 мин». */
export function timeText(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return minutes === 0 ? `${rest} с` : `${minutes} мин ${rest} с`;
}

/** «04:12» для часов на панели. */
export function clockText(ms: number): string {
  const whole = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const two = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}
