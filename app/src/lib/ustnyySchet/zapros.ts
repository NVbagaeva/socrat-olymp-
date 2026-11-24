/**
 * Адрес тренировки устного счёта: что тренируем и как — в строке
 * запроса страницы /ustnyy-schet/trenirovka/. Так работают кнопка
 * «Назад», ссылки «Тренироваться» со страниц приёмов и закладки.
 *
 *   p=na-11,okolo-100   приёмы        d=umnozhenie,delenie  действия
 *   t=2,3,7&o=da&po=1   таблица (строки, обратная: net/da/smes, по порядку)
 *   f=tablica-1m        зачётный формат (режим и настройки — его)
 *   r=svobodnyy | s20 | v60          режим
 *   u=2  dec=0  otr=0  lim=100       уровень и выключатели
 *   ege=men | bol                    уравнения «Как в ЕГЭ»: в ответ меньший или больший корень
 *   k=7x8,6x9                        работа над ошибками таблицы: эти клетки
 *   go=1                             сразу начать, без настроек
 */

import { href, USTNYY, USTNYY_TAIL } from '@/lib/paths';
import { format, reytingFormat, type FormatId, type ReytingFormatId } from './formaty';
import { NASTROYKI_PO_UMOLCHANIYU, type Nabor, type Nastroyki } from './nabor';
import { estPriyom, priyom } from './registry';
import { LIMITY_SEK, SERII, type Rezhim } from './sessiya';
import { DEYSTVIYA, type Deystvie, type PriyomId, type Uroven } from './types';

export interface Zapros {
  nabor: Nabor;
  rezhim: Rezhim;
  nast: Nastroyki;
  go: boolean;
  /** Неверные примеры возвращаются в эту же тренировку (работа над ошибками). */
  vozvrat?: boolean;
  /** Рейтинговая тренировка этого формата (rt=1): примеры и время — с сервера. */
  reyting?: ReytingFormatId;
}

export const ZAPROS_PO_UMOLCHANIYU: Zapros = {
  nabor: { tip: 'deystviya', ids: ['slozhenie', 'vychitanie', 'umnozhenie', 'delenie'] },
  rezhim: { tip: 'seriya', n: 10 },
  nast: NASTROYKI_PO_UMOLCHANIYU,
  go: false,
};

function rezhimStr(r: Rezhim): string {
  return r.tip === 'svobodnyy' ? 'svobodnyy' : r.tip === 'seriya' ? `s${r.n}` : `v${r.sek}`;
}

function rezhimIz(s: string | null): Rezhim | null {
  if (s === 'svobodnyy') return { tip: 'svobodnyy' };
  const m = /^([sv])(\d+)$/.exec(s ?? '');
  if (m === null) return null;
  const n = Number(m[2]);
  if (m[1] === 's') return SERII.includes(n) ? { tip: 'seriya', n } : null;
  return LIMITY_SEK.includes(n) ? { tip: 'vremya', sek: n } : null;
}

/** Строка запроса для тренировки. */
export function zaprosStr(z: Partial<Zapros>): string {
  const q = new URLSearchParams();
  const n = z.nabor;
  if (n?.tip === 'priyomy') q.set('p', n.ids.join(','));
  else if (n?.tip === 'deystviya') q.set('d', n.ids.join(','));
  else if (n?.tip === 'tablica') {
    q.set('t', n.stroki.join(','));
    if (n.obratnaya !== 'net') q.set('o', n.obratnaya);
    if (n.poryadok === 'po-poryadku') q.set('po', '1');
  } else if (n?.tip === 'format') q.set('f', n.id);
  else if (n?.tip === 'spisok') {
    q.set('k', [...new Set(n.primery.map((p) => p.d.join('x')))].join(','));
  }
  if (z.rezhim !== undefined && n?.tip !== 'format' && n?.tip !== 'spisok')
    q.set('r', rezhimStr(z.rezhim));
  if (z.nast !== undefined && n?.tip !== 'format' && n?.tip !== 'spisok') {
    if (z.nast.uroven !== 1) q.set('u', String(z.nast.uroven));
    if (!z.nast.desyatichnye) q.set('dec', '0');
    if (!z.nast.otricatelnye) q.set('otr', '0');
    if (z.nast.predel !== null) q.set('lim', String(z.nast.predel));
    if (z.nast.ege !== undefined) q.set('ege', z.nast.ege);
  }
  if (z.go === true) q.set('go', '1');
  return q.toString();
}

/** Ссылка на рейтинговую тренировку формата. */
export function reytingHref(id: ReytingFormatId, go = false): string {
  return href(USTNYY, USTNYY_TAIL.trenirovka, `?f=${id}&rt=1${go ? '&go=1' : ''}`);
}

/** Ссылка на тренировку. */
export function trenirovkaHref(z: Partial<Zapros>): string {
  const q = zaprosStr(z);
  return href(USTNYY, USTNYY_TAIL.trenirovka, q === '' ? '' : `?${q}`);
}

