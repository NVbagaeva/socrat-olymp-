/**
 * Проверки шаблонов части 2 вариантов 9–10 (y14–y20) вторым способом:
 * 14 — нули исходной функции перебором, отбор через сравнение с логарифмами;
 * 15 — координаты: A₁C ⊥ BD и BC₁, расстояние до плоскости BDC₁ по нормали;
 * 16 — неравенство на сетке по исходной записи;
 * 17 — моделирование долга по годам с найденным платежом;
 * 18 — трапеция в координатах, площади треугольников по формуле Гаусса;
 * 19 — число корней x² − 2b|x| + c = a для сетки a;
 * 20 — перебор двух- и трёхзначных чисел, наименьшее число — перебором.
 */

import { chislaMnozh, nuli, sverMnozh, vMnozh } from './prov-obshchee.mjs';
import { cross, dot, len, otvetPolya, sub } from './prov-chast2-k.mjs';
import { koncy } from './prov-chast2-n.mjs';
import { chisloRazlichnyh } from './prov-chast2-x.mjs';

export function provY({ ok, close, requireSrc }) {
  const { chislo } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provY14(p, z) {
    const c = p.e1 + p.e2;
    const s = p.q ** p.e1 + p.q ** p.e2;
    const f = (x) => p.q ** x + p.q ** (c - x) - s;
    const vse = nuli(f, -12, 12, 1e-3, 1e-12);
    const korni = z.punkty[0].pole.verno.map(chislo).sort((a, b) => a - b);
    ok(
      vse.length === korni.length && vse.every((x, i) => Math.abs(x - korni[i]) < 1e-6),
      'y14: а) корни перебором',
      `${vse} / ${korni}`,
    );
    const lo = Math.log(p.u) / Math.log(p.q);
    const hi = Math.log(p.v) / Math.log(p.q);
    const vybor = vse.filter((x) => x >= lo - 1e-12 && x <= hi + 1e-12);
    const pole = z.punkty[1].pole.verno.map(chislo).sort((a, b) => a - b);
    ok(
      vybor.length === pole.length && vybor.every((x, i) => Math.abs(x - pole[i]) < 1e-6),
      'y14: б) отбор',
    );
  }

  function provY15(p, z) {
    const { scenariyY15 } = requireSrc('lib/povyshennye/chast2/y15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyY15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `y15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const D = [0, a, 0];
    const A1 = [0, 0, a];
    const C1 = [a, a, a];
    const diag = sub(C, A1);
    ok(Math.abs(dot(diag, sub(D, B))) < 1e-9, 'y15: а) A₁C ⊥ BD');
    ok(Math.abs(dot(diag, sub(C1, B))) < 1e-9, 'y15: а) A₁C ⊥ BC₁');
    const n = cross(sub(D, B), sub(C1, B));
    const T = p.ot === 'A1' ? A1 : A;
    const d = Math.abs(dot(n, sub(T, B))) / len(n);
    ok(close(d, z.kontrol.otvet, 1e-9), 'y15: расстояние', `${d} / ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), d, 1e-9), 'y15: поле ответа');
  }

  function provY16(p, z) {
    const b = p.r1 + p.r2;
    const c = p.r1 * p.r2;
    const istina = (x) => {
      const t = x * x - b * x + c;
      if (!(t > 0)) return false;
      return Math.log(t) / Math.log(0.5) >= -p.k - 1e-9;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'y16', istina, ks, -40, 40, 0.00097);
    koncy(ok, 'y16', istina, ks);
  }

  function provY17(p, z) {
    const q = 1 + p.r / 100;
    const X = z.kontrol.X;
    let dolg = p.S;
    for (let god = 0; god < 2; god += 1) dolg = dolg * q - X;
    ok(Math.abs(dolg) < 1e-6, 'y17: долг погашен за два года', String(dolg));
    const otv = p.vopros === 'X' ? X : 2 * X - p.S;
    ok(close(chislo(z.punkty[0].pole.verno), otv, 1e-9), 'y17: поле ответа');
  }

  function provY18(p, z) {
    /* Трапеция с основаниями u и w (масштаб подгоняем под S(BOC) = u²). */
    const A = [0, 0];
    const D = [p.w, 0];
    const B = [0.7, 1];
    const C = [0.7 + p.u, 1];
    const t = p.u / (p.u + p.w);
    const O = [B[0] + t * (D[0] - B[0]), B[1] + t * (D[1] - B[1])];
    const S = (P, Q, R) =>
      Math.abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1])) / 2;
    const k = (p.u * p.u) / S(B, O, C);
    ok(close(S(A, O, D) * k, p.w * p.w, 1e-9), 'y18: S(AOD) при подобранном масштабе');
    ok(close(S(A, O, B), S(C, O, D), 1e-9), 'y18: а) S(AOB) = S(COD)');
    const otv = p.nado === 'S' ? (S(A, B, C) + S(A, C, D)) * k : S(A, O, B) * k;
    ok(close(otv, z.kontrol.otvet, 1e-9), 'y18: ответ', `${otv} / ${z.kontrol.otvet}`);
    ok(close(chislo(z.punkty[1].pole.verno), otv, 1e-9), 'y18: поле ответа');
  }

  function provY19(p, z) {
    const chisloK = (a) => {
      /* x ≥ 0: x² − 2bx + c − a = 0; x < 0: x² + 2bx + c − a = 0. */
      const kv = (B) => {
        const Dd = B * B - 4 * (p.c - a);
        if (Dd < -1e-12) return [];
        const r = Math.sqrt(Math.max(Dd, 0));
        return [(-B - r) / 2, (-B + r) / 2];
      };
      const xs = [
        ...kv(-2 * p.b).filter((x) => x >= -1e-12),
        ...kv(2 * p.b).filter((x) => x < -1e-12),
      ];
      return chisloRazlichnyh(xs);
    };
    const nado = (n) => (p.vopros === 'dva' ? n === 2 : p.vopros === 'chetyre' ? n === 4 : n >= 3);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'y19', (a) => nado(chisloK(a)), ks, -30, 40, 0.0097);
    for (const k of ks)
      for (const x of [k.lo, k.hi])
        if (Number.isFinite(x)) ok(nado(chisloK(x)) === vMnozh(ks, x), `y19: конец ${x}`);
  }

  function provY20(p, z) {
    const cif = (N) => String(N).split('').map(Number);
    const pr = (N) => cif(N).reduce((u, v) => u * v, 1);
    let a = false;
    for (let N = 10; N < 100; N += 1) if (pr(N) === p.P1) a = true;
    let b = false;
    for (let N = 100; N < 1000; N += 1)
      if (pr(N) === p.P2 && cif(N).reduce((u, v) => u + v) === p.S2) b = true;
    ok(a === z.punkty[0].pole.verno, 'y20: а)');
    ok(b === z.punkty[1].pole.verno, 'y20: б)');
    const v = Number(z.punkty[2].pole.verno);
    ok(pr(v) === p.P3, 'y20: в) произведение цифр ответа');
    if (v <= 2e6) {
      let min = null;
      for (let N = 1; N <= v && min === null; N += 1) if (pr(N) === p.P3) min = N;
      ok(min === v, 'y20: в) наименьшее перебором', `${min} / ${v}`);
    }
  }

  return {
    'y14.pokazSimm': provY14,
    'y15.kubDiagonal': provY15,
    'y16.logPolovina': provY16,
    'y17.kreditDvaGoda': provY17,
    'y18.trapeciyaDiagonali': provY18,
    'y19.modulVnutri': provY19,
    'y20.proizvCifr': provY20,
  };
}
