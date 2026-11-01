/**
 * Проверки шаблонов части 2 вариантов 21–22 (l14–l20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — нули sin⁴x + cos⁴x − A перебором, серии и отбор;
 * 15 — координаты: плоскость KLM пересекается с AC, точка T = KL ∩ AB
 *      лежит на MN;
 * 16 — неравенство на сетке по исходной записи;
 * 17 — наименьшее время перебором по точке входа в воду;
 * 18 — координаты ромба: точки касания, прямые углы, площадь шнурком;
 * 19 — площадь фигуры численным интегрированием, сверка на сетке a;
 * 20 — перебор позиций фишки по ходам (поиск в ширину).
 */

import { chislaMnozh, sverMnozh } from './prov-obshchee.mjs';
import { argmin, cross, dot, len, lerp, otvetPolya, provTrig, sub } from './prov-chast2-k.mjs';

export function provL({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provL14(p, z) {
    const A = 1 - p.K4 / 8;
    const f = (x) => Math.sin(x) ** 4 + Math.cos(x) ** 4 - A;
    provTrig({ ok, razobrat, vychislit }, 'l14', f, z, (p.lo * Math.PI) / 4, (p.hi * Math.PI) / 4);
  }

  function provL15(p, z) {
    const { scenariyL15 } = requireSrc('lib/povyshennye/chast2/l15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyL15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `l15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    /* Произвольный невырожденный тетраэдр: отношения не зависят от формы. */
    const A = [0, 0, 0];
    const B = [1, 0, 0];
    const C = [0.23, 0.91, 0];
    const S = [0.31, 0.27, 1.13];
    const K = lerp(S, A, p.m1 / (p.m1 + p.n1));
    const L = lerp(S, B, p.m2 / (p.m2 + p.n2));
    const M = lerp(B, C, p.m3 / (p.m3 + p.n3));
    const nor = cross(sub(L, K), sub(M, K));
    const AC = sub(C, A);
    const u = dot(nor, sub(K, A)) / dot(nor, AC);
    ok(u > 0 && u < 1, 'l15: плоскость KLM пересекает ребро AC');
    const N = lerp(A, C, u);
    const otn = u / (1 - u);
    ok(close(otn, z.kontrol.otvet, 1e-9), 'l15: AN : NC', `${otn} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), otn, 1e-9), 'l15: поле ответа');
    /* T = KL ∩ AB: K + s(L − K) = A + w(B − A), решаем по двум координатам. */
    const d1 = sub(L, K);
    const d2 = sub(B, A);
    const r = sub(A, K);
    const den = d1[0] * -d2[2] - -d2[0] * d1[2];
    const s = (r[0] * -d2[2] - -d2[0] * r[2]) / den;
    const T = lerp(K, L, s);
    ok(len(cross(sub(T, A), d2)) < 1e-9, 'l15: T на прямой AB');
    ok(len(cross(sub(T, M), sub(N, M))) < 1e-9, 'l15: а) T на прямой MN');
  }

  function provL16(p, z) {
    const { A, B, C } = z.kontrol;
    const g = (u, v) => (v === 0 ? u : g(v, u % v));
    ok(
      [A, B, C].every(Number.isInteger) && g(g(A, B), C) === 1,
      'l16: целые взаимно простые коэффициенты',
    );
    const f = (x) => A * (p.p * p.p) ** x - B * (p.p * p.q) ** x + C * (p.q * p.q) ** x;
    const masshtab = (x) => A * (p.p * p.p) ** x + B * (p.p * p.q) ** x + C * (p.q * p.q) ** x;
    for (const e of [p.e1, p.e2]) ok(Math.abs(f(e)) < 1e-12 * masshtab(e), `l16: x=${e} — корень`);
    const istina = (x) => (p.znak === 'le' ? f(x) <= 0 : f(x) >= 0);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'l16', istina, ks, p.e1 - 6, p.e2 + 6, 0.000917);
  }

  function provL17(p, z) {
    const T = (x) => x / p.v1 + Math.hypot(p.L - x, p.d) / p.v2;
    const x = argmin(T, 0, p.L);
    const otv = p.vopros === 'AX' ? x : T(x);
    ok(close(otv, z.kontrol.otvet, 1e-6), `l17: ${p.vopros}`, `${otv} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), z.kontrol.otvet, 1e-9), 'l17: поле ответа');
  }

  function provL18(p, z) {
    const al = Math.acos(p.c1 / p.c2);
    const A = [0, 0];
    const B = [p.s, 0];
    const D = [p.s * Math.cos(al), p.s * Math.sin(al)];
    const C = [B[0] + D[0], B[1] + D[1]];
    const O = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
    const proj = (U, V) => lerp(U, V, dot(sub(O, U), sub(V, U)) / dot(sub(V, U), sub(V, U)));
    const [P, Q, R, T] = [proj(A, B), proj(B, C), proj(C, D), proj(D, A)];
    const r = len(sub(P, O));
    ok(
      [Q, R, T].every((X) => close(len(sub(X, O)), r, 1e-12)),
      'l18: окружность касается всех сторон',
    );
    const vrsh = [P, Q, R, T];
    for (let i = 0; i < 4; i += 1) {
      const X = vrsh[i];
      const Y = vrsh[(i + 1) % 4];
      const W = vrsh[(i + 3) % 4];
      ok(Math.abs(dot(sub(Y, X), sub(W, X))) < 1e-9, `l18: а) прямой угол в вершине ${i + 1}`);
    }
    let S = 0;
    for (let i = 0; i < 4; i += 1)
      S += vrsh[i][0] * vrsh[(i + 1) % 4][1] - vrsh[(i + 1) % 4][0] * vrsh[i][1];
    S = Math.abs(S) / 2;
    const Sromb = Math.abs(B[0] * D[1] - B[1] * D[0]);
    const otv = p.nado === 'S' ? S : S / Sromb;
    ok(close(otv, z.kontrol.otvet, 1e-9), `l18: ${p.nado}`, `${otv} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'l18: поле ответа');
  }

  function provL19(p, z) {
    const f = (x) => Math.abs(x - p.b) + Math.abs(x + p.b);
    /* Площадь между графиком и прямой y = a — метод трапеций. */
    const ploshchad = (a) => {
      if (a <= 2 * p.b) return 0;
      const N = 4000;
      const h = a / N;
      let s = 0;
      for (let i = 0; i < N; i += 1) {
        const x0 = -a / 2 + i * h;
        s += (Math.max(0, a - f(x0)) + Math.max(0, a - f(x0 + h))) / 2;
      }
      return s * h;
    };
    const lo = (S, zn) => (zn === 'ge' ? S >= p.S1 : S > p.S1);
    const hi = (S, zn) => (zn === 'lt' ? S < p.S2 : S <= p.S2);
    const istina = (a) => {
      const S = ploshchad(a);
      return lo(S, p.n1) && hi(S, p.n2);
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kraj = Math.max(...ks.map((k) => k.hi)) + 2;
    sverMnozh(ok, 'l19', istina, ks, -1, kraj, 0.00731, 1e-3);
    const [k] = ks;
    ok(
      close(ploshchad(k.lo), p.S1, 1e-5) && close(ploshchad(k.hi), p.S2, 1e-5),
      'l19: площади на концах',
    );
    ok(k.loZ === (p.n1 === 'ge') && k.hiZ === (p.n2 === 'le'), 'l19: концы по знакам условия');
  }

  function provL20(p, z) {
    /* а) позиции ровно через N ходов. */
    let poz = new Set([0]);
    for (let i = 0; i < p.N; i += 1) {
      const nov = new Set();
      for (const x of poz) {
        nov.add(x + p.a);
        nov.add(x - p.b);
      }
      poz = nov;
    }
    ok(poz.has(p.T1) === z.kontrol.a, 'l20: а) перебором');
    /* б) поиск в ширину по позициям в коридоре [−300; 300]. */
    const bfs = (cel, cheredovanie) => {
      const start = ['0|0'];
      const dist = new Map(start.map((s) => [s, 0]));
      let front = start;
      for (let d = 1; d <= 400; d += 1) {
        const nov = [];
        for (const s of front) {
          const [x, last] = s.split('|').map(Number);
          for (const [dx, napr] of [
            [p.a, 1],
            [-p.b, -1],
          ]) {
            if (cheredovanie && napr === last) continue;
            const y = x + dx;
            if (Math.abs(y) > 300) continue;
            if (y === cel) return d;
            const key = `${y}|${cheredovanie ? napr : 0}`;
            if (!dist.has(key)) {
              dist.set(key, d);
              nov.push(key);
            }
          }
        }
        front = nov;
      }
      return -1;
    };
    const b = bfs(p.T2, false);
    ok(b === z.kontrol.b, 'l20: б) поиск в ширину', `${b} vs ${z.kontrol.b}`);
    const v = bfs(p.T3, true);
    ok(v === z.kontrol.v, 'l20: в) поиск в ширину', `${v} vs ${z.kontrol.v}`);
  }

  return {
    'l14.chetvertye': provL14,
    'l15.menelay': provL15,
    'l16.odnorodnoe': provL16,
    'l17.spasatel': provL17,
    'l18.rombKasanie': provL18,
    'l19.koryto': provL19,
    'l20.fishka': provL20,
  };
}
