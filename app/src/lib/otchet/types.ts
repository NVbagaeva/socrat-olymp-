/**
 * Результат тренировки, который ученик отправляет учителю.
 *
 * Временная замена кабинета: пока сервера нет, результат целиком
 * едет в ссылке (lib/otchet/kod.ts), а учитель открывает её на
 * странице /rezultat/. Ничего не хранится и никуда не отправляется,
 * кроме мессенджера, который выбрал сам ученик.
 */

/** Чем закончилась задача — как на экране итогов. */
export type OtchetItog = 'right' | 'wrong' | 'hinted' | 'skipped';

export interface OtchetZadacha {
  /** Тип задачи: «29 · AC и tg A → AB». В названии бывают формулы $…$. */
  tip: string;
  /** Тема для итога «тема — верно из скольких». Нет темы — тип. */
  tema: string;
  itog: OtchetItog;
  /** Откуда задача: «ФИПИ № 37», «аналог». */
  istochnik?: string;
  /** Введённый ответ — только у неверно решённых. */
  otvet?: string;
  /** Идентификатор типа для фильтра тренажёра (?t=…). */
  tipId?: string;
}

export interface Otchet {
  /** Имя и фамилия, как их ввёл ученик. */
  imya: string;
  /** Номер задания ЕГЭ; null — тренажёр без номера (зачёт и т. п.). */
  nomer: number | null;
  /** Название раздела: «Планиметрия». */
  razdel: string;
  /** Когда завершена тренировка, мс от 1970 года. */
  vremya: number;
  /** Длительность, секунды. */
  sekund: number;
  /** Режим: «С подсказками». Нет — тренажёр режимов не различает. */
  rezhim?: string;
  /** Адрес тренажёра на сайте: «/zadaniya/1/trenazher/». */
  put?: string;
  zadachi: OtchetZadacha[];
}

/** Что раздел добавляет к общим итогам: режим и адрес тренажёра. */
export interface OtchetDopolnenie {
  rezhim?: string;
  put?: string;
}

/** Итог по теме: верно из скольких. */
export interface ItogTemy {
  tema: string;
  verno: number;
  vsego: number;
}

export function itogiPoTemam(zadachi: readonly OtchetZadacha[]): ItogTemy[] {
  const out: ItogTemy[] = [];
  for (const z of zadachi) {
    let row = out.find((r) => r.tema === z.tema);
    if (row === undefined) {
      row = { tema: z.tema, verno: 0, vsego: 0 };
      out.push(row);
    }
    row.vsego += 1;
    if (z.itog === 'right') row.verno += 1;
  }
  return out;
}

export function verno(otchet: Otchet): number {
  return otchet.zadachi.filter((z) => z.itog === 'right').length;
}

/** Светофор: ≥ 80 % — зелёный, 50–80 % — жёлтый, меньше — красный. */
export type Svet = 'green' | 'yellow' | 'red';

export function svet(verno: number, vsego: number): Svet {
  const p = vsego === 0 ? 0 : verno / vsego;
  if (p >= 0.8) return 'green';
  if (p >= 0.5) return 'yellow';
  return 'red';
}
