/* scripts/verify_schemes/opornye.mjs — опорные задачи №18.

   Чертёж каждой задачи построен по числам условия
   (lib/zadanie18/opornye.ts). Здесь по его координатам заново
   считаются данные условия, каждый промежуточный факт решения и ответ
   пункта б) — и сравниваются с текстом (content/zadanie18/opornye.ts).
   Плюс согласованность: группы подсветки шагов есть на чертеже,
   схемы-подсказки существуют, экран без NaN и наложений подписей. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  blizko,
  dist,
  opisannaya,
  orient,
  proveritEkran,
  schetchik,
  ugol,
  zerno,
} from './obshchee.mjs';

const S = (a, b, c) => Math.abs(orient(a, b, c)) / 2;

export function proverit() {
  const ch = requireSrc('lib/zadanie18/opornye');
  const { OPORNYE_18 } = requireSrc('content/zadanie18/opornye');
  const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
  const sch = schetchik('Опорные задачи №18');
  const otvet = Object.fromEntries(OPORNYE_18.map((z) => [z.id, z.otvetChislo]));

  /* 1. Высоты. */
  {
    const { A, B, C, A1, C1 } = ch.tochkiVysoty();
    const cosB = Math.cos((ugol(A, B, C) * Math.PI) / 180);
    sch.fakt(
      '1: условие — AC = 10, ∠B = 60°, треугольник остроугольный',
      blizko(dist(A, C), 10) &&
        blizko(ugol(A, B, C), 60) &&
        Math.max(ugol(B, A, C), ugol(A, C, B)) < 90,
    );
    sch.fakt(
      '1а: BA₁ = AB·cos B, BC₁ = BC·cos B',
      blizko(dist(B, A1), dist(A, B) * cosB) && blizko(dist(B, C1), dist(B, C) * cosB),
    );
    sch.fakt(
      '1б: A₁C₁ = AC·cos B = ответ',
      blizko(dist(A1, C1), dist(A, C) * cosB) && blizko(dist(A1, C1), otvet['vysoty-podobie']),
    );
  }

  /* 2. Трезубец. */
  {
    const { O, R, A, B, C, W, I } = ch.tochkiTrezubec();
    sch.fakt(
      '2: условие — ∠A = 60°, BC = 6√3, A, B, C, W на окружности',
      blizko(ugol(B, A, C), 60) &&
        blizko(dist(B, C), 6 * Math.sqrt(3)) &&
        [A, B, C, W].every((p) => blizko(dist(p, O), R)),
    );
    const op = opisannaya(A, B, C);
    sch.fakt('2: окружность — описанная около ABC', blizko(op.r, R) && dist(op.c, O) < 1e-9);
    sch.fakt(
      '2: AW — биссектриса, I на AW',
      blizko(ugol(B, A, W), ugol(W, A, C)) && Math.abs(orient(A, W, I)) < 1e-9,
    );
    sch.fakt(
      '2а: ∠WBI = ∠WIB, WB = WI',
      blizko(ugol(W, B, I), ugol(W, I, B)) && blizko(dist(W, B), dist(W, I)),
    );
    sch.fakt(
      '2б: R = 6, WB = 2R·sin 30° = ответ',
      blizko(R, 6) &&
        blizko(dist(W, B), 2 * R * 0.5) &&
        blizko(dist(W, I), otvet['trezubec-wb-wi']),
    );
  }

  /* 3. Касательная и секущая. */
  {
    const { M, B, C, O, r, A } = ch.tochkiKasatelnaya();
    sch.fakt(
      '3: условие — MA = 6, MB = 4, B и C на окружности, B между M и C',
      blizko(dist(M, A), 6) &&
        blizko(dist(M, B), 4) &&
        blizko(dist(O, C), r) &&
        blizko(dist(M, B) + dist(B, C), dist(M, C)),
    );
    sch.fakt('3: MA — касательная (OA ⊥ MA)', blizko(ugol(O, A, M), 90));
    sch.fakt('3а: ∠MAB = ∠MCA', blizko(ugol(M, A, B), ugol(M, C, A)));
    sch.fakt(
      '3б: MA² = MB·MC, BC = ответ',
      blizko(dist(M, A) ** 2, dist(M, B) * dist(M, C)) &&
        blizko(dist(B, C), otvet['kasatelnaya-sekushchaya']),
    );
  }

  /* 4. Бабочка. */
  {
    const { A, B, C, D, O } = ch.tochkiBabochka();
    sch.fakt(
      '4: условие — BC ∥ AD, S(BOC) = 4, S(AOD) = 9',
      blizko(B[1], C[1]) && blizko(A[1], D[1]) && blizko(S(B, O, C), 4) && blizko(S(A, O, D), 9),
    );
    sch.fakt(
      '4а: S(ABD) = S(ACD), S(AOB) = S(COD)',
      blizko(S(A, B, D), S(A, C, D)) && blizko(S(A, O, B), S(C, O, D)),
    );
    sch.fakt(
      '4б: OB/OD = 2/3, S(COD) = 6',
      blizko(dist(O, B) / dist(O, D), 2 / 3) && blizko(S(C, O, D), 6),
    );
    const pl = S(A, B, C) + S(A, C, D);
    sch.fakt('4б: S(ABCD) = ответ', blizko(pl, otvet['babochka-ploshchad']));
  }

  /* 5. Менелай. */
  {
    const { A, B, C, K, M, P } = ch.tochkiMenelay();
    sch.fakt(
      '5: условие — AK : KC = 2 : 1, M — середина BC, P на AM и BK',
      blizko(dist(A, K) / dist(K, C), 2) &&
        blizko(dist(B, M), dist(M, C)) &&
        Math.abs(orient(A, M, P)) < 1e-9 &&
        Math.abs(orient(B, K, P)) < 1e-9,
    );
    const men = (dist(B, M) / dist(M, C)) * (dist(C, A) / dist(A, K)) * (dist(K, P) / dist(P, B));
    sch.fakt(
      '5а: Менелай для BKC и прямой AM, BP : PK = 3 : 2',
      blizko(men, 1) && blizko(dist(B, P) / dist(P, K), 1.5),
    );
    const k = 30 / S(A, B, C);
    sch.fakt(
      '5б: S(ABK) = 20, S(ABP) = ответ при S(ABC) = 30',
      blizko(S(A, B, K) * k, 20) && blizko(S(A, B, P) * k, otvet['menelay-otnoshenie']),
    );
  }

  /* 6. Касающиеся окружности. */
  {
    const { r1, r2, A, B, O1, O2, K, M } = ch.tochkiKasayushchiesya();
    sch.fakt(
      '6: условие — окружности касаются внешне в K, AB касается обеих',
      blizko(dist(O1, O2), r1 + r2) &&
        blizko(dist(O1, K), r1) &&
        blizko(dist(O2, K), r2) &&
        blizko(ugol(O1, A, B), 90) &&
        blizko(ugol(O2, B, A), 90) &&
        blizko(dist(O1, A), r1) &&
        blizko(dist(O2, B), r2),
    );
    sch.fakt(
      '6а: MA = MK = MB, ∠AKB = 90°',
      blizko(dist(M, A), dist(M, K)) && blizko(dist(M, K), dist(M, B)) && blizko(ugol(A, K, B), 90),
    );
    sch.fakt(
      '6б: AB = 2√(rR) = ответ',
      blizko(dist(A, B), 2 * Math.sqrt(r1 * r2)) &&
        blizko(dist(A, B), otvet['kasayushchiesya-pryamoy-ugol']),
    );
  }

  /* Согласованность текстов и чертежей, экран. */
  const ids = new Set(SOBRANNYE.map((s) => s.id));
  const rnd = zerno(1818);
  let tesno = 0;
  for (const z of OPORNYE_18) {
    const sc = ch.chertezhOpornoy18(z.id);
    const elementy = sc.postroit(sc.nachalo).elementy;
    const est = new Set(elementy.flatMap((el) => el.gruppy ?? []));
    const shagi = [...z.reshenieA, ...z.reshenieB];
    const net = [...new Set(shagi.flatMap((s) => s.gruppy))].filter((g) => !est.has(g));
    sch.fakt(
      `${z.no}: группы шагов есть на чертеже`,
      net.length === 0 && shagi.every((s) => s.gruppy.length > 0),
      net.join(', '),
    );
    sch.fakt(
      `${z.no}: схемы-подсказки существуют`,
      z.skhemy.length > 0 && z.skhemy.every((id) => ids.has(id)),
      z.skhemy.join(', '),
    );
    for (const lit of [[], ...shagi.map((s) => s.gruppy)]) {
      for (let i = 0; i < 4; i += 1) tesno += proveritEkran(sc, sc.nachalo, rnd, sch, lit);
    }
  }
  sch.fakt(
    'номера задач по порядку',
    OPORNYE_18.every((z, i) => z.no === i + 1),
  );
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno}`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(proverit().plokho === 0 ? 0 : 1);
