/**
 * Адрес листа №3 общего генератора: параметры, разбор и запись адреса,
 * подзаголовок, загрузка задач. Лёгкий модуль — его берёт экран
 * генератора сразу; сборку листа (list3.ts: чертежи, KaTeX) — только
 * по первому «Сгенерировать».
 */

import { SHEET_GEN_3 } from '@/content/generator3';
import { razobratSostav, sostavStroka } from '@/lib/generator/obshchiy/klyuchi';
import { SVOY_MAX } from '@/lib/generator/obshchiy/state';
import type { SourceId } from '@/lib/generator/obshchiy/types';
import type { Dannye03 } from '@/lib/variant/data/z03';

export type VidLista = 'uchenik' | 'uchitel' | 'vse';

export type VidRaboty3 = keyof typeof SHEET_GEN_3.vidy;

/** «Дополнительно» генератора: QR-код, вид работы, дата и учитель в шапке. */
export interface Dop3 {
  qr: boolean;
  /** Вид работы в шапке; null — «Задания для отработки». */
  vid: VidRaboty3 | null;
  /** Свой заголовок вместо вида работы из списка (vid — null). */
  svoy?: string;
  /** Дата на листе: «2026-10-24»; пусто — пустая линия. */
  data: string;
  uchitel: string;
  /** Чертежи — в ракурсе, как их повернули в предпросмотре (иначе — ракурс задачи). */
  kakVPrevyu?: boolean;
}

export const DOP_3: Dop3 = {
  qr: false,
  vid: null,
  data: '',
  uchitel: SHEET_GEN_3.head.author,
};

export interface SheetParams3 {
  istochnik: SourceId;
  /** Состав: прототип, сколько задач и ключ первой из них. */
  sostav: { id: string; n: number; k?: number }[];
  variants: number;
  seed: string;
  /** Замены: «вариант.ключ» («2.P03-19_0») → сколько раз заменяли. */
  zameny: Record<string, number>;
  /** Задачи привязаны к ключам позиций — у №3 всегда. */
  poKlyucham: true;
  theme: 'color' | 'print';
  dop: Dop3;
  /** Ракурсы чертежей из предпросмотра: «вариант.ключ» → [азимут, подъём]. */
  rakursy?: Record<string, [number, number]>;
}

export const VARIANTS_MAX_3 = 8;

/* ── Адрес ──────────────────────────────────────────────────────── */

const ISTOCHNIK_KOD: Record<SourceId, string> = { bank: 'b', mix: 'm', new: 'n' };
const PROTOTIP_RE = /P03-\d{2}/;

export function sheetQuery3(p: SheetParams3): string {
  const q = new URLSearchParams();
  q.set('i', ISTOCHNIK_KOD[p.istochnik]);
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
  if (d.uchitel !== DOP_3.uchitel) q.set('uch', d.uchitel);
  if (d.kakVPrevyu === true) {
    q.set('kp', '1');
    const rk = Object.entries(p.rakursy ?? {});
    if (rk.length > 0) q.set('rk', rk.map(([pos, [a, e]]) => `${pos}:${a}:${e}`).join(','));
  }
  return q.toString();
}

/** Строка из адреса: без разметки и не длиннее max. */
function chistyy(text: string, max: number): string {
  return text.replace(/[<>]/g, '').trim().slice(0, max);
}

/** Есть ли такой прототип — проверяет вызывающий: у листа нет банка. */
export function parseSheetQuery3(
  q: URLSearchParams,
  est: (id: string) => boolean = () => true,
): SheetParams3 {
  const i = q.get('i');
  const istochnik: SourceId = i === 'b' ? 'bank' : i === 'n' ? 'new' : 'mix';
  const v = Number(q.get('v') ?? '1');
  const zameny: Record<string, number> = {};
  for (const x of (q.get('z') ?? '').split(',')) {
    const m = /^(\d+\.P03-\d{2}_\d+):(\d+)$/.exec(x);
    if (m !== null) zameny[m[1] as string] = Math.min(50, Number(m[2]));
  }
  const vr = q.get('vr') ?? '';
  const vid = vr in SHEET_GEN_3.vidy ? (vr as VidRaboty3) : null;
  const vt = chistyy(q.get('vt') ?? '', SVOY_MAX);
  const d = q.get('d') ?? '';
  const kp = q.get('kp') === '1';
  const rakursy: Record<string, [number, number]> = {};
  for (const x of (q.get('rk') ?? '').split(',')) {
    const m = /^(\d+\.P03-\d{2}_\d+):(-?\d{1,3}):(-?\d{1,2})$/.exec(x);
    if (m !== null) rakursy[m[1] as string] = [Number(m[2]), Number(m[3])];
  }
  return {
    istochnik,
    sostav: razobratSostav(q.get('s') ?? '', true, PROTOTIP_RE, est),
    variants: Number.isInteger(v) ? Math.max(1, Math.min(VARIANTS_MAX_3, v)) : 1,
    seed: chistyy(q.get('seed') ?? '', 12) || '0000',
    zameny,
    poKlyucham: true,
    theme: q.get('t') === 'print' ? 'print' : 'color',
    dop: {
      qr: q.get('qr') === '1',
      vid,
      ...(vid === null && vt !== '' ? { svoy: vt } : {}),
      data: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '',
      uchitel: chistyy(q.get('uch') ?? '', 60) || DOP_3.uchitel,
      ...(kp ? { kakVPrevyu: true } : {}),
    },
    ...(kp && Object.keys(rakursy).length > 0 ? { rakursy } : {}),
  };
}

export function subtitleOf(p: SheetParams3): string {
  const vid = p.dop.vid;
  if (vid !== null) return SHEET_GEN_3.vidy[vid];
  return p.dop.svoy !== undefined && p.dop.svoy !== '' ? p.dop.svoy : SHEET_GEN_3.subtitle;
}

/* ── Данные ─────────────────────────────────────────────────────── */

let kesh: Promise<Dannye03> | null = null;

/**
 * Задачи №3 — тот же файл, что у «Собрать вариант»: грузится один раз,
 * при первой сборке листа. Сбой сети не застревает в кеше.
 */
export function zagruzitDannye3(): Promise<Dannye03> {
  if (kesh === null) {
    kesh = import('@/lib/dataUrl')
      .then(({ dataUrl }) => fetch(dataUrl('/variant/dannye/z03.json')))
      .then((r) => {
        if (!r.ok) throw new Error(`z03.json: ${r.status}`);
        return r.json() as Promise<Dannye03>;
      });
    kesh.catch(() => {
      kesh = null;
    });
  }
  return kesh;
}
