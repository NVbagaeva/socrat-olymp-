/**
 * Разбор пункта б задания №14 — собирается из серий и промежутка, а не
 * пишется руками: двойное неравенство для $k$ по каждой серии или
 * отбор по окружности. Так текст разбора и ответ не расходятся.
 */

import { d } from '../zadanie11/num';
import {
  add,
  korniNaPromezhutke,
  mul,
  otvetBTex,
  piTex,
  promezhutokTex,
  q,
  seriyaTex,
  sub,
  ugolTex,
  val,
  type Promezhutok,
  type Q,
  type Seriya,
  type Ugol,
} from './ugol';

/** Дробь в TeX: «-\dfrac{7}{2}», «3», «0». */
export function drobTex(x: Q): string {
  if (x.n === 0) return '0';
  const s = x.n < 0 ? '-' : '';
  const n = Math.abs(x.n);
  return x.m === 1 ? `${s}${d(n)}` : `${s}\\dfrac{${d(n)}}{${d(x.m)}}`;
}

function znakNer(vkl: boolean): string {
  return vkl ? '\\le ' : '< ';
}

function celye(lo: Q, hi: Q, vkl: [boolean, boolean]): number[] {
  const out: number[] = [];
  const a = val(lo);
  const b = val(hi);
  for (let k = Math.ceil(a - 1e-9); k <= Math.floor(b + 1e-9); k += 1) {
    if ((!vkl[0] && Math.abs(k - a) < 1e-9) || (!vkl[1] && Math.abs(k - b) < 1e-9)) continue;
    out.push(k);
  }
  return out;
}

const tablichnyy = (a: Ugol) => a.arc === undefined;

/** Двойное неравенство для одной серии: шаги разбора. */
export function nerav(sr: Seriya, p: Promezhutok): string[] {
  if (!tablichnyy(sr.nach) || !tablichnyy(p.ot) || !tablichnyy(p.do)) {
    throw new Error('otbor.nerav: серия и концы должны быть табличными');
  }
  const [l, r] = [znakNer(p.vkl[0]), znakNer(p.vkl[1])];
  const x0 = sr.nach.pi;
  const h = sr.shag;
  const lo = p.ot.pi;
  const hi = p.do.pi;
  const shagi: string[] = [];
  shagi.push(
    `Серия $x=${seriyaTex(sr)}$: $${piTex(lo)}${l}${seriyaTex(sr)}${r}${piTex(hi)}$.`,
  );
  /* Делим на π. */
  const hk = h.m === 1 ? `${h.n === 1 ? '' : d(h.n)}k` : `\\dfrac{${h.n === 1 ? '' : d(h.n)}k}{${d(h.m)}}`;
  const sered = x0.n === 0 ? hk : `${drobTex(x0)}+${hk}`;
  shagi.push(`Делим все части на $\\pi$: $${drobTex(lo)}${l}${sered}${r}${drobTex(hi)}$.`);
  let a = lo;
  let b = hi;
  if (x0.n !== 0) {
    a = sub(lo, x0);
    b = sub(hi, x0);
    shagi.push(
      `${x0.n > 0 ? 'Вычитаем' : 'Прибавляем'} $${drobTex(q(Math.abs(x0.n), x0.m))}$: $${drobTex(a)}${l}${hk}${r}${drobTex(b)}$.`,
    );
  }
  if (!(h.n === 1 && h.m === 1)) {
    const obr = q(h.m, h.n);
    a = mul(a, obr);
    b = mul(b, obr);
    shagi.push(
      `${h.m === 1 ? `Делим на $${d(h.n)}$` : h.n === 1 ? `Умножаем на $${d(h.m)}$` : `Умножаем на $${drobTex(obr)}$`}: $${drobTex(a)}${l} k${r}${drobTex(b)}$.`,
    );
  }
  const ks = celye(a, b, p.vkl);
  if (ks.length === 0) {
    shagi.push('Целых $k$ здесь нет — корней этой серии на промежутке нет.');
  } else {
    const korni = ks.map((k) => ugolTex({ pi: add(x0, mul(h, q(k))) }));
    shagi.push(
      `Целые $k$: $${ks.map((k) => d(k)).join(';\\ ')}$. Корни: $${korni.join(';\\ ')}$.`,
    );
  }
  return shagi;
}

/** Разбор пункта б двойным неравенством по всем сериям. */
export function otborNerav(serii: readonly Seriya[], p: Promezhutok): string[] {
  return [
    `Ищем целые $k$, при которых корень попадает в промежуток $${promezhutokTex(p)}$.`,
    ...serii.flatMap((sr) => nerav(sr, p)),
    `Корни на промежутке: $${otvetBTex(korniNaPromezhutke(serii, p))}$.`,
  ];
}

/** Разбор пункта б по окружности: текст к рисунку. */
export function otborKrug(serii: readonly Seriya[], p: Promezhutok): string[] {
  const korni = korniNaPromezhutke(serii, p);
  const dlina = val(sub(p.do.pi, p.ot.pi));
  const shagi = [
    `Отмечаем на окружности дугу от $${ugolTex(p.ot)}$ до $${ugolTex(p.do)}$: от начала идём против часовой стрелки${p.vkl[0] && p.vkl[1] ? '' : '; конец, который не входит в промежуток, — выколотая точка'}.`,
  ];
  if (dlina >= 2) {
    shagi.push(
      'Промежуток длиннее полного оборота, поэтому рисуем две окружности: на каждой — своя часть промежутка, короче оборота.',
    );
  }
  shagi.push(
    'На дуге отмечаем точки серий и подписываем их значениями: считаем от ближайшего подписанного конца дуги, прибавляя или вычитая известные углы.',
    korni.length === 0
      ? 'На дуге нет ни одной точки серий — корней на промежутке нет.'
      : `На дуге лежат: $${otvetBTex(korni)}$.`,
  );
  return shagi;
}

export function otvetB(serii: readonly Seriya[], p: Promezhutok): Ugol[] {
  return korniNaPromezhutke(serii, p);
}
