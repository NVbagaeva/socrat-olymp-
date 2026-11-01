/* scripts/verify_schemes/trenazher.mjs — тренажёр №18.

   У каждой задачи (content/zadanie18/trenazher.ts) три набора чисел;
   чертёж варианта построен по этим числам (lib/zadanie18/trenazher/sceny.ts).
   Здесь по координатам чертежа заново считаются данные условия, факт
   пункта а) и ответ пункта б) — и сравниваются с otvet(p). Плюс: банк
   (отпечаток ответа принимает верный ответ и не принимает соседний,
   разбор и подсказка раскрываются), группы подсветки шагов есть на
   чертеже, верный вариант подсказки существует, экран без NaN. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, mid, orient, proveritEkran, schetchik, ugol, zerno } from './obshchee.mjs';

const S = (...pts) => {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - a[1] * b[0];
  }
  return Math.abs(s) / 2;
};
const parall = (a, b, c, d) =>
  Math.abs((b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])) <
  1e-9 * Math.max(1, dist(a, b) * dist(c, d));
const naPryamoy = (a, b, p) => Math.abs(orient(a, b, p)) < 1e-9 * Math.max(1, dist(a, b) ** 2);
const mezhdu = (a, b, p) => blizko(dist(a, p) + dist(p, b), dist(a, b));
const dpr = (p, a, b) => Math.abs(orient(a, b, p)) / dist(a, b);

/** Проверки по типу: (точки, параметры, ответ) → [факт, верно]. */
const PROVERKI = {
  'vysoty-cos': (sc, p, otv) => {
    const { A, B, C, A1, B1 } = sc.tochkiVysotyCos(p);
    return [
      [
        'условие: AB, cos C, остроугольный',
        blizko(dist(A, B), p.AB) &&
          blizko(Math.cos((ugol(A, C, B) * Math.PI) / 180), p.cosC) &&
          Math.max(ugol(B, A, C), ugol(A, B, C), ugol(A, C, B)) < 90,
      ],
      [
        'а: CA₁ = CA·cos C, CB₁ = CB·cos C',
        blizko(dist(C, A1), dist(C, A) * p.cosC) &&
          blizko(dist(C, B1), dist(C, B) * p.cosC) &&
          mezhdu(B, C, A1) &&
          mezhdu(A, C, B1),
      ],
      ['б: A₁B₁ = ответ', blizko(dist(A1, B1), otv)],
    ];
  },
  'bis-par': (sc, p, otv) => {
    const { A, B, C, L, M } = sc.tochkiBisPar(p);
    return [
      [
        'условие: AB, AC, AL — биссектриса, LM ∥ AB',
        blizko(dist(A, B), p.AB) &&
          blizko(dist(A, C), p.AC) &&
          blizko(ugol(B, A, L), ugol(L, A, C)) &&
          parall(L, M, A, B) &&
          mezhdu(A, C, M) &&
          mezhdu(B, C, L),
      ],
      ['а: AM = ML', blizko(dist(A, M), dist(M, L))],
      ['б: LM = ответ', blizko(dist(L, M), otv)],
    ];
  },
  mediana: (sc, p, otv) => {
    const { A, B, C, M, D } = sc.tochkiMediana(p);
    const m2 = (2 * p.AB ** 2 + 2 * p.AC ** 2 - p.BC ** 2) / 4;
    return [
      [
        'условие: AB, AC, AM, MD = AM',
        blizko(dist(A, B), p.AB) &&
          blizko(dist(A, C), p.AC) &&
          blizko(dist(A, M) ** 2, m2) &&
          blizko(dist(M, D), dist(A, M)) &&
          blizko(dist(B, M), dist(M, C)),
      ],
      [
        'а: ABDC — параллелограмм',
        blizko(B[0] - A[0], D[0] - C[0]) && blizko(B[1] - A[1], D[1] - C[1]),
      ],
      ['б: BC = ответ', blizko(dist(B, C), otv)],
    ];
  },
  'vysoty-okr': (sc, p, otv) => {
    const { A, B, C, B1, C1 } = sc.tochkiVysotyOkr(p);
    const O = mid(B, C);
    return [
      [
        'условие: ∠B, остроугольный, основания высот на сторонах',
        blizko(ugol(A, B, C), p.uB) &&
          Math.max(ugol(B, A, C), ugol(A, B, C), ugol(A, C, B)) < 90 &&
          mezhdu(A, C, B1) &&
          mezhdu(A, B, C1) &&
          blizko(ugol(B, B1, C), 90) &&
          blizko(ugol(B, C1, C), 90),
      ],
      [
        'а: B, C, B₁, C₁ на одной окружности',
        blizko(dist(O, B1), dist(B, C) / 2) && blizko(dist(O, C1), dist(B, C) / 2),
      ],
      ['б: ∠BB₁C₁ = ответ', blizko(ugol(B, B1, C1), otv, 1e-6)],
    ];
  },
  'trezubec-centr': (sc, p, otv) => {
    const { O, R, A, B, C, I, W } = sc.tochkiTrezubecCentr(p);
    const a = dist(B, C);
    const b = dist(A, C);
    const c = dist(A, B);
    const Ii = [
      (a * A[0] + b * B[0] + c * C[0]) / (a + b + c),
      (a * A[1] + b * B[1] + c * C[1]) / (a + b + c),
    ];
    return [
      [
        'условие: ∠B = 90°, AC = k√2, W на описанной и на биссектрисе B, I — инцентр',
        blizko(ugol(A, B, C), 90) &&
          blizko(dist(A, C), p.k * Math.SQRT2) &&
          blizko(dist(O, W), R) &&
          blizko(ugol(A, B, W), ugol(W, B, C)) &&
          dist(I, Ii) < 1e-9,
      ],
      ['а: WA = WI = WC', blizko(dist(W, A), dist(W, I)) && blizko(dist(W, C), dist(W, I))],
      ['б: радиус = ответ', blizko(dist(W, A), otv)],
    ];
  },
  'vpis-hordy': (sc, p, otv) => {
    const { P, A, B, C, D, O, R } = sc.tochkiVpisHordy(p);
    return [
      [
        'условие: ABCD вписан, P = AC ∩ BD, AB, AP, DP',
        [A, B, C, D].every((x) => blizko(dist(O, x), R)) &&
          mezhdu(A, C, P) &&
          mezhdu(B, D, P) &&
          blizko(dist(A, B), p.AB) &&
          blizko(dist(A, P), p.AP) &&
          blizko(dist(D, P), p.DP),
      ],
      ['а: ∠BAC = ∠BDC', blizko(ugol(B, A, C), ugol(B, D, C))],
      ['б: CD = ответ', blizko(dist(C, D), otv)],
    ];
  },
  'vpis-pryam': (sc, p, otv) => {
    const { A, B, C, I, r, K } = sc.tochkiVpisPryam(p);
    return [
      [
        'условие: ∠C = 90°, окружность вписана, касается AB в K, AK, BK',
        blizko(ugol(A, C, B), 90) &&
          blizko(dpr(I, A, B), r) &&
          blizko(dpr(I, A, C), r) &&
          blizko(dpr(I, B, C), r) &&
          blizko(dist(I, K), r) &&
          naPryamoy(A, B, K) &&
          blizko(dist(A, K), p.AK) &&
          blizko(dist(B, K), p.BK),
      ],
      ['а: S = AK·BK', blizko(S(A, B, C), p.AK * p.BK)],
      ['б: r = ответ', blizko(r, otv)],
    ];
  },
  hordy: (sc, p, otv) => {
    const { P, A, B, C, D, O, R } = sc.tochkiHordy(p);
    return [
      [
        'условие: хорды AB и CD пересекаются в P, AP, PB, CP',
        [A, B, C, D].every((x) => blizko(dist(O, x), R)) &&
          mezhdu(A, B, P) &&
          mezhdu(C, D, P) &&
          blizko(dist(A, P), p.AP) &&
          blizko(dist(P, B), p.PB) &&
          blizko(dist(C, P), p.CP),
      ],
      ['а: AP·PB = CP·PD', blizko(dist(A, P) * dist(P, B), dist(C, P) * dist(P, D))],
      ['б: CD = ответ', blizko(dist(C, D), otv)],
    ];
  },
  'sredlin-trap': (sc, p, otv) => {
    const { A, B, C, D, M, N } = sc.tochkiSredlinTrap(p);
    return [
      [
        'условие: трапеция, AD, BC, M и N — середины диагоналей',
        parall(A, D, B, C) &&
          blizko(dist(A, D), p.AD) &&
          blizko(dist(B, C), p.BC) &&
          blizko(dist(M, mid(A, C)), 0) &&
          blizko(dist(N, mid(B, D)), 0),
      ],
      ['а: MN ∥ AD', parall(M, N, A, D)],
      ['б: MN = ответ', blizko(dist(M, N), otv)],
    ];
  },
  'ravnobok-perp': (sc, p, otv) => {
    const { A, B, C, D, O, E, F } = sc.tochkiRavnobokPerp(p);
    return [
      [
        'условие: равнобедренная трапеция, AC ⊥ BD, высота h',
        parall(A, D, B, C) &&
          blizko(dist(A, B), dist(C, D)) &&
          blizko(ugol(A, O, D), 90) &&
          blizko(dist(E, F), p.h) &&
          blizko(dpr(B, A, D), p.h),
      ],
      ['а: высота = средняя линия', blizko(p.h, (dist(A, D) + dist(B, C)) / 2)],
      ['б: S = ответ', blizko(S(A, B, C, D), otv)],
    ];
  },
  'menelay-pl': (sc, p, otv) => {
    const { A, B, C, K, L, P } = sc.tochkiMenelayPl();
    const k = p.S / S(A, B, C);
    return [
      [
        'условие: AK : KB = 1 : 2, BL : LC = 3 : 1, P = AL ∩ CK',
        blizko(dist(A, K) / dist(K, B), 0.5) &&
          blizko(dist(B, L) / dist(L, C), 3) &&
          naPryamoy(A, L, P) &&
          naPryamoy(C, K, P) &&
          mezhdu(A, L, P),
      ],
      ['а: AP : PL = 2 : 1', blizko(dist(A, P) / dist(P, L), 2)],
      ['б: S(APC) = ответ', blizko(S(A, P, C) * k, otv)],
    ];
  },
  'trap-seredina': (sc, p, otv) => {
    const { A, B, C, D, E } = sc.tochkiTrapSeredina();
    return [
      [
        'условие: трапеция, E — середина CD',
        parall(A, D, B, C) && blizko(dist(C, E), dist(E, D)) && naPryamoy(C, D, E),
      ],
      ['а: S(ABE) = S(ABCD)/2', blizko(S(A, B, E), S(A, B, C, D) / 2)],
      ['б: S(ABCD) = ответ', blizko((S(A, B, C, D) / S(A, B, E)) * p.S, otv)],
    ];
  },
  'obshchiy-ugol': (sc, p, otv) => {
    const { A, B, C, M, N } = sc.tochkiObshchiyUgol(p);
    const k = p.S / S(A, B, C);
    return [
      [
        'условие: AM : MB, AN : NC',
        blizko(dist(A, M) / dist(M, B), p.m / p.n) && blizko(dist(A, N) / dist(N, C), p.p / p.q),
      ],
      [
        'а: S(AMN)/S(ABC)',
        blizko(S(A, M, N) / S(A, B, C), (p.m * p.p) / ((p.m + p.n) * (p.p + p.q))),
      ],
      ['б: S(MBCN) = ответ', blizko(S(M, B, C, N) * k, otv)],
    ];
  },
};

