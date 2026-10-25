import type { KitScope } from '@/lib/komplekt';

/**
 * Генератор v2: один экран для всех разделов, раздел подключается
 * конфигом (docs/13-economics/02-design.md, § 5.6). Первым его берёт
 * №13; остальные разделы переводятся по одному PR на раздел.
 *
 * Состояние экрана — объект раздела с обязательными полями состава,
 * seed и замен; остальные поля (уровень, вид листа, заголовок …)
 * экран меняет по ключам из конфига, не зная их смысла.
 */
export interface GenStateV2 {
  sostav: Partial<Record<string, number>>;
  variants: number;
  seed: string;
  zameny: Record<string, number>;
}

/** Строка шага «Что»: тип задач со счётчиком «− N +». */
export interface GenKindV2 {
  id: string;
  label: string;
  note: string;
  /** Минут на задачу — для итога «≈ N минут». */
  minut: number;
  max: number;
}

export interface GenPresetV2<S> {
  id: string;
  label: string;
  note: string;
  /** Пресет заполняет все шаги: из текущего состояния — новое. */
  apply: (s: S) => S;
}

/** Переключатель-сегменты: уровень, источник, вид листа … */
export interface GenSegmentV2<S> {
  key: keyof S & string;
  label: string;
  note?: string;
  options: readonly { id: string; label: string }[];
  /** Выбор учителя переживает смену пресета: пресет это поле больше не меняет. */
  rucnoe?: true;
  /** Предупреждение под полем при таком состоянии; null — нет. */
  preduprezhdenie?: (s: S) => string | null;
}

/** Поле «Дополнительно»: текст, число из списка или сегменты. */
export type GenDopV2<S> =
  | { kind: 'text'; key: keyof S & string; label: string; maxLength: number }
  | { kind: 'number'; key: keyof S & string; label: string; options: readonly number[] }
  | ({ kind: 'segment' } & GenSegmentV2<S>);

/** Задача предпросмотра: условие и (для учителя) ответ с решением. */
export interface GenPreviewTaskV2 {
  pos: string;
  no: number;
  kindLabel: string;
  html: string;
  teacherHtml: string;
  badge: string | null;
}

export interface GenTextsV2 {
  bystryy: string;
  bystryyNote: string;
  chto: string;
  chtoNote: string;
  vsemPo: (n: number) => string;
  ochistit: string;
  vListe: (n: number) => string;
  minut: (n: number) => string;
  kak: string;
  kakNote: string;
  dop: string;
  shag3: string;
  sgenerirovat: string;
  gotovim: string;
  uchenik: string;
  uchitelTab: string;
  zamenit: string;
  variant: string;
  ssylka: string;
  ssylkaGotova: string;
  onlayn: string;
  qr: string;
  pusto: string;
  predprosmotr: string;
  predprosmotrNote: string;
}

export interface GeneratorConfigV2<S extends GenStateV2> {
  scope: KitScope;
  /** Экран генератора: адрес вкладки, у каждого свой текущий комплект. */
  slot: string;
  /** Раздел в «Моих комплектах»: «№13 · Экономические задачи». */
  section: string;
  kinds: readonly GenKindV2[];
  presets: readonly GenPresetV2<S>[];
  segments: readonly GenSegmentV2<S>[];
  dop: readonly GenDopV2<S>[];
  initial: S;
  texts: GenTextsV2;
  /** Предпросмотр по состоянию: задачи по вариантам. Движок грузится по требованию. */
  preview: (s: S) => Promise<GenPreviewTaskV2[][]>;
  /** Адреса листов и онлайн-набора по состоянию (seed уже в нём). */
  hrefs: (s: S) => { student: string; teacher: string; online: string | null };
  /** QR онлайн-набора: разметка SVG; null — без QR. */
  qr?: (url: string) => string;
}
