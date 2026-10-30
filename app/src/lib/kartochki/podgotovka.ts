/**
 * Колода → готовые карточки для экрана. Работает на сборке: формулы
 * набирает KaTeX (lib/tex), чертежи рисуют движки номеров — в браузер
 * уходят только HTML и SVG, ни движков, ни KaTeX.
 *
 * Чертежи — существующие движки, своих рисунков здесь нет:
 *   — №1: lib/planimetriya (чертёж темы справочника по якорю или своя
 *     сцена), случайный поворот — вариант движка (variant.ts);
 *   — №2: lib/vektory (сцена теории по ключу или своя);
 *   — №3: lib/solid, экранная тема «стекло».
 */

import { plain, typesetKrupno } from '../tex';
import { chertezhTemy } from '../planimetriya/spravochnik-chertezhi';
import { renderPlan } from '../planimetriya/render';
import type { Optsii, Scena } from '../planimetriya/types';
import { renderVectorPlane } from '../vektory/render';
import { stsena } from '../vektory/stseny';
import { renderSolid } from '../solid/render';
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
  back: string;
  pochemu?: string;
  /**
   * Варианты чертежа (SVG). Один — чертёж как есть; несколько —
   * повороты, экран берёт случайный при каждом показе.
   */
  figury: string[];
  /** Чертёж на лицевой стороне (тип «чертёж») или на обороте. */
  figuraNaLitse: boolean;
  /** «Повторить теорию»: адрес фрагмента теории. Нет — карточка «добавлено». */
  teoriya?: string;
  verno?: boolean;
  otvet?: string;
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
  }
}

function adresTeorii(k: Kartochka, teoriya: string): string | undefined {
  return k.source === DOBAVLENO ? undefined : `${teoriya}#${k.source}`;
}

/** `base` — адрес раздела: «/zadaniya/1». */
export function podgotovit(koloda: Koloda, base: string): KolodaGotovaya {
  const teoriya = `${base}/${koloda.teoriya}`;
  return {
    task: koloda.task,
    title: koloda.title,
    podtemy: koloda.podtemy.map((t) => ({
      id: t.id,
      title: typesetKrupno(t.title),
      podpis: plain(t.title),
    })),
    kartochki: koloda.kartochki.map((k) => {
      const teoriyaHref = adresTeorii(k, teoriya);
      return {
        id: k.id,
        topic: k.topic,
        type: k.type,
        level: k.level,
        front: typesetKrupno(k.front),
        back: typesetKrupno(k.back),
        ...(k.pochemu === undefined ? {} : { pochemu: typesetKrupno(k.pochemu) }),
        figury: k.figure === undefined ? [] : narisovat(k.id, k.figure),
        figuraNaLitse: k.type === 'chertezh',
        ...(teoriyaHref === undefined ? {} : { teoriya: teoriyaHref }),
        ...(k.type === 'verno' ? { verno: k.verno } : {}),
        ...(k.type === 'vychislenie' ? { otvet: k.otvet } : {}),
      };
    }),
  };
}
