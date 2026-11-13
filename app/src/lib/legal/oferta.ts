/**
 * Текст оферты: src/content/legal/oferta.md с подстановками. Реквизиты —
 * из prodavets.json и operator.json, сроки и цены — из конфига тарифов
 * (lib/tarify/config.ts): поменяли цену там — поменялась и оферта.
 *
 * Чистые функции без обращения к диску: страница читает файл сама
 * (lib/legal/documents.ts), скрипт docs/oferta.md — тоже.
 */

import {
  DO_EGE,
  DO_EGE_KONETS_PRODAZH,
  PERIOD_DNEY,
  PLATNYE,
  PROBNYY_SROK,
  rubli,
  type Rol,
} from '@/lib/tarify/config';
import { prodavets, srokOtkrytiyaTekst } from './prodavets';

const MESYATSY = [
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

/** «2027-02-01» → «1 февраля 2027». */
export function dataSlovami(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number);
  return `${d} ${MESYATSY[(m ?? 1) - 1]} ${g}`;
}

const MESYATSY_GDE = [
  'январе',
  'феврале',
  'марте',
  'апреле',
  'мае',
  'июне',
  'июле',
  'августе',
  'сентябре',
  'октябре',
  'ноябре',
  'декабре',
];

/** Предыдущий день: «2027-02-01» → «2027-01-31». */
function nakanune(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Строка списка тарифов: цена за 30 дней и ступени «До ЕГЭ». */
function strokaTarifa(rol: Rol): string {
  const t = PLATNYE[rol];
  const stupeni = t.doEge.map((stupen, i) => {
    const sleduyushchaya = t.doEge[i + 1]?.s ?? DO_EGE_KONETS_PRODAZH;
    const posledniy = nakanune(sleduyushchaya);
    /* Ступень ровно на календарный месяц — «в феврале 2027». */
    const tselyyMesyats =
      stupen.s.endsWith('-01') &&
      sleduyushchaya.endsWith('-01') &&
      stupen.s.slice(0, 7) === posledniy.slice(0, 7);
    const kogda =
      i === 0
        ? `при оплате по ${dataSlovami(posledniy)}`
        : tselyyMesyats
          ? `в ${MESYATSY_GDE[Number(stupen.s.slice(5, 7)) - 1]} ${stupen.s.slice(0, 4)}`
          : `с ${dataSlovami(stupen.s)} по ${dataSlovami(posledniy)}`;
    return `${rubli(stupen.tsena)} ${kogda}`;
  });
  return (
    `- **«${t.nazvanie}»** — ${rubli(t.tsena30)} за ${PERIOD_DNEY} дней. ` +
    `«До ЕГЭ» (доступ до ${dataSlovami(DO_EGE.data)}): ${stupeni.join('; ')}. ` +
    `С ${dataSlovami(DO_EGE_KONETS_PRODAZH)} срок «До ЕГЭ» не продаётся.`
  );
}

/** Подставить реквизиты, сроки и цены в текст оферты. */
export function zapolnitOfertu(md: string): string {
  const tarify = (['uchenik', 'repetitor'] as const).map(strokaTarifa).join('\n');
  return md
    .replaceAll('[ТАРИФЫ]', tarify)
    .replaceAll('[ФИО]', prodavets.fio)
    .replaceAll('[СТАТУС]', prodavets.statusPolnostyu)
    .replaceAll('[ИНН]', prodavets.inn)
    .replaceAll('[ПОЧТА]', prodavets.pochta)
    .replaceAll('[ПРОБНЫЙ_СРОК]', PROBNYY_SROK)
    .replaceAll('[СРОК_ОТКРЫТИЯ]', srokOtkrytiyaTekst())
    .replaceAll('[TELEGRAM]', prodavets.telegram)
    .replaceAll('[ПЕРИОД_ДНЕЙ]', String(PERIOD_DNEY))
    .replaceAll('[ДО_ЕГЭ]', dataSlovami(DO_EGE.data));
}
