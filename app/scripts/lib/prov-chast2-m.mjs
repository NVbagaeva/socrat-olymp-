/**
 * Проверки шаблонов части 2 вариантов 23–24 (m14–m20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — нули k·sin²x·cos²x − m·cos²2x перебором, серии и отбор;
 * 15 — координаты призмы: KM ⊥ AB, угол через нормали, площадь ABK;
 * 16 — неравенство на сетке по раскрытой записи из условия;
 * 17 — наименьшие расходы перебором по скорости;
 * 18 — координаты параллелограмма: биссектрисы, точки на BC, площадь;
 * 19 — число решений системы перебором по полуокружности;
 * 20 — наибольшее независимое множество графа «сумма делится на k»
 *      полным перебором по компонентам.
 */

import { chislaMnozh, nuli, sverMnozh } from './prov-obshchee.mjs';
import { argmin, cross, dot, len, lerp, otvetPolya, provTrig, sub } from './prov-chast2-k.mjs';

export function provM({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provM14(p, z) {
    const f = (x) => p.k * Math.sin(x) ** 2 * Math.cos(x) ** 2 - p.m * Math.cos(2 * x) ** 2;
    provTrig({ ok, razobrat, vychislit }, 'm14', f, z, (p.lo * Math.PI) / 4, (p.hi * Math.PI) / 4);
  }

  function provM15(p, z) {
    const { scenariyM15 } = requireSrc('lib/povyshennye/chast2/m15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyM15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `m15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const H = Math.sqrt(p.h2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a / 2, (a * Math.sqrt(3)) / 2, 0];
    const K = lerp(C, [C[0], C[1], H], p.m / (p.m + p.n));
    const M = lerp(A, B, 0.5);
    ok(Math.abs(dot(sub(K, M), sub(B, A))) < 1e-9, 'm15: а) KM ⊥ AB');
    const nor = cross(sub(B, A), sub(K, A));
    const otv = p.nado === 'ugol' ? Math.acos(Math.abs(nor[2]) / len(nor)) : len(nor) / 2;
    ok(close(otv, z.kontrol.otvet, 1e-9), `m15: ${p.nado}`, `${otv} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'm15: поле ответа');
  }

  function provM16(p, z) {
    const c = p.q ** p.e;
    const istina = (x) => {
      if (!(x > 0)) return false;
      const L = Math.log(x) / Math.log(p.p);
      const qx = p.q ** x;
      const v = qx * L - p.d * qx - c * L + c * p.d;
      return p.znak === 'le' ? v <= 1e-9 : v >= -1e-9;
    };
    ok(c === z.kontrol.c, 'm16: коэффициент q^e');
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kraj = Math.max(p.e, p.p ** p.d) + 4;
    sverMnozh(ok, 'm16', istina, ks, -2, kraj, 0.000917);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        if (Number.isFinite(x) && x !== 0) ok(istina(x) === zakr, `m16: конец ${x}`);
  }

  function provM17(p, z) {
    const Y = (v) => (p.D / v) * (p.k * v * v + p.C);
    const v = argmin(Y, 0.01, 1000);
    const otv = p.vopros === 'v' ? v : Y(v);
    ok(close(otv, z.kontrol.otvet, 1e-6), `m17: ${p.vopros}`, `${otv} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), z.kontrol.otvet, 1e-12), 'm17: поле ответа');
  }

  function provM18(p, z) {
    const al = Math.acos(p.c1 / p.c2);
    const A = [0, 0];
    const D = [p.b, 0];
    const B = [p.c * Math.cos(al), p.c * Math.sin(al)];
    const C = [B[0] + p.b, B[1]];
    const ed = (U) => U.map((x) => x / len(U));
    const add2 = (U, V) => [U[0] + V[0], U[1] + V[1]];
    const uA = add2(ed(sub(B, A)), ed(sub(D, A)));
    const uD = add2(ed(sub(A, D)), ed(sub(C, D)));
    /* Пересечение луча P + t·u с прямой y = B_y. */
    const naBC = (P, u) => lerp(P, add2(P, u), (B[1] - P[1]) / u[1]);
    const M = naBC(A, uA);
    const N = naBC(D, uD);
    ok(
      M[0] >= B[0] - 1e-9 && M[0] <= C[0] + 1e-9 && N[0] >= B[0] - 1e-9 && N[0] <= C[0] + 1e-9,
      'm18: M, N на стороне BC',
    );
    const den = uA[0] * -uD[1] - -uD[0] * uA[1];
    const r = sub(D, A);
    const t = (r[0] * -uD[1] - -uD[0] * r[1]) / den;
    const K = lerp(A, add2(A, uA), t);
    ok(Math.abs(dot(sub(A, K), sub(D, K))) < 1e-9, 'm18: а) ∠AKD = 90°');
    const otv =
      p.nado === 'MN'
        ? len(sub(M, N))
        : Math.abs((D[0] - A[0]) * (K[1] - A[1]) - (D[1] - A[1]) * (K[0] - A[0])) / 2;
    ok(close(otv, z.kontrol.otvet, 1e-9), `m18: ${p.nado}`, `${otv} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'm18: поле ответа');
  }

  function provM19(p, z) {
    /* Точки полуокружности y = √(r² − x²): (r cos θ, r sin θ), θ ∈ [0; π]. */
    const kolvo = (a) => {
      const g = (th) => p.r * Math.sin(th) - p.k * p.r * Math.abs(Math.cos(th)) - a;
      let n = nuli(g, 1e-7, Math.PI - 1e-7, 1e-3, 1e-10).length;
      if (Math.abs(g(0)) < 1e-12) n += 1;
      if (Math.abs(g(Math.PI)) < 1e-12) n += 1;
      return n;
    };
    const istina = (a) => (p.nado === 'est' ? kolvo(a) >= 1 : kolvo(a) === p.nado);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kraj = (p.k + 1) * p.r + 1;
    sverMnozh(ok, 'm19', istina, ks, -kraj, kraj, 0.00731, 1e-5);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        ok(istina(x) === zakr, `m19: конец ${x}`);
  }

  function provM20(p, z) {
    const V = Array.from({ length: p.N }, (_, i) => i + 1);
    const rebro = (u, v) => u !== v && (u + v) % p.k === 0;
    /* Наибольшее независимое множество: по компонентам связности — перебор подмножеств. */
    const mis = (vershiny) => {
      const ost = new Set(vershiny);
      let itog = 0;
      while (ost.size > 0) {
        const [s] = ost;
        const komp = [s];
        ost.delete(s);
        for (let i = 0; i < komp.length; i += 1)
          for (const w of [...ost])
            if (rebro(komp[i], w)) {
              komp.push(w);
              ost.delete(w);
            }
        const m = komp.length;
        const sos = komp.map((u) => komp.reduce((b, w, j) => (rebro(u, w) ? b | (1 << j) : b), 0));
        let best = 0;
        for (let mask = 0; mask < 1 << m; mask += 1) {
          let nezav = true;
          let cnt = 0;
          for (let j = 0; j < m && nezav; j += 1)
            if (mask & (1 << j)) {
              cnt += 1;
              if (sos[j] & mask) nezav = false;
            }
          if (nezav && cnt > best) best = cnt;
        }
        itog += best;
      }
      return itog;
    };
    const max = mis(V);
    ok(max === z.kontrol.v, 'm20: в) полным перебором', `${max} vs ${z.kontrol.v}`);
    ok(p.X <= max === z.kontrol.a, 'm20: а)');
    const sT = 1 + mis(V.filter((u) => u !== p.t && !rebro(u, p.t)));
    ok((sT === max) === z.kontrol.b, 'm20: б) перебором с числом t', `${sT} vs ${max}`);
  }

  return {
    'm14.kvadraty': provM14,
    'm15.prizmaUgol': provM15,
    'm16.gruppirovka': provM16,
    'm17.sudno': provM17,
    'm18.bissektrisy': provM18,
    'm19.galochka': provM19,
    'm20.ostatki': provM20,
  };
}
