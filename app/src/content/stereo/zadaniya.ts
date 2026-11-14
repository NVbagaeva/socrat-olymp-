/**
 * Тексты раздела «Стереометрия»: задания №3 (часть 1) и №15 (часть 2).
 *
 * Оба задания собраны одним шаблоном (components/stereo): одинаковые
 * шапка, лента вкладок и пилюля «Стереометрия · №… ▾», которая
 * переключает №3 ↔ №15. Здесь — всё, чем они различаются: номер,
 * заголовок, лид, часть. Главы теории — content/stereo/glavy.ts.
 * Устройство раздела и план работ — docs/stereometry-plan.md.
 */

import { VKLADKA_KARTOCHKI } from '../kartochkiUi';
import { NOMERA_S_KARTOCHKAMI } from '../kartochki/spisok';
import { OPORNYE } from '../opornye';
import { taskName } from '../tasks';
import type { RazdelTab } from '../vkladki';
import { nomerRazdela } from '../struktura';

export type StereoNo = '3' | '15';

/** Вкладки — одни на оба задания: переход в другое задание сохраняет вкладку. */
export const VKLADKI_STEREO: readonly RazdelTab[] = [
  { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
  { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
  { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
  { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
  { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  { id: 'repetitory', label: 'Для репетиторов', tail: 'dlya-repetitorov/', icon: 'materials' },
];

/**
 * Вкладки задания: у номера с колодой карточек «Карточки» стоят после
 * «Тренажёра» — так на макете «Стеклянной сцены» №3. Общая лента
 * (RazdelTabs) вставляет «Карточки» после «Теории» сама, но только если
 * их в списке ещё нет — поэтому здесь они заданы явно.
 */
export function vkladkiStereo(no: StereoNo): readonly RazdelTab[] {
  if (!NOMERA_S_KARTOCHKAMI.includes(no)) return VKLADKI_STEREO;
  const trenazher = VKLADKI_STEREO.findIndex((tab) => tab.id === 'trenazher');
  const kuda = trenazher === -1 ? VKLADKI_STEREO.length : trenazher + 1;
  return [...VKLADKI_STEREO.slice(0, kuda), VKLADKA_KARTOCHKI, ...VKLADKI_STEREO.slice(kuda)];
}

export interface StereoZadanie {
  /** Ключ задания: номер хранения раздела. На экран идёт nomer. */
  no: StereoNo;
  /** Номер задания ЕГЭ — для показа (content/struktura.js). */
  nomer: number;
  slug: string;
  part: 1 | 2;
  title: string;
  lead: string;
  badge: string;
  /** Коротко — на переключателе раздела на телефоне: «№3 Стереометрия». */
  kratko: string;
  /** Подпись карточки в меню разделов: «Часть 1 · краткий ответ». */
  podpis: string;
  /** Ключ прочитанных глав теории в lib/theoryRead. */
  teoriyaKey: string;
}

/* Номера ЕГЭ двух заданий раздела. Ключи '3' и '15' — номера хранения. */
const N3 = nomerRazdela('stereometriya');
const N15 = nomerRazdela('stereometriya-dokazatelstvo');

export const STEREO: Readonly<Record<StereoNo, StereoZadanie>> = {
  '3': {
    no: '3',
    nomer: N3,
    slug: '3',
    part: 1,
    title: `Задание №${N3}. ${taskName('3')}`,
    lead: 'Многогранники и тела вращения: длины, площади, объёмы. Ответ — число.',
    badge: 'Часть 1',
    kratko: `№${N3} ${taskName('3')}`,
    podpis: 'Часть 1 · краткий ответ',
    teoriyaKey: '3',
  },
  '15': {
    no: '15',
    nomer: N15,
    slug: '15',
    part: 2,
    title: `Задание №${N15}. ${taskName('15')}`,
    lead: 'Пункт а — доказательство, пункт б — вычисление: сечения, углы и расстояния в пространстве.',
    badge: 'Часть 2',
    kratko: `№${N15} ${taskName('15')}`,
    podpis: 'Часть 2 · развёрнутый ответ',
    teoriyaKey: '15',
  },
};

/** Заголовок окна браузера: «Теория · Задание №3. Стереометрия — Будет на ЕГЭ». */
export function stereoTitle(no: StereoNo, tab: string): string {
  return `${tab} · ${STEREO[no].title} — Будет на ЕГЭ`;
}

/** Подпись вкладки по id: заголовок панели и окна. */
export function vkladkaStereo(id: string): string {
  const tab = VKLADKI_STEREO.find((item) => item.id === id);
  if (tab === undefined) {
    throw new Error(`Нет вкладки стереометрии ${id}`);
  }
  return tab.label;
}

/** Навигация между №3 и №15: пилюля, меню, блок внизу вкладки. */
export const NAV_STEREO = {
  /** «Все разделы стереометрии» — заголовок меню и подпись для скринридера. */
  chi: 'стереометрии',
  /** Кнопка над заголовком: открывает то же меню. */
  vse: `Стереометрия: №${N3} и №${N15}`,
  /** Блок внизу каждой вкладки. */
  drugoe: 'Стереометрия в другой части',
  drugoeLead: 'Те же темы — в другом формате ответа. Вкладка останется той же.',
  /** Ссылки к спискам заданий в меню. */
  kChasti: [
    { part: 1, title: 'Все задания части 1', href: '/zadaniya/' },
    { part: 2, title: 'Все задания части 2', href: '/zadaniya/?part=2' },
  ],
} as const;

/** Вкладка, которая ещё не собрана: честное пустое состояние. */
export const ZAGLUSHKA_STEREO = {
  title: 'Вкладка готовится',
  text: 'Каркас раздела готов: вкладки наполняются по плану — сначала «О задании» и теория, затем опорные задачи, тренажёр и генератор.',
  kTeorii: 'Перейти к теории',
  kTrenazheru: 'Открыть тренажёр',
} as const;

/** Шапка «Стеклянная сцена» (components/tasks/stsena): подписи. */
export const STSENA_STEREO = {
  /** Кнопка у обложки: по ней картинка сменяется живой моделью. */
  vrashchat: 'Можно вращать',
  oblozhka:
    'Стеклянный куб с вписанным шаром. Поворачивается перетаскиванием и стрелками; если подержать и тянуть (или Shift со стрелками) — двигается по шапке, двойное касание или Escape — на место.',
  resheno: (n: number, iz: number) => `Решено ${n} из ${iz}`,
  nichego: 'Пока ничего не решено',
  progress: 'Решено задач банка',
} as const;

/** Декор колонки содержания теории. */
export const DEKOR_STEREO = {
  note: 'Чертёж — половина решения',
} as const;