/** Настройки зачётного формата: всё фиксировано. */
export function nastroykiFormata(): Nastroyki {
  return { uroven: 2, desyatichnye: true, otricatelnye: true, predel: null };
}

export function rezhimFormata(id: FormatId): Rezhim {
  const f = format(id);
  if (f === undefined) return ZAPROS_PO_UMOLCHANIYU.rezhim;
  return f.tip === 'vremya' ? { tip: 'vremya', sek: f.sek ?? 60 } : { tip: 'seriya', n: f.n ?? 20 };
}

/** Разобрать строку запроса; мусор — значения по умолчанию. */
export function prochitat(q: URLSearchParams): Zapros {
  const go = q.get('go') === '1';
  const f = q.get('f');
  const rt = q.get('rt') === '1' && f !== null ? reytingFormat(f) : undefined;
  if (rt !== undefined) {
    const prakt = format(rt.id);
    return {
      nabor: prakt === undefined ? ZAPROS_PO_UMOLCHANIYU.nabor : { tip: 'format', id: prakt.id },
      rezhim: prakt === undefined ? { tip: 'seriya', n: rt.n ?? 20 } : rezhimFormata(prakt.id),
      nast: nastroykiFormata(),
      go,
      reyting: rt.id,
    };
  }
  if (f !== null && format(f) !== undefined) {
    const id = f as FormatId;
    return {
      nabor: { tip: 'format', id },
      rezhim: rezhimFormata(id),
      nast: nastroykiFormata(),
      go,
    };
  }
  const k = (q.get('k') ?? '').split(',').filter((x) => /^(10|[2-9])x(10|[2-9])$/.test(x));
  if (k.length > 0) {
    const tb = priyom('tablica');
    const primery = [...new Set(k)].slice(0, 25).map((c, i) => {
      const [a = 2, b = 2] = c.split('x').map(Number);
      /* Строкой — больший множитель, как учат: «×8». */
      return tb.iz(
        [String(Math.max(a, b)), String(Math.min(a, b))],
        2,
        i % 2 === 0 ? undefined : 'ba',
      );
    });
    return {
      nabor: { tip: 'spisok', primery },
      rezhim: { tip: 'seriya', n: Math.min(50, primery.length * 2) },
      nast: { ...NASTROYKI_PO_UMOLCHANIYU, uroven: 2 },
      go,
      vozvrat: true,
    };
  }
  let nabor: Nabor = ZAPROS_PO_UMOLCHANIYU.nabor;
  const p = (q.get('p') ?? '')
    .split(',')
    .filter((x): x is PriyomId => x !== 'tablica' && estPriyom(x));
  const d = (q.get('d') ?? '')
    .split(',')
    .filter((x): x is Deystvie => (DEYSTVIYA as readonly string[]).includes(x));
  const t = q.get('t');
  if (p.length > 0) nabor = { tip: 'priyomy', ids: [...new Set(p)] };
  else if (d.length > 0) nabor = { tip: 'deystviya', ids: [...new Set(d)] };
  else if (t !== null) {
    const stroki = [...new Set(t.split(',').map(Number))]
      .filter((x) => Number.isInteger(x) && x >= 2 && x <= 10)
      .sort((a, b) => a - b);
    const o = q.get('o');
    nabor = {
      tip: 'tablica',
      stroki: stroki.length > 0 ? stroki : [2, 3, 4, 5, 6, 7, 8, 9],
      obratnaya: o === 'da' || o === 'smes' ? o : 'net',
      poryadok: q.get('po') === '1' ? 'po-poryadku' : 'vrazbros',
    };
  }
  const u = Number(q.get('u'));
  const lim = Number(q.get('lim'));
  const ege = q.get('ege');
  const nast: Nastroyki = {
    uroven: (u === 2 || u === 3 ? u : 1) as Uroven,
    desyatichnye: q.get('dec') !== '0',
    otricatelnye: q.get('otr') !== '0',
    predel: lim === 100 || lim === 1000 ? lim : null,
    ...(ege === 'men' || ege === 'bol' ? { ege } : {}),
  };
  return { nabor, rezhim: rezhimIz(q.get('r')) ?? ZAPROS_PO_UMOLCHANIYU.rezhim, nast, go };
}

/** Ключ набора для статистики и рекордов. */
export function naborKey(n: Nabor): string {
  switch (n.tip) {
    case 'priyomy':
      return `p:${[...n.ids].sort().join('+')}`;
    case 'deystviya':
      return `d:${[...n.ids].sort().join('+')}`;
    case 'tablica':
      return `t:${n.stroki.join('')}${n.obratnaya === 'net' ? '' : `:${n.obratnaya}`}`;
    case 'format':
      return `f:${n.id}`;
    case 'spisok':
      return 'o';
  }
}
