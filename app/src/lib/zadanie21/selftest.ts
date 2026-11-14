/**
 * Самотест движка задания «Наибольшее и наименьшее значение функции»:
 * у каждого прототипа сотни случайных задач, ответ каждой пересчитан
 * независимо — по самой функции, перебором точек (Chisla).
 *
 *   A — точка: на области поиска функция больше (меньше) всего именно
 *       в ответе, и это не край области (настоящий экстремум);
 *   B, V — значение: наибольшее (наименьшее) значение функции на
 *       отрезке совпадает с ответом.
 *
 * Плюс ответ годится для бланка (целое или конечная десятичная дробь,
 * не больше двух знаков) и в TeX нет мусора («+-», «1x», «NaN»).
 */

import { rngOf } from '@/lib/vychisleniya/rng';
import { BLOKI_OPORNYH21 } from './opornye';
import { PROTOTYPES } from './prototypes';
import { katalog21 } from './trening/katalog';
import { prototipKlyucha, zadachaPoKlyuchu } from './zadacha';
import { ekstremum, podpisChisla } from './shema';
import { funkciyaIzTex } from './texCalc';
import type { Params, Prototype } from './types';

export interface Oshibka {
  proto: string;
  seed: string;
  chto: string;
}

const SHAGOV = 20000;

function perebor(f: (x: number) => number, a: number, b: number, cel: 'max' | 'min') {
  let luchshiy = cel === 'max' ? -Infinity : Infinity;
  let gde = a;
  for (let i = 0; i <= SHAGOV; i += 1) {
    const x = a + ((b - a) * i) / SHAGOV;
    const y = f(x);
    if (!Number.isFinite(y)) continue;
    if (cel === 'max' ? y > luchshiy : y < luchshiy) {
      luchshiy = y;
      gde = x;
    }
  }
  return { luchshiy, gde };
}

/** Ответ бланка: целое или конечная дробь, до двух знаков, по модулю меньше 10 000. */
export function otvetBlanka(n: number): boolean {
  return (
    Number.isFinite(n) && Math.abs(n) < 10000 && Math.abs(Math.round(n * 100) - n * 100) < 1e-6
  );
}

const MUSOR = /\+-|-\+|--|(^|[^0-9.,}])1x|NaN|undefined|Infinity|\$\$/;

export function proverit(proto: Prototype, p: Params, seed: string): Oshibka[] {
  const out: Oshibka[] = [];
  const ploho = (chto: string) => out.push({ proto: proto.id, seed, chto });
  let s;
  try {
    s = proto.solve(p);
  } catch (e) {
    ploho(`решение упало: ${String(e)}`);
    return out;
  }
  if (!otvetBlanka(s.answer)) ploho(`ответ не для бланка: ${s.answer}`);
  const teksty = [
    proto.uslovie(p),
    s.funkciya,
    s.proizvodnaya ?? '',
    ...s.etapy.flatMap((e) => e.lines),
  ];
  for (const t of teksty) if (MUSOR.test(t)) ploho(`мусор в TeX: «${t.slice(0, 120)}»`);
  /* Схема знаков: промежутков столько же, сколько знаков; в точке ответа — нужный экстремум. */
  for (const e of s.etapy) {
    if (e.shema === undefined) continue;
    const sh = e.shema;
    const prom = sh.tochki.length - 1 + (sh.luchLevo ? 1 : 0) + (sh.luchPravo ? 1 : 0);
    if (prom !== sh.znaki.length) ploho(`схема: промежутков ${prom}, знаков ${sh.znaki.length}`);
  }
  const c = proto.chisla(p);
  /* Сложная функция (вид 7) решается без производной — схемы знаков у неё нет. */
  if (proto.vid !== 7) {
    const sh = s.etapy.find((e) => e.shema !== undefined)?.shema;
    if (sh === undefined) ploho('нет схемы знаков производной');
    else if (proto.vopros === 'A') {
      const i = sh.tochki.findIndex((t) => t.podpis === podpisChisla(s.answer));
      if (i === -1 || ekstremum(sh, i) !== c.cel)
        ploho(`схема: у точки ответа ${s.answer} нет подписи ${c.cel}`);
    }
  }
  const [a, b] = c.otrezok;
  /* Формула на экране — та же функция, что в расчёте. */
  try {
    const g = funkciyaIzTex(s.funkciya);
    let sverok = 0;
    for (let i = 1; i < 40; i += 1) {
      const x = a + ((b - a) * i) / 40;
      const u = c.f(x);
      const v = g(x);
      if (!Number.isFinite(u)) continue;
      sverok += 1;
      if (!(Math.abs(u - v) <= 1e-6 * Math.max(1, Math.abs(u)))) {
        ploho(
          `формула на экране не та: при x = ${x.toFixed(4)} по TeX ${v}, по расчёту ${u} — «${s.funkciya}»`,
        );
        break;
      }
    }
    if (sverok < 10) ploho(`формулу почти негде сверить: точек ${sverok}`);
  } catch (e) {
    ploho(`формулу на экране не прочитать: ${String(e)} — «${s.funkciya}»`);
  }
  const { luchshiy, gde } = perebor(c.f, a, b, c.cel);
  const shag = (b - a) / SHAGOV;
  if (c.chto === 'tochka') {
    if (Math.abs(gde - s.answer) > 2 * shag + 1e-9) {
      ploho(
        `точка ${c.cel}: перебор даёт ${gde.toFixed(4)}, ответ ${s.answer} (область [${a.toFixed(3)}; ${b.toFixed(3)}])`,
      );
    }
    if (Math.abs(gde - a) < 3 * shag || Math.abs(gde - b) < 3 * shag) {
      ploho(`точка ${c.cel} на краю области поиска — не экстремум: ${gde}`);
    }
  } else {
    const dop = Math.max(1e-6, Math.abs(luchshiy) * 1e-7);
    /* Перебор по сетке может чуть не дойти до вершины — допуск по второй производной. */
    const blizko =
      Math.abs(luchshiy - s.answer) <= Math.max(dop, 1e-4 * Math.max(1, Math.abs(s.answer)));
    if (!blizko) ploho(`значение ${c.cel}: перебор даёт ${luchshiy}, ответ ${s.answer}`);
    if (c.cel === 'max' ? luchshiy > s.answer + dop : luchshiy < s.answer - dop) {
      ploho(`значение ${c.cel}: найдено лучше ответа — ${luchshiy} против ${s.answer}`);
    }
  }
  return out;
}

