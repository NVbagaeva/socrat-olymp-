'use client';

/**
 * Данные задач тренажёра №3 в браузере: файл прототипа качается один
 * раз за визит (сбой сети в кеше не застревает), KaTeX для решений и
 * подсказок приезжает вместе с первым файлом.
 */

import type { Model } from '@/lib/solid/model';
import { dataUrl } from '@/lib/dataUrl';
import { ZADANIYA } from '@/lib/paths';
import { openText } from '../secret';
import type { PrototipDannye3, ShagTekst3, VariantDannye3 } from './dannye';
import { razobratKlyuch3 } from './session';

const FAYLY = new Map<string, Promise<PrototipDannye3>>();
const GOTOVYE = new Map<string, PrototipDannye3>();

let nabor: ((text: string) => string) | null = null;
let naborZhdyot: Promise<void> | null = null;

function zagruzitNabor(): Promise<void> {
  naborZhdyot ??= import('@/lib/tex').then(({ typeset }) => {
    nabor = typeset;
  });
  naborZhdyot.catch(() => {
    naborZhdyot = null;
  });
  return naborZhdyot;
}

/** Набрать текст с формулами $…$; пока KaTeX не приехал — как есть. */
export function nabrat(text: string): string {
  return nabor === null ? text : nabor(text);
}

export function adresPrototipa(prototip: string): string {
  return dataUrl(`${ZADANIYA}/3/dannye/prototip/${prototip}.json`);
}

function zagruzitPrototip(prototip: string): Promise<PrototipDannye3> {
  let zhdyot = FAYLY.get(prototip);
  if (zhdyot === undefined) {
    zhdyot = fetch(adresPrototipa(prototip)).then(async (r) => {
      if (!r.ok) throw new Error(`${prototip}.json: ${r.status}`);
      const dannye = (await r.json()) as PrototipDannye3;
      GOTOVYE.set(prototip, dannye);
      return dannye;
    });
    FAYLY.set(prototip, zhdyot);
    zhdyot.catch(() => {
      FAYLY.delete(prototip);
    });
  }
  return zhdyot;
}

/** Задача тренажёра: вариант прототипа с его данными. */
export interface Zadacha3 {
  id: string;
  prototip: string;
  variant: VariantDannye3;
  dannye: PrototipDannye3;
}

/** Загрузить задачи по ключам (и KaTeX): после этого zadachaIzKesha отдаёт их сразу. */
export async function zagruzitZadachi(ids: readonly string[]): Promise<void> {
  const prototipy = new Set(
    ids.flatMap((id) => {
      const k = razobratKlyuch3(id);
      return k === null ? [] : [k.prototip];
    }),
  );
  await Promise.all([zagruzitNabor(), ...[...prototipy].map(zagruzitPrototip)]);
}

/** Задача из уже загруженных; undefined — её файл ещё не приехал или такой задачи нет. */
export function zadachaIzKesha(id: string): Zadacha3 | undefined {
  const k = razobratKlyuch3(id);
  const dannye = k === null ? undefined : GOTOVYE.get(k.prototip);
  const variant = dannye?.variants.find((v) => v.n === k?.n);
  return k === null || dannye === undefined || variant === undefined
    ? undefined
    : { id, prototip: k.prototip, variant, dannye };
}

const MODELI = new WeakMap<VariantDannye3, Model>();

/** Модель чертежа задачи: разбирается один раз на вариант. */
export function modelZadachi(z: Zadacha3): Model {
  let m = MODELI.get(z.variant);
  if (m === undefined) {
    m = JSON.parse(z.variant.model ?? z.dannye.model) as Model;
    MODELI.set(z.variant, m);
  }
  return m;
}

/** Решение задачи: раскрывается её отпечатком. */
export function reshenieZadachi(z: Zadacha3): ShagTekst3[] {
  try {
    const value = JSON.parse(openText(z.variant.reshenie, z.variant.seal)) as unknown;
    return Array.isArray(value)
      ? value.filter(
          (item): item is ShagTekst3 =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as ShagTekst3).chto === 'string' &&
            typeof (item as ShagTekst3).formula === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

/** Подсказка-вопрос задачи текстом с формулами; null — её нет. */
export function podskazkaZadachi(z: Zadacha3): string | null {
  if (z.variant.podskazka === null) return null;
  try {
    return openText(z.variant.podskazka, z.variant.seal);
  } catch {
    return null;
  }
}
