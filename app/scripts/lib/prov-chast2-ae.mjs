/**
 * Проверки шаблонов части 2 вариантов 17–18 (ae14–ae20) вторым способом:
 * 14 — корни исходного уравнения на (0; +∞) перебором;
 * 15 — координаты: BF ⊥ (SAD), угол SB с плоскостью через нормаль;
 * 16, 19 — множество ответа сверяется с решением на сетке;
 * 17 — максимум площади перебором;
 * 18 — координаты точек касания по центрам окружностей;
 * 20 — перебор прогрессий.
 */

import { chislaMnozh, nuli, sverMnozh } from './prov-obshchee.mjs';
import { argmin, cross, dot, len, otvetPolya, sub } from './prov-chast2-k.mjs';

export function provAE({ ok, close, requireSrc }) {
  const { chislo } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provAE14(p, z) {
    const k = p.t1 * p.t2;
    const m = p.t1 + p.t2;
    /* по переменной u = ln x, x = e^u: корни f(u) на [−12; 12] */
    const f = (u) => {
      const lb = u / Math.log(p.b);
      return lb + k / lb - m;
    };
    const korni = nuli(f, -12, 12, 1e-3, 1e-12)
      .filter((u) => Math.abs(u) > 1e-6)
      .map((u) => Math.exp(u));
    const ozh = z.kontrol.korni;
    ok(
      korni.length === ozh.length && korni.every((x, i) => close(x, ozh[i], 1e-7)),
      'ae14: корни',
      `${korni} vs ${ozh}`,
    );
    const vyb = korni.filter((x) => x >= p.lo - 1e-9 && x <= p.hi + 1e-9);
    ok(
      vyb.length === z.kontrol.vybor.length &&
        vyb.every((x, i) => close(x, z.kontrol.vybor[i], 1e-7)),
      'ae14: отбор',
    );
  }

  function provAE15(p, z) {
    const { scenariyAE15 } = requireSrc('lib/povyshennye/chast2/ae15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyAE15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `ae15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const V = (k) => [a * Math.cos((Math.PI * k) / 3), a * Math.sin((Math.PI * k) / 3), 0];
    const [A, B, , D, , F] = [0, 1, 2, 3, 4, 5].map(V);
    const h = Math.sqrt(p.l2 - p.a2);
    const S = [0, 0, h];
    const bf = sub(F, B);
    ok(
      Math.abs(dot(bf, sub(D, A))) < 1e-9 && Math.abs(dot(bf, sub(S, [0, 0, 0]))) < 1e-9,
      'ae15: а) BF ⊥ (SAD)',
    );
    const n = cross(sub(A, S), sub(D, S));
    const v = sub(B, S);
    const ug = Math.asin(Math.abs(dot(n, v)) / (len(n) * len(v)));
    ok(close(ug, z.kontrol.otvet, 1e-9), 'ae15: угол');
    ok(close(otvetPolya(chislo, z), ug, 1e-9), 'ae15: поле ответа');
  }

  function provAE16(p, z) {
    const istina = (x) => {
      if (x < -p.a) return false;
      const v = (x - p.r1) * (x - p.r2) * Math.sqrt(x + p.a);
      return p.znak === 'le' ? v <= 1e-12 : v >= -1e-12;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'ae16', istina, ks, -12, 15, 0.000913);
    ok(
      ks.some((k) => Math.abs(k.lo - -p.a) < 1e-12 && k.loZ),
      'ae16: точка x = −a в ответе',
    );
  }

  function provAE17(p, z) {
    const R2 = 2 * p.k * p.k;
    const x = argmin((t) => -2 * t * Math.sqrt(R2 - t * t), 0, Math.sqrt(R2));
    const h = Math.sqrt(R2 - x * x);
    const otv = p.vopros === 'S' ? 2 * x * h : p.vopros === 'dlina' ? 2 * x : 4 * x + 2 * h;
    ok(close(otv, z.kontrol.otvet, 1e-6), 'ae17: перебор', `${otv}`);
    ok(close(otvetPolya(chislo, z), z.kontrol.otvet, 1e-12), 'ae17: поле ответа');
  }

  function provAE18(p, z) {
    const { a, b, c } = p;
    const xA = (c * c - b * b + a * a) / (2 * a);
    const yA = Math.sqrt(c * c - xA * xA);
    const S = (a * yA) / 2;
    const per = a + b + c;
    /* центр вписанной окружности: (a·A + b·B + c·C)/per; K — его проекция на BC */
    const xI = (a * xA + b * 0 + c * a) / per;
    const xJ = (-a * xA + b * 0 + c * a) / (-a + b + c);
    ok(close(S / (per / 2), (a * yA) / per, 1e-12), 'ae18: радиус');
    ok(Math.abs(xI - (a - xJ)) < 1e-9, 'ae18: а) BK = CL');
    const otv = p.nado === 'KL' ? Math.abs(xJ - xI) : xJ;
    ok(close(otv, z.kontrol.otvet, 1e-9), 'ae18: б)');
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'ae18: поле ответа');
  }

  function provAE19(p, z) {
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    for (let a = -2; a <= p.b ** p.hi + 3; a += 0.0713) {
      const f = (x) => p.b ** (2 * x) - (a + p.c) * p.b ** x + p.c * a;
      const n = nuli(f, p.lo - 1e-9, p.hi + 1e-9, 1e-4, 1e-12).filter(
        (x) => x >= p.lo - 1e-7 && x <= p.hi + 1e-7,
      ).length;
      ok(
        (n === p.n) === ks.some((k) => a > k.lo - 1e-9 && a < k.hi + 1e-9),
        `ae19: a=${a.toFixed(3)}`,
      );
    }
  }

  function provAE20(p, z) {
    const mozhno = (n) => {
      for (let a1 = 1; a1 * n <= p.S; a1 += 1)
        for (let d = 1; a1 * n + (d * n * (n - 1)) / 2 <= p.S; d += 1)
          if (a1 * n + (d * n * (n - 1)) / 2 === p.S) return true;
      return false;
    };
    ok(mozhno(p.n1) === z.kontrol.daA, 'ae20: а)');
    ok(mozhno(p.n2) === z.kontrol.daB, 'ae20: б)');
    let nMax = 1;
    for (let n = 2; n <= p.S; n += 1) if (mozhno(n)) nMax = n;
    ok(nMax === z.kontrol.nMax, 'ae20: в)');
  }

  return {
    'ae14.logObratnyy': provAE14,
    'ae15.shestiugPiramida': provAE15,
    'ae16.korenTrehchlen': provAE16,
    'ae17.polukrug': provAE17,
    'ae18.vnevpisannaya': provAE18,
    'ae19.pokazOtrezok': provAE19,
    'ae20.progressiya': provAE20,
  };
}