export function proverit() {
  const sc = requireSrc('lib/zadanie18/trenazher/sceny');
  const { TIPY_18 } = requireSrc('content/zadanie18/trenazher');
  const ekran = requireSrc('lib/skhemy/ekran');
  const podpisi = requireSrc('lib/skhemy/podpisi');
  /* Данные условия на чертеже (lib/skhemy, элемент «величина»): на
     листе (360×250) и на телефоне (343×247) каждая запись в кадре,
     не задевает линий, окружностей, букв и других записей; числа в
     записях — только из условия (ответа на чертеже нет). */
  const proveritVelichiny = (scena, t, p, sch) => {
    const tekst = Object.values(t.tekst(p)).join(' ').replace(/\{,\}/g, ',');
    const kadr = scena.postroit(scena.nachalo);
    const zapisi = kadr.elementy.filter((el) => el.vid === 'velichina');
    sch.fakt('на чертеже есть данные условия', zapisi.length > 0, t.id);
    for (const el of zapisi) {
      const chisla = el.tekst.match(/\d+(,\d+)?/g) ?? [];
      sch.fakt(
        'на чертеже только числа условия',
        chisla.every((c) => new RegExp(`(^|[^\\d,])${c}($|[^\\d,])`).test(tekst)),
        `${t.id}: ${el.tekst}`,
      );
    }
    for (const [W, H] of [
      [360, 250],
      [343, 247],
    ]) {
      const sost = { lit: new Set(), shag: null, podpisi: true };
      const e = ekran.raskladka(
        kadr,
        { ugol: 0, otrazhenie: 1 },
        ekran.ramkaKadra(kadr, { ugol: 0, otrazhenie: 1 }, sost),
        W,
        H,
        sost,
      );
      const prep = {
        otrezki: e.linii.map((l) => [
          [l.x1, l.y1],
          [l.x2, l.y2],
        ]),
        okruzhnosti: e.okr.map((o) => [[o.cx, o.cy], o.r]),
        tochki: e.tochki.map((q) => [q.x, q.y]),
      };
      const bukvy = e.podpisi.map((q) => {
        const g = podpisi.gabaritBukvy(
          q.indeks ? `${q.bukva}_${q.indeks}` : q.bukva,
          ekran.SK.kegl,
        );
        return [q.x - g.hw, q.y - g.hh, q.x + g.hw, q.y + g.hh];
      });
      const ramki = e.velichiny.map((v) => {
        const g = ekran.gabaritVelichiny(v.chasti);
        return [v.x - g.hw, v.y - g.hh, v.x + g.hw, v.y + g.hh];
      });
      ramki.forEach((r, i) => {
        const v = e.velichiny[i];
        sch.fakt(
          'запись на чертеже в кадре',
          r[0] >= 0 && r[1] >= 0 && r[2] <= W && r[3] <= H,
          `${t.id} ${W}: ${v.chasti.map((c) => c.t).join('')}`,
        );
        const drugie = [...bukvy, ...ramki.filter((_, j) => j !== i)];
        sch.fakt(
          'запись на чертеже ничего не задевает',
          podpisi.kasaniya(r, prep, drugie, null) === 0,
          `${t.id} ${JSON.stringify(p)} ${W}: ${v.chasti.map((c) => c.t).join('')}`,
        );
      });
    }
  };
  const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
  const { bank18, trenazherConfig18, zadachi18 } = requireSrc('lib/zadanie18/trenazher/bank');
  const { otvetVeren18, otkrytTekst18 } = requireSrc('lib/zadanie18/trenazher/otvet');
  const { typeset } = requireSrc('lib/tex');
  const sch = schetchik('Тренажёр №18');
  const ids = new Set(SOBRANNYE.map((s) => s.id));
  const rnd = zerno(1818);
  let tesno = 0;

  for (const t of TIPY_18) {
    const pr = PROVERKI[t.id];
    sch.fakt('у типа задачи есть проверка по чертежу', pr !== undefined, t.id);
    sch.fakt('схема типа существует', ids.has(t.skhema), t.skhema);
    sch.fakt('три варианта', t.varianty.length === 3, t.id);
    for (const p of t.varianty) {
      const otv = t.otvet(p);
      if (pr !== undefined)
        for (const [imya, ok] of pr(sc, p, otv))
          sch.fakt(`${t.id} — ${imya}`, ok, JSON.stringify(p));
      const scena = sc.scena18(t.id, p);
      const est = new Set(scena.postroit(scena.nachalo).elementy.flatMap((el) => el.gruppy ?? []));
      const shagi = [...t.reshenieA(p), ...t.reshenieB(p)];
      const net = [...new Set(shagi.flatMap((s) => s.gruppy))].filter((g) => !est.has(g));
      sch.fakt(
        'группы шагов разбора есть на чертеже',
        net.length === 0 && shagi.every((s) => s.gruppy.length > 0),
        `${t.id}: ${net.join(', ')}`,
      );
      sch.fakt(
        'подсказка: верный вариант существует',
        t.podskazka(p).every((v) => v.options[v.correct] !== undefined && v.options.length >= 2),
        t.id,
      );
      proveritVelichiny(scena, t, p, sch);
      for (const lit of [[], ...shagi.map((s) => s.gruppy)].slice(0, 4))
        tesno += proveritEkran(scena, scena.nachalo, rnd, sch, lit);
    }
  }

  /* Банк: отпечаток принимает ответ в разных записях и не принимает соседний. */
  const bank = bank18(typeset);
  const poKey = new Map(
    TIPY_18.flatMap((t) => t.varianty.map((p, i) => [`${t.id}#${i + 1}`, t.otvet(p)])),
  );
  for (const z of bank) {
    const otv = poKey.get(z.key);
    const zapis = String(Math.round(otv * 1e6) / 1e6);
    sch.fakt(
      'отпечаток: верный ответ принимается (и с запятой)',
      otvetVeren18(z.key, zapis, z.seal) && otvetVeren18(z.key, zapis.replace('.', ','), z.seal),
      z.key,
    );
    sch.fakt(
      'отпечаток: неверный ответ не принимается',
      !otvetVeren18(z.key, String(otv + 1), z.seal) &&
        !otvetVeren18(z.key, String(otv * 2 + 0.5), z.seal),
      z.key,
    );
    const r = JSON.parse(otkrytTekst18(z.key, z.razbor, z.seal));
    const h = JSON.parse(otkrytTekst18(z.key, z.podskazka, z.seal));
    sch.fakt(
      'разбор и подсказка раскрываются',
      r.a.length > 0 && r.b.length > 0 && h.length > 0,
      z.key,
    );
    sch.fakt(
      'в открытой разметке условия нет ответа «Ответ:»',
      !/Ответ:/.test(z.uslovieHtml + z.bHtml),
      z.key,
    );
  }
  const refs = zadachi18();
  const config = trenazherConfig18();
  const chipy = new Set(config.temy.flatMap((t) => t.podtipy.map((p) => p.id)));
  sch.fakt(
    'у каждой задачи — чип своей схемы',
    refs.every((r) => chipy.has(r.podtip)) && refs.length === bank.length,
  );
  sch.fakt('ключи задач не повторяются', new Set(refs.map((r) => r.key)).size === refs.length);
  const plokho = sch.itog();
  console.log(`  задач: ${bank.length}; подписи в тесноте: ${tesno}`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(proverit().plokho === 0 ? 0 : 1);
