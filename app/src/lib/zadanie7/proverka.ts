/**
 * Независимый пересчёт ответа задания №7 — без решателя прототипа.
 *
 * Левая и правая части уравнения и ОДЗ берутся из `chisla(params)`:
 * это прямые формулы обычной арифметикой (Math.log, Math.sqrt, **).
 * Корни ищутся численно:
 *   — обычное уравнение: сетка с шагом 1/40 на [−1000; 1000], смена
 *     знака разности частей уточняется делением пополам; точка сетки,
 *     где части совпали, — тоже корень (касание, как у полного
 *     квадрата); найденная точка с большой разностью — полюс, не корень;
 *   — периодическое (тригонометрия): корни рациональны со знаменателем,
 *     делящим 12k, поэтому перебираются точки x = i/(24k) — от нуля
 *     вправо до первого корня (наименьший положительный) или влево
 *     (наибольший отрицательный).
 * Ответ по вопросу: единственный корень, меньший / больший из корней в
 * ОДЗ, наименьший положительный / наибольший отрицательный.
 */

import type { Chisla, Vopros } from './types';

const OKNO = 1000;
const SHAG = 1 / 40;

function raznost(ch: Chisla, x: number): number | null {
  if (!ch.odz(x)) {
    return null;
  }
  const l = ch.lhs(x);
  const r = ch.rhs(x);
  const g = l - r;
  return Number.isFinite(g) ? g : null;
}

function ravny(ch: Chisla, x: number): boolean {
  if (!ch.odz(x)) {
    return false;
  }
  const l = ch.lhs(x);
  const r = ch.rhs(x);
  return (
    Number.isFinite(l) &&
    Number.isFinite(r) &&
    Math.abs(l - r) <= 1e-9 * Math.max(1, Math.abs(l), Math.abs(r))
  );
}

/**
 * Части совпали в точке, но не рядом с ней: корень изолирован. Так
 * отсекаются «плато», где обе части ушли в машинный ноль (показательные
 * уравнения далеко слева).
 */
function sovpali(ch: Chisla, x: number, okrestnost = SHAG / 2): boolean {
  return ravny(ch, x) && !ravny(ch, x - okrestnost) && !ravny(ch, x + okrestnost);
}

/** Все корни непериодического уравнения на [−1000; 1000], по возрастанию. */
export function korniChislenno(ch: Chisla): number[] {
  const out: number[] = [];
  const dobavit = (x: number) => {
    const r = Math.round(x * 1e6) / 1e6;
    if (!out.some((y) => Math.abs(y - r) < 1e-6)) {
      out.push(r);
    }
  };
  const N = Math.round((2 * OKNO) / SHAG);
  let px = -OKNO;
  let pg = raznost(ch, px);
  if (sovpali(ch, px)) {
    dobavit(px);
  }
  for (let i = 1; i <= N; i += 1) {
    const x = -OKNO + i * SHAG;
    const g = raznost(ch, x);
    if (sovpali(ch, x)) {
      dobavit(x);
    } else if (g !== null && pg !== null && pg !== 0 && Math.sign(g) !== Math.sign(pg)) {
      /* Смена знака: уточняем делением пополам. */
      let lo = px;
      let hi = x;
      let glo = pg;
      for (let k = 0; k < 80; k += 1) {
        const mid = (lo + hi) / 2;
        const gm = raznost(ch, mid);
        if (gm === null) {
          break;
        }
        if (Math.sign(gm) === Math.sign(glo)) {
          lo = mid;
          glo = gm;
        } else {
          hi = mid;
        }
      }
      const xm = (lo + hi) / 2;
      const l = ch.lhs(xm);
      const r = ch.rhs(xm);
      if (ch.odz(xm) && Math.abs(l - r) <= 1e-6 * Math.max(1, Math.abs(l), Math.abs(r))) {
        dobavit(xm);
      }
    }
    px = x;
    pg = g;
  }
  return out.sort((a, b) => a - b);
}

/**
 * Нужный корень периодического уравнения перебором x = i/знам: от нуля
 * в сторону вопроса, не дальше `predel`.
 */
export function trigChislenno(ch: Chisla, v: Vopros, znam: number, predel = 400): number | null {
  const shag = v === 'maxOtr' ? -1 : 1;
  const N = Math.round(predel * znam);
  for (let i = 1; i <= N; i += 1) {
    const x = (shag * i) / znam;
    if (sovpali(ch, x, 1 / (2 * znam))) {
      return Math.round(x * 1e6) / 1e6;
    }
  }
  return null;
}

/** Ответ по вопросу из найденных численно корней; null — вопрос не однозначен. */
export function otvetChislenno(ch: Chisla, v: Vopros, znamTrig = 1): number | null {
  if (ch.periodicheskoe) {
    return trigChislenno(ch, v, znamTrig);
  }
  const k = korniChislenno(ch);
  if (k.length === 0) {
    return null;
  }
  if (v === 'koren') {
    return k.length === 1 ? (k[0] as number) : null;
  }
  if (v === 'menshiy') {
    return k[0] as number;
  }
  if (v === 'bolshiy') {
    return k[k.length - 1] as number;
  }
  return null;
}