/** Все прототипы, по n задач. */
export function selftest(n = 300): {
  proverok: number;
  oshibki: Oshibka[];
  poProto: Record<string, number>;
} {
  const oshibki: Oshibka[] = [];
  const poProto: Record<string, number> = {};
  let proverok = 0;
  for (const proto of PROTOTYPES) {
    const otvety = new Set<number>();
    for (let i = 0; i < n; i += 1) {
      const seed = `selftest-${proto.id}-${i}`;
      const p = proto.gen(rngOf(seed));
      oshibki.push(...proverit(proto, p, seed));
      try {
        otvety.add(proto.solve(p).answer);
      } catch {
        /* уже записано */
      }
      proverok += 1;
    }
    poProto[proto.id] = otvety.size;
  }
  return { proverok, oshibki, poProto };
}

/** Каждая задача каталога тренажёра и пример «О задании» строятся и сходятся. */
export function selftestKataloga(): Oshibka[] {
  const out: Oshibka[] = [];
  const klyuchi = Object.values(katalog21()).flatMap((k) => k.a);
  for (const id of [...klyuchi, ...PROTOTYPES.map((p) => `${p.id}|primer`)]) {
    try {
      const z = zadachaPoKlyuchu(id);
      out.push(...proverit(z.proto, z.params, id));
    } catch (e) {
      out.push({ proto: prototipKlyucha(id), seed: id, chto: `не строится: ${String(e)}` });
    }
  }
  return out;
}

/** Опорные задачи: десять в каждом блоке, ответ сходится с независимым пересчётом. */
export function selftestOpornyh(): Oshibka[] {
  const out: Oshibka[] = [];
  const idy = new Set<string>();
  for (const b of BLOKI_OPORNYH21) {
    if (b.zadachi.length !== 10)
      out.push({ proto: b.slug, seed: '', chto: `задач ${b.zadachi.length}, нужно 10` });
    for (const z of b.zadachi) {
      if (idy.has(z.id)) out.push({ proto: b.slug, seed: z.id, chto: 'повтор id' });
      idy.add(z.id);
      const v = z.proverka();
      if (!(Math.abs(v - z.answer) < 1e-6))
        out.push({
          proto: b.slug,
          seed: z.id,
          chto: `ответ ${z.answer}, пересчёт ${v} — «${z.uslovie}»`,
        });
      if (!otvetBlanka(z.answer))
        out.push({ proto: b.slug, seed: z.id, chto: `ответ не для бланка: ${z.answer}` });
      for (const t of [z.uslovie, ...z.razbor])
        if (MUSOR.test(t)) out.push({ proto: b.slug, seed: z.id, chto: `мусор: «${t}»` });
    }
    const raznyh = new Set(b.zadachi.map((z) => z.uslovie)).size;
    if (raznyh < 10)
      out.push({ proto: b.slug, seed: '', chto: `одинаковых условий: ${10 - raznyh}` });
  }
  return out;
}
