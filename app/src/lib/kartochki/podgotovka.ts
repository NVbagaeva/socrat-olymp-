/**
 * Колода → готовые карточки для экрана. Работает на сборке: формулы
 * набирает KaTeX (lib/tex), чертежи рисуют движки номеров — в браузер
 * уходят только HTML и SVG, ни движков, ни KaTeX.
 *
 * Чертежи — существующие движки, своих рисунков здесь нет:
 *   — №1: lib/planimetriya (чертёж темы справочника по якорю или своя
 *     сцена), случайный поворот — вариант движка (variant.ts);
 *   — №2: lib/vektory (сцена теории по ключу или своя);
 *   — №3: lib/solid, экранная тема «стекло»;
 *   — №4 и №5: диаграммы Эйлера и лучи на прямой
 *     (lib/veroyatnost/risunkiKartochek) — классы и геометрия теории.
 *   — №18: lib/skhemy (живые ключевые схемы), неподвижный SVG того же
 *     вида (lib/skhemy/svg.ts): случайное положение, поворот, отражение;
 *   — №6: диаграмма Эйлера с точками — раскладка и классы теории
 *     (lib/zadanie6/risunkiKartochek);
 *   — №7: движок чертежей lib/graph (единичная окружность);
 *   — №9: движок графиков lib/proizvodnaya (render.ts) в режиме ученика —
 *     без треугольников, пунктиров и знаков на промежутках.
 */

import { renderGraph } from '../graph/renderer.js';
import { eilerSvg } from '../zadanie6/risunkiKartochek';
import { renderFigura } from '../proizvodnaya/render';

import { parseAnswer } from '../answer';
import { plain, typesetKrupno } from '../tex';
import { chertezhTemy } from '../planimetriya/spravochnik-chertezhi';
import { renderPlan } from '../planimetriya/render';
import type { Optsii, Scena } from '../planimetriya/types';
import { renderVectorPlane } from '../vektory/render';
import { stsena } from '../vektory/stseny';
import { renderSolid } from '../solid/render';
import { risunokVeroyatnosti } from '../veroyatnost/risunkiKartochek';
import { svgSkhemy } from '../skhemy/svg';
import { VID_ISHODNYY, type Vid } from '../skhemy/tipy';
import { otpechatok, VERNO, NEVERNO } from './otvet';
import {
  DOBAVLENO,
  type FiguraKartochki,
  type Kartochka,
  type Koloda,
  type TipKartochki,
} from './tipy';

/** Карточка, готовая к показу: всё уже набрано и нарисовано. */
export interface KartochkaGotovaya {
  id: string;
  topic: string;
  type: TipKartochki;
  level: string;
  front: string;
  /**
   * Обратная сторона. У карточек с автопроверкой — пусто: текст лежит
   * в `zakryto` и открывается после ответа.
   */
  back: string;
  pochemu?: string;
  /** Текст оборота карточки с автопроверкой, зашифрованный JSON {back, pochemu}. */
  zakryto?: string;
  /**
   * Варианты чертежа (SVG). Один — чертёж как есть; несколько —
   * повороты, экран берёт случайный при каждом показе.
   */
  figury: string[];
  /**
   * Чертёж оборота, если он отличается от лицевого (у ключевых схем на
   * лицевой стороне нет букв, на обороте есть): тот же номер варианта.
   */
  figuryOborota?: string[];
  /**
   * Чертёж на лицевой стороне или на обороте. На лицевой — у «чертежа» и
   * у карточек с автопроверкой: там рисунок — часть условия (график №9,
   * по которому считают ответ). У «формулы» и «свойства» — на обороте.
   */
  figuraNaLitse: boolean;
  /** «Повторить теорию»: адрес фрагмента теории. Нет — карточка «добавлено». */
  teoriya?: string;
  /** Фрагмент — в теории другого номера (№5 → №4): номер для подписи ссылки. */
  teoriyaNomer?: number;
  /** Отпечаток ответа: «верно / неверно» или число. */
  otpechatok?: string;
}

