/**
 * Тексты входа, регистрации и кабинета. В разметке строк нет — правка
 * только здесь.
 *
 * Обращение: общие экраны (вход, регистрация, письма) — на «вы»;
 * в кабинете ученику — на «ты», репетитору — на «вы».
 */

import type { UserRole } from '@/lib/auth/session';
import { plural } from '@/lib/plural';

export { AUTH_UI } from './auth-ui';

export const LOGIN_FORM = {
  email: 'Почта',
  emailPlaceholder: 'name@example.ru',
  password: 'Пароль',
  remember: 'Запомнить меня',
  forgot: 'Забыли пароль?',
  submit: 'Войти',
  noAccount: 'Ещё нет аккаунта?',
  toRegister: 'Зарегистрироваться',
  /* Письмо не подтверждено: предложение отправить ещё раз. */
  resend: 'Отправить письмо ещё раз',
  resent: 'Письмо отправлено.',
  wait: (sec: number) => `Повторить можно через ${sec} с`,
} as const;

export const REGISTER_FORM = {
  intro: 'Регистрация пока по приглашению: аккаунт создаётся для адресов из списка.',
  name: 'Имя',
  namePlaceholder: 'Как к вам обращаться',
  email: 'Почта',
  password: 'Пароль',
  passwordHint: 'Не меньше 8 знаков. Лучше фраза из нескольких слов.',
  passwordShort: (left: number) => `Ещё ${left} ${plural(left, 'знак', 'знака', 'знаков')}`,
  passwordOk: 'Длина подходит',
  roleTitle: 'Кто вы?',
  roles: {
    student: { title: 'Я ученик', text: 'Готовлюсь к ЕГЭ и решаю задания сам.' },
    tutor: { title: 'Я репетитор', text: 'Занимаюсь с учениками и собираю варианты.' },
  },
  submit: 'Создать аккаунт',
  haveAccount: 'Уже есть аккаунт?',
  toLogin: 'Войти',
  nameRequired: 'Напишите, как к вам обращаться.',
  emailInvalid: 'Проверьте адрес почты: в нём должна быть «@» и точка.',
  roleRequired: 'Выберите, кто вы: ученик или репетитор.',
  /* Экран после отправки формы. */
  sent: {
    title: 'Подтвердите почту',
    text: (email: string) =>
      `Письмо отправлено на ${email}. Откройте его и нажмите на ссылку — после этого можно войти.`,
    hint: 'Письма нет? Загляните в «Спам» или отправьте ещё раз через минуту.',
  },
} as const;

export const FORGOT_FORM = {
  title: 'Сброс пароля',
  text: 'Укажите почту аккаунта: пришлём ссылку для нового пароля.',
  submit: 'Отправить ссылку',
  back: 'Назад ко входу',
  sent: {
    title: 'Проверьте почту',
    text: (email: string) =>
      `Если на ${email} есть аккаунт, туда пришло письмо со ссылкой. Ссылка действует час.`,
  },
} as const;

export const CONFIRM_SCREEN = {
  busy: 'Проверяем ссылку…',
  signup: {
    title: 'Почта подтверждена',
    text: 'Аккаунт готов. Можно открыть кабинет.',
    go: 'Открыть кабинет',
  },
  emailChange: {
    title: 'Почта изменена',
    text: 'Новый адрес подтверждён.',
    go: 'Открыть кабинет',
  },
  expired: {
    title: 'Ссылка не подошла',
    text: 'Она устарела или уже использована. Войдите — если почта ещё не подтверждена, письмо можно отправить снова.',
    go: 'К странице входа',
  },
} as const;

export const NEW_PASSWORD_SCREEN = {
  title: 'Новый пароль',
  text: 'Придумайте пароль, которым будете входить.',
  password: 'Новый пароль',
  repeat: 'Ещё раз',
  mismatch: 'Пароли не совпадают.',
  submit: 'Сохранить пароль',
  done: {
    title: 'Пароль сохранён',
    text: 'Вы вошли с новым паролем.',
    go: 'Открыть кабинет',
  },
  noSession: {
    title: 'Ссылка не подошла',
    text: 'Она устарела или уже использована. Запросите новую на странице входа.',
    go: 'К странице входа',
  },
} as const;

/** Кабинет. Обращение зависит от роли: tu — ученику, vy — репетитору. */
export const KABINET = {
  title: 'Мой кабинет',
  loading: 'Загружаем кабинет…',
  needLogin: {
    title: 'Войдите, чтобы открыть кабинет',
    text: 'Кабинет показывает данные аккаунта. Без входа здесь ничего нет.',
    go: 'Войти',
  },
  profile: {
    title: 'Профиль',
    name: 'Имя',
    email: 'Почта',
    role: 'Роль',
    edit: 'Изменить',
    save: 'Сохранить',
    cancel: 'Отмена',
    saved: 'Сохранено.',
  },
  roleName: { student: 'Ученик', tutor: 'Репетитор' } satisfies Record<UserRole, string>,
  saved: {
    title: 'Что уже сохранено',
    intro: {
      student:
        'Пока в аккаунте хранится немного: статистика тренажёра живёт в твоём браузере и в аккаунт не переносится.',
      tutor:
        'Пока в аккаунте хранится немного: прогресс тренажёра живёт в браузере и в аккаунт не переносится.',
    } satisfies Record<UserRole, string>,
    welcome: 'Приветствие «Впервые здесь?»',
    welcomeSeen: (date: string) => `просмотрено ${date}`,
    welcomeNot: 'ещё не показывалось',
    tour: 'Тур по сайту',
    tourDone: (name: string) => `${name} — пройден`,
    tourStarted: (name: string) => `${name} — начат`,
    tourNone: 'не начинали',
    tourNames: { repetitor: 'Тур для репетитора' } as Record<string, string>,
    kits: 'Последние коды комплектов',
    kitsNone: 'Пока ни одного: код появляется, когда вы скачиваете лист из генератора.',
    kitsFrom: 'создан',
    sheetStudent: 'лист ученика',
    sheetTeacher: 'лист учителя',
  },
  danger: {
    title: 'Аккаунт',
    logout: 'Выйти',
    remove: 'Удалить аккаунт',
    confirmTitle: 'Удалить аккаунт?',
    confirmText: {
      student:
        'Удалим аккаунт, профиль и всё, что в нём сохранено. Вернуть нельзя. Прогресс тренажёра в браузере останется.',
      tutor:
        'Удалим аккаунт, профиль и сохранённые коды комплектов. Вернуть нельзя. Комплекты в браузере останутся.',
    } satisfies Record<UserRole, string>,
    confirm: 'Удалить',
    cancel: 'Отмена',
    removed: {
      title: 'Аккаунт удалён',
      text: 'Все данные аккаунта стёрты. Сайт по-прежнему открыт без входа.',
      go: 'На главную',
    },
  },
} as const;

/** «11 октября 2026» из ISO. */
export function dateRu(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Минимальная длина пароля. Та же цифра стоит в настройках Supabase. */
export const PASSWORD_MIN = 8;

export function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
