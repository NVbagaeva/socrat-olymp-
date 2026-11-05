/**
 * Результат тренировки ↔ строка для ссылки.
 *
 * Ссылка вида /rezultat/#1.<сумма>.<данные>: всё после «#» браузер
 * на сервер не отправляет, поэтому результат не попадает ни в логи
 * хостинга, ни куда-либо ещё — только в мессенджер, где ученик
 * переслал ссылку.
 *
 *  - данные: результат в компактном виде (массивы вместо объектов,
 *    повторяющиеся названия — словарём), сжатый lz-string в алфавит,
 *    безопасный для адреса;
 *  - сумма: FNV-1a от несжатой строки — испорченная при пересылке
 *    ссылка (обрезанная, с лишним символом) не откроется с чужими
 *    цифрами, а покажет «Ссылка повреждена».
 *
 * Это защита от случайной порчи, а не от подделки: результат собран в
 * браузере ученика, и страница учителя так и пишет.
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Otchet, OtchetItog, OtchetZadacha } from './types';

const VERSIYA = '1';

const ITOG_V_KOD: Record<OtchetItog, string> = {
  right: 'r',
  wrong: 'w',
  hinted: 'h',
  skipped: 's',
};
const KOD_V_ITOG: Record<string, OtchetItog> = {
  r: 'right',
  w: 'wrong',
  h: 'hinted',
  s: 'skipped',
};

/** Ограничения разумного: ни одна тренировка до них не дотягивает. */
const MAX_ZADACH = 200;
const MAX_STROKA = 300;

/** FNV-1a, 32 бита, в 36-ричной записи. */
export function summa(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Индекс строки в словаре: новая строка дописывается. */
function vSlovar(slovar: string[], s: string): number {
  const i = slovar.indexOf(s);
  if (i !== -1) return i;
  slovar.push(s);
  return slovar.length - 1;
}

type ZadachaKod = [number, number, string, string, string, string];

/** Результат → компактный JSON. */
function vMassiv(o: Otchet): unknown[] {
  const slovar: string[] = [];
  const zadachi: ZadachaKod[] = o.zadachi.map((z) => [
    vSlovar(slovar, z.tip),
    vSlovar(slovar, z.tema),
    ITOG_V_KOD[z.itog],
    z.istochnik ?? '',
    z.otvet ?? '',
    z.tipId ?? '',
  ]);
  return [
    o.imya,
    o.nomer ?? 0,
    o.razdel,
    Math.round(o.vremya / 1000),
    Math.round(o.sekund),
    o.rezhim ?? '',
    o.put ?? '',
    slovar,
    zadachi,
  ];
}

function stroka(x: unknown, max = MAX_STROKA): string | null {
  return typeof x === 'string' && x.length <= max ? x : null;
}

function chislo(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
}

/** Компактный JSON → результат. Любое несоответствие — null. */
function izMassiva(raw: unknown): Otchet | null {
  if (!Array.isArray(raw) || raw.length !== 9) return null;
  const [imya, nomer, razdel, vremya, sekund, rezhim, put, slovar, zadachi] = raw as unknown[];
  const imyaS = stroka(imya, 120);
  const nomerN = chislo(nomer);
  const razdelS = stroka(razdel);
  const vremyaN = chislo(vremya);
  const sekundN = chislo(sekund);
  const rezhimS = stroka(rezhim);
  const putS = stroka(put);
  if (
    imyaS === null ||
    imyaS.trim() === '' ||
    nomerN === null ||
    !Number.isInteger(nomerN) ||
    nomerN > 99 ||
    razdelS === null ||
    vremyaN === null ||
    sekundN === null ||
    rezhimS === null ||
    putS === null ||
    !Array.isArray(slovar) ||
    !Array.isArray(zadachi) ||
    zadachi.length === 0 ||
    zadachi.length > MAX_ZADACH
  ) {
    return null;
  }
  const slova: string[] = [];
  for (const s of slovar as unknown[]) {
    const x = stroka(s);
    if (x === null) return null;
    slova.push(x);
  }
  const spisok: OtchetZadacha[] = [];
  for (const z of zadachi as unknown[]) {
    if (!Array.isArray(z) || z.length !== 6) return null;
    const [tip, tema, itog, ist, otvet, tipId] = z as unknown[];
    const tipS = typeof tip === 'number' ? slova[tip] : undefined;
    const temaS = typeof tema === 'number' ? slova[tema] : undefined;
    const itogS = typeof itog === 'string' ? KOD_V_ITOG[itog] : undefined;
    const istS = stroka(ist, 60);
    const otvetS = stroka(otvet, 60);
    const tipIdS = stroka(tipId, 60);
    if (
      tipS === undefined ||
      temaS === undefined ||
      itogS === undefined ||
      istS === null ||
      otvetS === null ||
      tipIdS === null
    ) {
      return null;
    }
    spisok.push({
      tip: tipS,
      tema: temaS,
      itog: itogS,
      ...(istS === '' ? {} : { istochnik: istS }),
      ...(otvetS === '' ? {} : { otvet: otvetS }),
      ...(tipIdS === '' ? {} : { tipId: tipIdS }),
    });
  }
  return {
    imya: imyaS,
    nomer: nomerN === 0 ? null : nomerN,
    razdel: razdelS,
    vremya: vremyaN * 1000,
    sekund: sekundN,
    ...(rezhimS === '' ? {} : { rezhim: rezhimS }),
    ...(putS === '' ? {} : { put: putS }),
    zadachi: spisok,
  };
}

/** Результат → часть ссылки после «#». */
export function zakodirovat(o: Otchet): string {
  const json = JSON.stringify(vMassiv(o));
  return `${VERSIYA}.${summa(json)}.${compressToEncodedURIComponent(json)}`;
}

export type Raskodirovano =
  { status: 'ok'; otchet: Otchet } | { status: 'pusto' } | { status: 'povrezhdena' };

/** Часть ссылки после «#» (с решёткой или без) → результат. */
export function raskodirovat(hash: string): Raskodirovano {
  const h = hash.replace(/^#/, '').trim();
  if (h === '') return { status: 'pusto' };
  const parts = h.split('.');
  if (parts.length !== 3 || parts[0] !== VERSIYA) return { status: 'povrezhdena' };
  const [, sum = '', data = ''] = parts;
  let json: string | null;
  try {
    json = decompressFromEncodedURIComponent(data);
  } catch {
    json = null;
  }
  if (json === null || json === '' || summa(json) !== sum) return { status: 'povrezhdena' };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { status: 'povrezhdena' };
  }
  const otchet = izMassiva(raw);
  return otchet === null ? { status: 'povrezhdena' } : { status: 'ok', otchet };
}

/** Адрес тренажёра из ссылки — только свой и только раздел заданий. */
export function bezopasnyyPut(put: string | undefined): string | null {
  if (put === undefined) return null;
  return /^\/zadaniya\/[a-z0-9/-]+\/$/.test(put) && !put.includes('//') ? put : null;
}