export interface KolodaGotovaya {
  task: number;
  title: string;
  /** Подтемы: title — HTML с формулами, podpis — тот же текст словами (aria). */
  podtemy: { id: string; title: string; podpis: string }[];
  kartochki: KartochkaGotovaya[];
}

/** Поворотов на карточку: экран выбирает один случайно. */
const POVOROTOV = 4;

/* Повороты по id карточки: сборка детерминирована, рисунки одни и те же. */
function povoroty(id: string): number[] {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const start = h % 90;
  return Array.from({ length: POVOROTOV }, (_, i) => ((start + i * 97) % 360) - 180);
}

const RAZMER = { shirina: 260, vysota: 170 };

function plan(scena: Scena, optsii: Optsii, povorot: number): string {
  return renderPlan(scena, {
    ...optsii,
    ...RAZMER,
    variant: { povorot, otrazhenie: false, bukvy: {} },
  });
}

/* Детерминированный генератор по id карточки: положения схем на сборке одни и те же. */
function zerno(id: string, i: number): () => number {
  let a = 2166136261 ^ (i * 0x9e3779b9);
  for (const c of id) a = Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAZMER_SKHEMY = { W: 360, H: 250 };

function skhemy(id: string, f: Extract<FiguraKartochki, { dvizhok: 'skhema' }>, bukvy: boolean) {
  const sk = f.skhema();
  const sost = { lit: new Set<string>(), shag: null, podpisi: bukvy };
  if (f.povorot !== true) {
    return [
      obertka(
        `<span class="skh">${svgSkhemy(sk, sk.nachalo, VID_ISHODNYY, sost, { ...RAZMER_SKHEMY, opisanie: f.alt })}</span>`,
        'skhema',
      ),
    ];
  }
  return Array.from({ length: POVOROTOV }, (_, i) => {
    const rnd = zerno(id, i);
    const t = sk.sluchaynaya(rnd);
    const vid: Vid = { ugol: Math.round(rnd() * 360), otrazhenie: rnd() < 0.5 ? -1 : 1 };
    return obertka(
      `<span class="skh">${svgSkhemy(sk, t, vid, sost, { ...RAZMER_SKHEMY, opisanie: f.alt })}</span>`,
      'skhema',
    );
  });
}

/** Чертёж оборота, если у движка он свой (у схем — с буквами); иначе undefined. */
export function narisovatOborot(id: string, f: FiguraKartochki): string[] | undefined {
  if ('svg' in f || f.dvizhok !== 'skhema') return undefined;
  const bukvy = f.bukvy === true;
  const naOborote = f.bukvyNaOborote ?? bukvy;
  return naOborote === bukvy ? undefined : skhemy(id, f, naOborote);
}

/* Перевод строки в тексте карточки — новая строка. */
function stroki(text: string): string {
  const chasti = text.split('\n');
  if (chasti.length === 1) return typesetKrupno(text);
  return chasti.map((c) => `<span class="kart-stroka">${typesetKrupno(c)}</span>`).join('');
}

function obertka(svg: string, dvizhok: string): string {
  return `<span class="kart-fig kart-fig--${dvizhok}">${svg}</span>`;
}

export function narisovat(id: string, f: FiguraKartochki): string[] {
  if ('svg' in f) {
    return [obertka(`<img src="${f.svg}" alt="${f.alt.replace(/"/g, '&quot;')}" />`, 'svg')];
  }
  switch (f.dvizhok) {
    case 'plan': {
      const ch = chertezhTemy(f.tema);
      const risunki = Array.isArray(ch) ? ch : [ch];
      const ugly = f.povorot === true ? povoroty(id) : [0];
      return ugly.map((u) =>
        obertka(
          risunki.map((r) => `<span class="pl-wrap">${plan(r.scena, r.optsii, u)}</span>`).join(''),
          'plan',
        ),
      );
    }
    case 'plan-scena': {
      const optsii: Optsii = { rezhim: { rezhim: 'uchitel' }, chisla: true, alt: f.alt };
      const ugly = f.povorot === true ? povoroty(id) : [0];
      return ugly.map((u) =>
        obertka(`<span class="pl-wrap">${plan(f.scena(), optsii, u)}</span>`, 'plan'),
      );
    }
    case 'vektory': {
      const config = typeof f.stsena === 'string' ? stsena(f.stsena) : f.stsena;
      return [obertka(`<span class="vp-wrap">${renderVectorPlane(config)}</span>`, 'vektory')];
    }
    case 'solid':
      return [obertka(renderSolid(f.model(), { tema: 'ekran' }), 'solid')];
    case 'veroyatnost':
      return [obertka(risunokVeroyatnosti(id, f.risunok), 'veroyatnost')];
    case 'skhema':
      return skhemy(id, f, f.bukvy === true);
    case 'zadanie6':
      return [obertka(eilerSvg(f.ris), 'zadanie6')];
    case 'graph':
      return [obertka(renderGraph(f.scena()) as string, 'graph')];
    case 'proizvodnaya':
      return [obertka(renderFigura(f.fig(), { rezhim: 'student' }), 'proizvodnaya')];
  }
}

/**
 * `base` — адрес раздела («/zadaniya/5»). У колоды со страницами теории
 * (`stranitsa`, №18) — адрес страницы; иначе фрагмент вкладки «Теория».
 * Фрагмент в теории другого номера — в соседнем разделе: /zadaniya/4/teoriya/#….
 */
function adresTeorii(k: Kartochka, koloda: Koloda, base: string): string | undefined {
  if (k.source === DOBAVLENO) return undefined;
  if (koloda.stranitsa !== undefined) return `${base}/${koloda.stranitsa(k.source)}`;
  const razdel =
    k.teoriyaNomera === undefined ? base : base.replace(/\/[^/]+$/, `/${k.teoriyaNomera}`);
  return `${razdel}/${koloda.teoriya}#${k.source}`;
}

/** Ответ вычисления как число: по записи ЕГЭ, которую проверяет scripts/verify_cards. */
function otvetChislo(k: Kartochka & { type: 'vychislenie' }): number {
  const chislo = parseAnswer(k.otvet);
  if (chislo === null) throw new Error(`карточка ${k.id}: ответ «${k.otvet}» не число`);
  return chislo;
}

/** `base` — адрес раздела: «/zadaniya/1». */
export function podgotovit(koloda: Koloda, base: string): KolodaGotovaya {
  return {
    task: koloda.task,
    title: koloda.title,
    podtemy: koloda.podtemy.map((t) => ({
      id: t.id,
      title: typesetKrupno(t.title),
      podpis: plain(t.title),
    })),
    kartochki: koloda.kartochki.map((k) => {
      const teoriyaHref = adresTeorii(k, koloda, base);
      const figOborota = k.figure === undefined ? undefined : narisovatOborot(k.id, k.figure);
      const avto = k.type === 'verno' || k.type === 'vychislenie';
      const oborot = {
        back: stroki(k.back),
        ...(k.pochemu === undefined ? {} : { pochemu: typesetKrupno(k.pochemu) }),
      };
      return {
        id: k.id,
        topic: k.topic,
        type: k.type,
        level: k.level,
        front: stroki(k.front),
        ...(avto
          ? { back: '', zakryto: otpechatok.sealText(JSON.stringify(oborot), k.id) }
          : oborot),
        figury: k.figure === undefined ? [] : narisovat(k.id, k.figure),
        ...(figOborota === undefined ? {} : { figuryOborota: figOborota }),
        figuraNaLitse: k.type === 'chertezh' || k.type === 'vychislenie' || k.type === 'verno',
        ...(teoriyaHref === undefined ? {} : { teoriya: teoriyaHref }),
        ...(teoriyaHref !== undefined && k.teoriyaNomera !== undefined
          ? { teoriyaNomer: k.teoriyaNomera }
          : {}),
        ...(k.type === 'verno'
          ? { otpechatok: otpechatok.sealChoice(k.verno ? VERNO : NEVERNO) }
          : {}),
        ...(k.type === 'vychislenie' ? { otpechatok: otpechatok.sealAnswer(otvetChislo(k)) } : {}),
      };
    }),
  };
}
