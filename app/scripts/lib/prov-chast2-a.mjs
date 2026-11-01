/**
 * Проверки шаблонов части 2 вариантов 11–12 (a14–a20) вторым способом:
 * 14 — нули исходной функции перебором, все корни в сериях, отбор;
 * 15 — координаты: угол между векторами SA и BC;
 * 16 — неравенство на сетке по исходной записи (логарифм по основанию x);
 * 17 — наименьшее расстояние перебором по времени;
 * 18 — окружность через A, B, C — радиус по координатам;
 * 19 — число корней для сетки a (с отдельным случаем a = 0);
 * 20 — перебор представимых сумм.
 */

import { chislaMnozh, sverMnozh, vMnozh } from './prov-obshchee.mjs';
import { dot, len, otvetPolya, provTrig, sub } from './prov-chast2-k.mjs';
import { koncy } from './prov-chast2-n.mjs';

export function provA({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provA14(p, z) {
    const k = z.kontrol.k;
    const f = (x) => Math.cos(2 * x) - k * (Math.cos(x) - Math.sin(x));
    provTrig({ ok, razobrat, vychislit }, 'a14', f, z, (p.lo * Math.PI) / 4, (p.hi * Math.PI) / 4);
  }

  function provA15(p, z) {
    const { scenariyA15 } = requireSrc('lib/povyshennye/chast2/a15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyA15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `a15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = p.a;
    const h = Math.sqrt(p.b * p.b - (a * a) / 2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const S = [a / 2, a / 2, h];
    ok(close(len(sub(S, A)), p.b, 1e-9), 'a15: боковое ребро');
    const u = sub(S, A);
    const v = sub(C, B);
    const ugol = Math.acos(Math.abs(dot(u, v)) / (len(u) * len(v)));
    ok(close(ugol, z.kontrol.otvet, 1e-9), 'a15: угол', `${ugol} / ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), ugol, 1e-9), 'a15: поле ответа');
  }

  function provA16(p, z) {
    const b = p.r1 + p.r2;
    const c = p.r1 * p.r2;
    const istina = (x) => {
      if (!(x > 0) || Math.abs(x - 1) < 1e-12 || !(b * x - c > 0)) return false;
      const v = Math.log(b * x - c) / Math.log(x);
      return p.znak === 'le' ? v <= 2 + 1e-9 : v >= 2 - 1e-9;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'a16', istina, ks, -5, 40, 0.00097);
    koncy(ok, 'a16', istina, ks);
  }

  function provA17(p, z) {
    const rho = (t) => Math.hypot(p.d1 - p.v1 * t, p.d2 - p.v2 * t);
    const T = 4 * Math.max(p.d1 / p.v1, p.d2 / p.v2);
    let best = 0;
    for (let i = 0; i <= 400000; i += 1) {
      const t = (T * i) / 400000;
      if (rho(t) < rho(best)) best = t;
    }
    const otv = p.vopros === 'rho' ? rho(best) : best * 60;
    ok(close(otv, z.kontrol.otvet, 1e-4), 'a17: минимум перебором', `${otv} / ${z.kontrol.otvet}`);
    ok(close(chislo(z.punkty[0].pole.verno), z.kontrol.otvet, 1e-12), 'a17: поле ответа');
  }

  function provA18(p, z) {
    const A = [-p.p, 0];
    const B = [p.q, 0];
    const C = [0, p.s];
    const D = [0, -p.t];
    /* Центр — пересечение серединных перпендикуляров к AB и AC. */
    const ox = (A[0] + B[0]) / 2;
    /* |O − A|² = |O − C|²: (ox + p)² + oy² = ox² + (oy − s)². */
    const oy = (ox * ox - (ox + p.p) ** 2 + p.s * p.s) / (2 * p.s);
    const R = Math.hypot(ox - A[0], oy - A[1]);
    ok(close(Math.hypot(ox - D[0], oy - D[1]), R, 1e-9), 'a18: D на окружности');
    ok(close(Math.hypot(ox - C[0], oy - C[1]), R, 1e-9), 'a18: C на окружности');
    ok(close(p.p * p.q, p.s * p.t, 1e-12), 'a18: а) AE·EB = CE·ED');
    const otv = p.nado === 'R' ? R : 2 * R;
    ok(close(otv, z.kontrol.otvet, 1e-9), 'a18: ответ', `${otv} / ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'a18: поле ответа');
  }

  function provA19(p, z) {
    const chisloK = (a) => {
      if (Math.abs(a) < 1e-12) return p.m !== 0 ? 1 : p.n === 0 ? Infinity : 0;
      const D4 = (a + p.m) ** 2 - a * (a + p.n);
      if (D4 < -1e-12) return 0;
      return Math.abs(D4) < 1e-12 ? 1 : 2;
    };
    const nado = (n) => (p.vopros === 'odin' ? n === 1 : n === 2);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'a19', (a) => nado(chisloK(a)), ks, -30, 30, 0.00097);
    for (const k of ks)
      for (const x of [k.lo, k.hi])
        if (Number.isFinite(x)) ok(nado(chisloK(x)) === vMnozh(ks, x), `a19: конец ${x}`);
  }

  function provA20(p, z) {
    const mozhno = (S) => {
      for (let x = 0; x * p.p <= S; x += 1) if ((S - x * p.p) % p.q === 0) return true;
      return false;
    };
    ok(mozhno(p.S1) === z.punkty[0].pole.verno, 'a20: а)');
    ok(mozhno(p.S2) === z.punkty[1].pole.verno, 'a20: б)');
    let F = -1;
    for (let S = 1; S <= p.p * p.q * 3; S += 1) if (!mozhno(S)) F = S;
    ok(F === Number(z.punkty[2].pole.verno), 'a20: в) перебором', `${F}`);
  }

  return {
    'a14.cosRazn': provA14,
    'a15.piramidaSkreshch': provA15,
    'a16.logOsnovanieX': provA16,
    'a17.perekrestok': provA17,
    'a18.perpHordy': provA18,
    'a19.kvadratParametr': provA19,
    'a20.monety': provA20,
  };
}
