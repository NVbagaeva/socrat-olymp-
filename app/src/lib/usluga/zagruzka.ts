/**
 * Строка загрузки: когда начну обычный заказ и свободно ли срочное место.
 *
 * Данные — content/zagruzka.ts, правятся руками. Функция защищает от
 * забытого файла (§4.3 документа услуги): прошедшую дату старта не
 * показывает, а отметку «срочное место занято» за прошлую неделю
 * считает недействительной. Чистая: «сегодня» приходит аргументом.
 */

export interface ZagruzkaFayl {
  /** Ближайший старт обычного заказа, ГГГГ-ММ-ДД. */
  nextStart: string;
  /** Срочное место на неделе weekOf. */
  urgentSlot: 'free' | 'taken';
  /** Понедельник недели, к которой относится urgentSlot, ГГГГ-ММ-ДД. */
  weekOf: string;
}

export interface Zagruzka {
  /** Дата старта для показа или null, если дата прошла. */
  start: Date | null;
  srochnoeSvobodno: boolean;
}

function data(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Понедельник недели, в которую попадает день. */
export function ponedelnik(den: Date): Date {
  const d = new Date(den.getFullYear(), den.getMonth(), den.getDate());
  const sdvig = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - sdvig);
  return d;
}

export function prochitat(f: ZagruzkaFayl, segodnya: Date): Zagruzka {
  const den = new Date(segodnya.getFullYear(), segodnya.getMonth(), segodnya.getDate());
  const start = data(f.nextStart);
  const nedelya = data(f.weekOf);
  const tekushchaya =
    nedelya !== null && ponedelnik(nedelya).getTime() === ponedelnik(den).getTime();
  return {
    start: start !== null && start.getTime() >= den.getTime() ? start : null,
    srochnoeSvobodno: !(tekushchaya && f.urgentSlot === 'taken'),
  };
}

const MESYACY = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** «29 сентября» — без года: старт всегда в ближайшие недели. */
export function denMesyac(d: Date): string {
  return `${d.getDate()} ${MESYACY[d.getMonth()]}`;
}
