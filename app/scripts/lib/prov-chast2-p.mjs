/**
 * Проверки шаблонов части 2 вариантов 27–28 (p14–p20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — исходная дробь: нули числителя, где знаменатель не равен нулю,
 *      перебором; серия и отбор на отрезке;
 * 15 — координаты: нормали плоскостей ABM и CC₁D, расстояние от точки
 *      до плоскости по формуле с нормалью;
 * 16 — неравенство на сетке по исходной записи;
 * 17 — максимум V(x) перебором и золотым сечением;
 * 18 — треугольник по координатам, вписанная окружность, касательная
 *      y = 2r, периметр MBN, MN и площадь трапеции шнурком;
 * 19 — для сетки a: общие точки кругов — одна (касание или a = 0);
 *      нули d|a| − R − m|a| перебором;
 * 20 — разбиение гирь на группы своим перебором (от тяжёлых гирь).
 */

import { chislaMnozh, nuli, seriya, sverMnozh } from './prov-obshchee.mjs';
import { istinaZnak, koncy, maksimum } from './prov-chast2-n.mjs';

const sub = (u, v) => u.map((x, i) => x - v[i]);
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const len = (u) => Math.sqrt(dot(u, u));

export function provP({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');

  function provP14(p, z) {
    const A = z.kontrol.A;
    const B = z.kontrol.B;
    ok(z.uslovie.includes(`${A}-\\cos2x`), 'p14: свободный член в условии');
    const sq = p.ubrat === 'plus' ? -Math.sqrt(3) : Math.sqrt(3);
    const chisl = (x) => A - Math.cos(2 * x) + B * Math.sin(x);
    const znam = (x) => 2 * Math.cos(x) + sq;
    const korni = (a, b) => nuli(chisl, a, b, 1e-3, 1e-10).filter((x) => Math.abs(znam(x)) > 1e-6);
    const ser = z.punkty[0].pole.verno;
    ok(ser.length === 1, 'p14: одна серия');
    for (let n = -4; n <= 4; n += 1) {
      const x = seriya(razobrat, vychislit, ser[0], n);
      ok(
        Math.abs(chisl(x)) < 1e-9 && Math.abs(znam(x)) > 1e-6,
        `p14: серия при n=${n} — корень дроби`,
      );
    }
    const vse = korni(-2 * Math.PI, 2 * Math.PI);
    const iz = (x) => {
      for (let n = -10; n <= 10; n += 1)
        if (Math.abs(seriya(razobrat, vychislit, ser[0], n) - x) < 1e-6) return true;
      return false;
    };
    ok(vse.length > 0 && vse.every(iz), 'p14: все корни на [−2π; 2π] — в серии', String(vse));
    const lo = (p.lo[0] / p.lo[1]) * Math.PI;
    const hi = (p.hi[0] / p.hi[1]) * Math.PI;
    const naOtr = korni(lo - 0.01, hi + 0.01).filter((x) => x >= lo - 1e-6 && x <= hi + 1e-6);
    const otv = z.punkty[1].pole.verno.map(chislo).sort((a, b) => a - b);
    ok(
      naOtr.length === otv.length && naOtr.every((x, i) => close(x, otv[i], 1e-6)),
      'p14: корни на отрезке',
      `${naOtr} / ${otv}`,
    );
  }

  function provP15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyP15 } = requireSrc('lib/povyshennye/chast2/p15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyP15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `p15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a / 2, (a * Math.sqrt(3)) / 2, 0];
    const C1 = [C[0], C[1], p.h];
    const D = [a / 2, 0, 0];
    const M = [C[0], C[1], (p.h * p.m) / (p.m + p.n)];
    const nABM = cross(sub(B, A), sub(M, A));
    const nCCD = cross(sub(C1, C), sub(D, C));
    ok(Math.abs(dot(nABM, nCCD)) < 1e-9 * len(nABM) * len(nCCD), 'p15: (ABM) ⊥ (CC₁D)');
    const T = p.ot === 'C' ? C : C1;
    const d = Math.abs(dot(sub(T, A), nABM)) / len(nABM);
    ok(close(d, z.kontrol.otvet, 1e-9), 'p15: расстояние по координатам', `${d}`);
    ok(close(chislo(z.punkty[1].pole.verno), d, 1e-9), 'p15: поле ответа');
  }

  function provP16(p, z) {
    const f = (x) => {
      if (x + p.p < 0) return NaN;
      const den = x * x - p.q * p.q;
      if (den === 0) return NaN;
      return (Math.sqrt(x + p.p) - p.d) / den;
    };
    const istina = istinaZnak(f, p.znak);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'p16', istina, ks, -p.p - 3, 60, 0.00097);
    koncy(ok, 'p16', istina, ks);
  }

  function provP17(p, z) {
    const V = (x) => x * (p.a - 2 * x) * (p.b - 2 * x);
    const x = maksimum(V, 0, p.b / 2);
    ok(close(x, z.kontrol.x, 1e-6), 'p17: точка максимума перебором', `${x}`);
    ok(close(V(x), z.kontrol.V, 1e-6), 'p17: наибольший объём');
    const otv = p.vopros === 'x' ? x : V(x);
    ok(close(chislo(z.punkty[0].pole.verno), otv, 1e-6), 'p17: поле ответа');
  }

  function provP18(p, z) {
    /* A(0;0), C(b;0), B — по сторонам AB = c, BC = a. */
    const { a, b, c } = p;
    const A = [0, 0];
    const C = [b, 0];
    const Bx = (c * c - a * a + b * b) / (2 * b);
    const B = [Bx, Math.sqrt(c * c - Bx * Bx)];
    ok(close(len(sub(B, C)), a, 1e-9), 'p18: BC = a');
    const S = (b * B[1]) / 2;
    const r = S / ((a + b + c) / 2);
    /* Касательная, параллельная AC, — прямая y = 2r. */
    const y = 2 * r;
    const naPryamoy = (P, Q) => {
      const t = (y - P[1]) / (Q[1] - P[1]);
      return [P[0] + t * (Q[0] - P[0]), y];
    };
    const M = naPryamoy(A, B);
    const N = naPryamoy(C, B);
    const per = len(sub(M, B)) + len(sub(N, B)) + len(sub(M, N));
    ok(close(per, c + a - b, 1e-9), 'p18: а) P(MBN) = AB + BC − AC');
    const shnur = (pts) =>
      Math.abs(
        pts.reduce((s, P, i) => {
          const Q = pts[(i + 1) % pts.length];
          return s + P[0] * Q[1] - P[1] * Q[0];
        }, 0),
      ) / 2;
    const otv = p.nado === 'MN' ? len(sub(M, N)) : shnur([A, M, N, C]);
    ok(close(otv, z.kontrol.otvet, 1e-9), `p18: ${p.nado} по координатам`, `${otv}`);
    ok(close(chislo(z.punkty[1].pole.verno), otv, 1e-9), 'p18: поле ответа');
  }

  function provP19(p, z) {
    const d = Math.hypot(p.u, p.w);
    /* Пересечение кругов — одна точка: второй круг — точка (a = 0)
       или круги касаются внешним образом. */
    const raz = (a) => d * Math.abs(a) - p.R - p.m * Math.abs(a);
    const kas = nuli(raz, -50, 50, 1e-3, 1e-10);
    const vse = [...kas, 0].sort((x, y) => x - y);
    const otv = z.punkty[0].pole.verno.map(chislo).sort((x, y) => x - y);
    ok(
      vse.length === otv.length && vse.every((x, i) => close(x, otv[i], 1e-7)),
      'p19: значения a перебором',
      `${vse} / ${otv}`,
    );
    /* Точки касания: центр второго круга на расстоянии R + m|a| от O,
       общая точка — на отрезке центров, лежит на обеих окружностях. */
    for (const a of kas) {
      const O2 = [p.u * a, p.w * a];
      const T = O2.map((x) => (x * p.R) / len(O2));
      ok(
        close(len(T), p.R, 1e-9) && close(len(sub(T, O2)), p.m * Math.abs(a), 1e-9),
        'p19: точка касания на обеих окружностях',
      );
    }
    /* Чуть дальше — пусто, чуть ближе — общая часть с площадью. */
    for (const a of kas) {
      const r2 = p.m * Math.abs(a);
      const dal = d * Math.abs(a * 1.001);
      const bliz = d * Math.abs(a * 0.999);
      ok(
        dal > p.R + p.m * Math.abs(a * 1.001) && bliz < p.R + p.m * Math.abs(a * 0.999),
        'p19: вне касания — 0 или бесконечно много решений',
      );
      ok(r2 > 0, 'p19: радиус в точке касания положителен');
    }
  }

  function provP20(p, z) {
    /* Своё разбиение: самую тяжёлую свободную гирю кладём в новую группу
       и добираем группу перебором подмножеств остальных. */
    const mozhno = (n, k) => {
      const S = (n * (n + 1)) / 2;
      if (S % k !== 0) return false;
      const T = S / k;
      const svob = Array.from({ length: n }, (_, i) => n - i);
      const zanyato = new Array(n).fill(false);
      const dobrat = (gr, ost, ot) => {
        if (ost === 0) return gr === 1 ? true : sobrat(gr - 1);
        for (let i = ot; i < n; i += 1)
          if (!zanyato[i] && svob[i] <= ost) {
            zanyato[i] = true;
            if (dobrat(gr, ost - svob[i], i + 1)) return true;
            zanyato[i] = false;
          }
        return false;
      };
      const sobrat = (gr) => {
        const i = zanyato.indexOf(false);
        if (i < 0) return false;
        if (svob[i] > T) return false;
        zanyato[i] = true;
        if (dobrat(gr, T - svob[i], i + 1)) return true;
        zanyato[i] = false;
        return false;
      };
      return sobrat(k);
    };
    const a = mozhno(p.n1, p.k1);
    const b = mozhno(p.n2, p.k2);
    let v = 0;
    for (let k = 2; k <= p.n3; k += 1) if (mozhno(p.n3, k)) v = k;
    ok(a === z.kontrol.a, 'p20: а) перебором');
    ok(b === z.kontrol.b, 'p20: б) перебором');
    ok(v === z.kontrol.v, 'p20: в) перебором', `${v} / ${z.kontrol.v}`);
    ok(z.punkty[0].pole.verno === a && z.punkty[1].pole.verno === b, 'p20: поля да/нет');
    ok(chislo(z.punkty[2].pole.verno) === v, 'p20: поле в)');
  }

  return {
    'p14.trigDrobSin': provP14,
    'p15.prizmaABM': provP15,
    'p16.korenDrob': provP16,
    'p17.korobka': provP17,
    'p18.kasatelnayaParallel': provP18,
    'p19.dvaKruga': provP19,
    'p20.giri': provP20,
  };
}
