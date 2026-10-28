/**
 * Проверки шаблонов части 2 вариантов 17–18 (j14–j20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — дробь по исходной записи: корни серий, нули числителя перебором,
 *      знаменатель не ноль, отбор на отрезке;
 * 15 — координаты: плоскость через A₁C₁ ⊥ (ACB₁), точка на BB₁, угол
 *      между плоскостями через нормали;
 * 16 — неравенство на сетке;
 * 18 — окружность в угле численно: вторые точки пересечения, площадь
 *      шнурком и длины;
 * 19 — число корней cos ax = C на отрезке перебором по x для сетки a;
 * 20 — полный перебор троек.
 */

import { chislaMnozh, nuli, seriya, sverMnozh } from './prov-obshchee.mjs';

const sub = (u, v) => u.map((x, i) => x - v[i]);
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const len = (u) => Math.sqrt(dot(u, u));

export function provJ({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');

  function provJ14(p, z) {
    const PI = Math.PI;
    const PLUS = [
      (x) => -Math.sin(2 * x - PI / 2),
      (x) => Math.sin(2 * x + PI / 2),
      (x) => -Math.cos(PI - 2 * x),
      (x) => Math.sin(PI / 2 - 2 * x),
    ];
    const MINUS = [
      (x) => Math.sin((3 * PI) / 2 + 2 * x),
      (x) => Math.sin(2 * x - PI / 2),
      (x) => Math.cos(PI - 2 * x),
      (x) => -Math.sin(PI / 2 + 2 * x),
    ];
    const chisl = (x) =>
      p.chisl === 'sin'
        ? Math.sin(x) ** 4 + PLUS[p.zapis](x) - Math.cos(x) ** 2
        : Math.cos(x) ** 4 + MINUS[p.zapis](x) - Math.sin(x) ** 2;
    const u = (x, minus) => (minus ? -1 : 1) * (x / 4 + (p.fi * PI) / 8);
    const znam = (x) =>
      p.znam === 'cos'
        ? 2 * Math.sin(u(x, p.minus1)) ** 2 + p.B * Math.cos(u(x, p.minus2)) - 2
        : 2 * Math.cos(u(x, p.minus1)) ** 2 - p.B * Math.sin(u(x, p.minus2)) - 2;
    const koren = (x) => Math.abs(chisl(x)) < 1e-9 && Math.abs(znam(x)) > 1e-6;
    const serii = z.punkty[0].pole.verno;
    for (const s of serii)
      for (let n = -3; n <= 3; n += 1)
        ok(koren(seriya(razobrat, vychislit, s, n)), `j14: серия ${s}, n=${n}`);
    /* Все нули числителя (касание: −sin²2x/4) на [−4π; 4π] с ненулевым знаменателем — в сериях. */
    const vse = nuli((x) => chisl(x), -4 * PI, 4 * PI, 1e-3, 1e-12).filter(
      (x) => Math.abs(znam(x)) > 1e-6,
    );
    const iz = (x) =>
      serii.some((s) => {
        for (let n = -10; n <= 10; n += 1)
          if (Math.abs(seriya(razobrat, vychislit, s, n) - x) < 1e-5) return true;
        return false;
      });
    ok(
      vse.length > 0 && vse.every(iz),
      'j14: все корни на [−4π; 4π] — в сериях',
      String(vse.length),
    );
    const lo = (p.lo * PI) / 2;
    const hi = (p.hi * PI) / 2;
    const naOtr = nuli((x) => chisl(x), lo - 0.01, hi + 0.01, 1e-3, 1e-12).filter(
      (x) => x >= lo - 1e-7 && x <= hi + 1e-7 && Math.abs(znam(x)) > 1e-6,
    );
    ok(
      naOtr.length === z.kontrol.vybor.length &&
        naOtr.every((x, i) => Math.abs(x - z.kontrol.vybor[i]) < 1e-6),
      'j14: корни на отрезке',
      `${naOtr.length} / ${z.kontrol.vybor.length}`,
    );
    ok(Math.abs(znam(z.kontrol.e)) < 1e-9, 'j14: исключённая точка — нуль знаменателя');
  }

  function provJ15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyJ15 } = requireSrc('lib/povyshennye/chast2/j15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyJ15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `j15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const lam = p.lam[0] / p.lam[1];
    const A = [0, 0, 0];
    const C = [1, 0, 0];
    const B = [0.5, Math.sqrt(3) / 2, 0];
    const up = (X) => [X[0], X[1], lam];
    const [A1, B1, C1] = [A, B, C].map(up);
    const n1 = cross(sub(C, A), sub(B1, A));
    const na = cross(sub(C1, A1), n1);
    /* T на BB₁: na·(T − A₁) = 0. */
    const t = -dot(na, sub(B, A1)) / dot(na, sub(B1, B));
    ok(t > 0 && t < 1, 'j15: α пересекает ребро BB₁');
    ok(Math.abs(t - z.kontrol.tB) < 1e-9, 'j15: TB : BB₁', `${t} vs ${z.kontrol.tB}`);
    ok(Math.abs(dot(na, n1)) < 1e-12, 'j15: α ⊥ (ACB₁)');
    const N = {
      BCC1: cross(sub(C, B), [0, 0, 1]),
      ABB1: cross(sub(B, A), [0, 0, 1]),
      ACC1: cross(sub(C, A), [0, 0, 1]),
      ABC: [0, 0, 1],
    }[p.pl];
    const cos = Math.abs(dot(na, N)) / (len(na) * len(N));
    ok(Math.abs(cos - z.kontrol.cos) < 1e-9, 'j15: косинус угла', `${cos} vs ${z.kontrol.cos}`);
    ok(close(chislo(z.punkty[1].pole.verno), Math.acos(cos), 1e-9), 'j15: поле ответа');
  }

  function provJ16(p, z) {
    const q = (p.p - p.r) ** 2 / 4;
    const istina = (x) => {
      let w = x * x - p.c;
      if (w < 0 && w > -1e-9) w = 0;
      if (w < 0) return false;
      const t = Math.sqrt(w);
      if (Math.abs(p.r - t) < 1e-12) return false;
      const prav = p.p + q / (p.r - t);
      return p.znak === 'lt' ? t < prav - 1e-12 : t > prav + 1e-12;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'j16', istina, ks, -20, 20, 0.00093);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        if (Number.isFinite(x)) ok(istina(x) === zakr, `j16: конец ${x.toFixed(4)}`);
  }

  function provJ18(p, z) {
    const R = Math.sqrt(p.R2);
    const b = (p.beta * Math.PI) / 180;
    const BO = R / Math.sin(b / 2);
    const B = [0, -BO];
    /* Касания: A, C — основания перпендикуляров из O на стороны угла. */
    const st = (zn) => [zn * Math.sin(b / 2), Math.cos(b / 2)];
    const kas = (zn) => {
      const d = st(zn);
      const tt = dot([-B[0], -B[1]], d);
      return [B[0] + tt * d[0], B[1] + tt * d[1]];
    };
    const A = kas(-1);
    const C = kas(1);
    ok(Math.abs(Math.hypot(...A) - R) < 1e-9, 'j18: A на окружности');
    const D = [-C[0], -C[1]];
    const E = [-A[0], -A[1]];
    const vtoraya = (Q) => {
      const d = sub(Q, B);
      const aa = dot(d, d);
      const bb = 2 * dot(B, d);
      const cc = dot(B, B) - R * R;
      const tt = (-bb - Math.sqrt(bb * bb - 4 * aa * cc)) / (2 * aa);
      return [B[0] + tt * d[0], B[1] + tt * d[1]];
    };
    const N = vtoraya(D);
    const P = vtoraya(E);
    const dist = (X, Y) => Math.hypot(X[0] - Y[0], X[1] - Y[1]);
    if (p.beta === 60) ok(close(dist(A, B), dist(D, E), 1e-12), 'j18: а) AB = DE');
    if (p.beta === 120) ok(close(dist(A, D), 3 * dist(B, C), 1e-12), 'j18: а) AD = 3BC');
    if (p.beta === 90)
      ok(
        close(dist(A, C), dist(C, E), 1e-12) && close(dist(A, E), dist(C, D), 1e-12),
        'j18: а) ACED — квадрат',
      );
    let nado;
    if (p.nado === 'S') {
      const pts = [D, E, P, N];
      let S = 0;
      for (let i = 0; i < 4; i += 1)
        S += pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1];
      nado = Math.abs(S) / 2;
    } else if (p.nado === 'PN') nado = dist(P, N);
    else if (p.nado === 'BN') nado = dist(B, N);
    else nado = dist(D, N);
    ok(close(nado, z.kontrol.otvet, 1e-9), `j18: ${p.nado}`, `${nado} vs ${z.kontrol.otvet}`);
  }

  function provJ19(p, z) {
    const kolvo = (a) => {
      if (a === 0) return 0;
      const lo = p.m * Math.PI;
      const hi = p.n * Math.PI;
      const f = (x) => Math.cos(a * x) - p.C;
      return nuli(f, lo, hi, Math.min(1e-3, 0.05 / Math.abs(a)), 1e-12).length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kraj = Math.max(...ks.map((k) => Math.abs(k.hi)), ...ks.map((k) => Math.abs(k.lo))) + 0.5;
    sverMnozh(ok, 'j19', (a) => kolvo(a) === p.K, ks, -kraj, kraj, 0.00731, 1e-4);
    /* Концы: корень попадает на конец отрезка — закрытость проверяем сдвигом внутрь/наружу. */
    for (const k of ks) {
      ok(kolvo((k.lo + k.hi) / 2) === p.K, 'j19: середина промежутка');
      ok(
        kolvo(k.lo - 1e-6) !== p.K && kolvo(k.hi + 1e-6) !== p.K,
        'j19: снаружи промежутка — не K корней',
      );
    }
  }

  function provJ20(p, z) {
    const S = (n) =>
      String(n)
        .split('')
        .reduce((x, y) => x + Number(y), 0);
    const [n, v, t] = z.kontrol.primer;
    ok(
      v === p.lam * S(n) && t === p.mu * S(v) && n + v + t === p.A && new Set([n, v, t]).size === 3,
      'j20: пример а)',
    );
    let estB = false;
    for (let m = 1; m <= p.B && !estB; m += 1) {
      const vv = p.lam * S(m);
      const tt = p.mu * S(vv);
      if (m + vv + tt === p.B && new Set([m, vv, tt]).size === 3) estB = true;
    }
    ok(!estB, 'j20: б) перебором — нет');
    let k = 0;
    for (let m = 1000; m <= 9999; m += 1) {
      const vv = p.lam * S(m);
      const tt = p.mu * S(vv);
      if (tt === p.T && new Set([m, vv, tt]).size === 3) k += 1;
    }
    ok(k === z.kontrol.itog, 'j20: в) перебором', `${k} vs ${z.kontrol.itog}`);
  }

  return {
    'j14.trigDrob': provJ14,
    'j15.prizmaPerp': provJ15,
    'j16.korenDrob': provJ16,
    'j18.okrVUgle': provJ18,
    'j19.cosKorni': provJ19,
    'j20.summyCifr': provJ20,
  };
}
