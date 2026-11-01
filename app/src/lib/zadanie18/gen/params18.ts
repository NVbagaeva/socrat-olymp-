/**
 * Адрес листа №18 общего генератора: параметры, разбор и запись адреса,
 * подзаголовок. Лёгкий модуль — его берёт экран генератора сразу.
 * Устройство — как у №3 (lib/zadanie3/gen/params3.ts).
 */

import { SHEET_GEN_18 } from '@/content/generator18';
import { razobratSostav, sostavStroka } from '@/lib/generator/obshchiy/klyuchi';
import { SVOY_MAX } from '@/lib/generator/obshchiy/state';

export type VidLista = 'uchenik' | 'uchitel' | 'vse';

export type VidRaboty18 = keyof typeof SHEET_GEN_18.vidy;

/** «Дополнительно» генератора: QR-код, вид работы, дата и учитель в шапке. */
export interface Dop18 {
  qr: boolean;
  /** Вид работы в шапке; null — «Задания для отработки». */
  vid: VidRaboty18 | null;
  /** Свой заголовок вместо вида работы из списка (vid — null). */
  svoy?: string;
  /** Дата на листе: «2026-10-24»; пусто — пустая линия. */
  data: string;
  uchitel: string;
}

export const DOP_18: Dop18 = {
  qr: false,
  vid: null,
  data: '',
  uchitel: SHEET_GEN_18.head.author,
};

export interface SheetParams18 {
  /** Состав: тип задачи, сколько задач и ключ первой из них. */
  sostav: { id: string; n: number; k?: number }[];
  variants: number;
  seed: string;
  /** Замены: «вариант.ключ» («2.bis-par_0») → сколько раз заменяли. */
  zameny: Record<string, number>;
  theme: 'color' | 'print';
  dop: Dop18;
}

export const VARIANTS_MAX_18 = 6;

/** Тип задачи в адресе: латиница, цифры и дефис. */
const TIP_RE = /[a-z][a-z0-9-]*/;

export function sheetQuery18(p: SheetParams18): string {
  const q = new URLSearchParams();
  q.set('s', sostavStroka(p.sostav));
  if (p.variants > 1) q.set('v', String(p.variants));
  q.set('seed', p.seed);
  const z = Object.entries(p.zameny).filter(([, k]) => k > 0);
  if (z.length > 0) q.set('z', z.map(([pos, k]) => `${pos}:${k}`).join(','));
  if (p.theme === 'print') q.set('t', 'print');
  const d = p.dop;
  if (d.qr) q.set('qr', '1');
  if (d.vid !== null) q.set('vr', d.vid);
  else if (d.svoy !== undefined && d.svoy !== '') q.set('vt', d.svoy);
  if (d.data !== '') q.set('d', d.data);
  if (d.uchitel !== DOP_18.uchitel) q.set('uch', d.uchitel);
  return q.toString();
}

/** Строка из адреса: без разметки и не длиннее max. */
function chistyy(text: string, max: number): string {
  return text.replace(/[<>]/g, '').trim().slice(0, max);
}

export function parseSheetQuery18(
  q: URLSearchParams,
  est: (id: string) => boolean = () => true,
): SheetParams18 {
  const v = Number(q.get('v') ?? '1');
  const zameny: Record<string, number> = {};
  for (const x of (q.get('z') ?? '').split(',')) {
    const m = /^(\d+\.[a-z][a-z0-9-]*_\d+):(\d+)$/.exec(x);
    if (m !== null) zameny[m[1] as string] = Math.min(50, Number(m[2]));
  }
  const vr = q.get('vr') ?? '';
  const vid = vr in SHEET_GEN_18.vidy ? (vr as VidRaboty18) : null;
  const vt = chistyy(q.get('vt') ?? '', SVOY_MAX);
  const d = q.get('d') ?? '';
  return {
    sostav: razobratSostav(q.get('s') ?? '', true, TIP_RE, est),
    variants: Number.isInteger(v) ? Math.max(1, Math.min(VARIANTS_MAX_18, v)) : 1,
    seed: chistyy(q.get('seed') ?? '', 12) || '0000',
    zameny,
    theme: q.get('t') === 'print' ? 'print' : 'color',
    dop: {
      qr: q.get('qr') === '1',
      vid,
      ...(vid === null && vt !== '' ? { svoy: vt } : {}),
      data: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '',
      uchitel: chistyy(q.get('uch') ?? '', 60) || DOP_18.uchitel,
    },
  };
}

export function subtitleOf18(p: SheetParams18): string {
  const vid = p.dop.vid;
  if (vid !== null) return SHEET_GEN_18.vidy[vid];
  return p.dop.svoy !== undefined && p.dop.svoy !== '' ? p.dop.svoy : SHEET_GEN_18.subtitle;
}
