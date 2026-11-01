/* scripts/verify_schemes/vysoty.mjs — схема «Высоты и ортоцентр».

   На N случайных невырожденных треугольниках (по умолчанию 1000;
   остроугольные и тупоугольные, тупой угол при любой вершине)
   численно проверяет каждое следствие и каждый шаг доказательства
   из content/zadanie18/skhemy/vysoty.ts:
     — построение: M и K — основания высот, H лежит на обеих высотах;
     — △ABM ∼ △CBK: BM/AB = BK/BC = |cos B|;
     — △MBK ∼ △ABC с k = |cos B|, ∠BKM = ∠BCA, ∠BMK = ∠BAC;
     — AKMC вписанный (K, M на окружности с диаметром AC);
     — BKHM вписанный (K, M на окружности с диаметром BH);
     — R(AHC) = R(BHC) = R(ABH) = R(ABC); sin∠AHC = sin B;
       в остроугольном ∠AHC = 180° − ∠B, в любом — 180° − ∠B или ∠B;
     — MK = BH · sin B; BH = 2R|cos B|.
   Плюс экран: случайный поворот и отражение, нет NaN, подписи.

   Запуск: node scripts/verify_schemes/vysoty.mjs [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  blizko,
  dist,
  mid,
  opisannaya,
  orient,
  proveritEkran,
  schetchik,
  skal,
  ugol,
  zerno,
} from './obshchee.mjs';

export function proverit(N = 1000) {
  const { VYSOTY, tochkiVysot } = requireSrc('lib/zadanie18/skhemy/vysoty');
  const sch = schetchik('Схема «Высоты и ортоцентр»');
  const rnd = zerno(18001);
  let tesno = 0;
  let ekranov = 0;
  let proveren = 0;
  const vidyAHC = { '180−B': 0, B: 0 };
  while (proveren < N) {
    const t = {
      A: [rnd() * 10 - 2, rnd() * 8 - 2],
      B: [rnd() * 10 - 2, rnd() * 8 - 2],
      C: [rnd() * 10 - 2, rnd() * 8 - 2],
    };
    const { A, B, C, M, K, H } = tochkiVysot(t);
    const uA = ugol(B, A, C);
    const uB = ugol(A, B, C);
    const uC = ugol(A, C, B);
    /* Невырожденный: углы ≥ 3°, не ближе 0,5° к прямому. */
    if ([uA, uB, uC].some((u) => u < 3 || Math.abs(u - 90) < 0.5)) continue;
    if (Math.min(dist(A, B), dist(B, C), dist(A, C)) < 0.3) continue;
    proveren += 1;
    const R = opisannaya(A, B, C).r;
    const cosB = Math.abs(Math.cos((uB * Math.PI) / 180));
    const sinB = Math.sin((uB * Math.PI) / 180);
    const e = 1e-6;
    const tag = `A=${A.map((x) => x.toFixed(3))} B=${B.map((x) => x.toFixed(3))} C=${C.map((x) => x.toFixed(3))}`;

    sch.fakt(
      'построение: M на BC, AM ⊥ BC',
      Math.abs(orient(B, C, M)) < e && Math.abs(skal(A, M, B, C)) < e,
      tag,
    );
    sch.fakt(
      'построение: K на AB, CK ⊥ AB',
      Math.abs(orient(A, B, K)) < e && Math.abs(skal(C, K, A, B)) < e,
      tag,
    );
    sch.fakt(
      'построение: H на AM и на CK',
      Math.abs(orient(A, M, H)) < e * 10 && Math.abs(orient(C, K, H)) < e * 10,
      tag,
    );

    sch.fakt(
      '△ABM ∼ △CBK: BM/AB = BK/BC = |cos B|',
      blizko(dist(B, M) / dist(A, B), cosB) && blizko(dist(B, K) / dist(B, C), cosB),
      tag,
    );
    sch.fakt(
      '△MBK ∼ △ABC, k = |cos B| (три стороны)',
      blizko(dist(B, M) / dist(B, A), cosB) &&
        blizko(dist(B, K) / dist(B, C), cosB) &&
        blizko(dist(M, K) / dist(A, C), cosB),
      tag,
    );
    sch.fakt('∠BKM = ∠BCA', blizko(ugol(B, K, M), uC, 1e-6), tag);
    sch.fakt('∠BMK = ∠BAC', blizko(ugol(B, M, K), uA, 1e-6), tag);

    const oAC = mid(A, C);
    sch.fakt(
      'AKMC вписанный: K, M на окружности с диаметром AC',
      blizko(dist(oAC, K), dist(A, C) / 2) && blizko(dist(oAC, M), dist(A, C) / 2),
      tag,
    );
    const oBH = mid(B, H);
    sch.fakt(
      'BKHM вписанный: K, M на окружности с диаметром BH',
      blizko(dist(oBH, K), dist(B, H) / 2) && blizko(dist(oBH, M), dist(B, H) / 2),
      tag,
    );

    sch.fakt(
      'R(AHC) = R(BHC) = R(ABH) = R(ABC)',
      blizko(opisannaya(A, H, C).r, R) &&
        blizko(opisannaya(B, H, C).r, R) &&
        blizko(opisannaya(A, B, H).r, R),
      tag,
    );
    const uAHC = ugol(A, H, C);
    sch.fakt('sin∠AHC = sin B', blizko(Math.sin((uAHC * Math.PI) / 180), sinB), tag);
    if (blizko(uAHC, 180 - uB, 1e-6)) vidyAHC['180−B'] += 1;
    else if (blizko(uAHC, uB, 1e-6)) vidyAHC.B += 1;
    /* Утверждения текста: в остроугольном ∠AHC = 180° − ∠B, в любом —
       ∠AHC равен 180° − ∠B или ∠B. */
    if (Math.max(uA, uB, uC) < 90) {
      sch.fakt('остроугольный ⇒ ∠AHC = 180° − ∠B', blizko(uAHC, 180 - uB, 1e-6), tag);
    }
    sch.fakt(
      '∠AHC = 180° − ∠B или ∠AHC = ∠B',
      blizko(uAHC, 180 - uB, 1e-6) || blizko(uAHC, uB, 1e-6),
      tag,
    );

    sch.fakt('MK = BH · sin B', blizko(dist(M, K), dist(B, H) * sinB), tag);
    sch.fakt('BH = 2R·|cos B|', blizko(dist(B, H), 2 * R * cosB), tag);

    /* Экран — на положениях, которые живой чертёж принимает. */
    if (Math.min(uA, uB, uC) >= 14) {
      ekranov += 1;
      const lit = [
        [],
        ['podobie'],
        ['akmc'],
        ['bkhm'],
        ['ravnye-r'],
        ['bh'],
        ['pr1'],
        ['ahc'],
        ['bh-dok'],
      ][proveren % 9];
      tesno += proveritEkran(VYSOTY, t, rnd, sch, lit);
    }
  }

  /* Случайные положения карточек и начальное — проходят ограничения. */
  for (let i = 0; i < 300; i += 1) {
    const t = VYSOTY.sluchaynaya(rnd);
    const ok = ['A', 'B', 'C'].every((n) => VYSOTY.ogranichit(n, t[n], t) !== null);
    sch.fakt('случайное положение карточки допустимо', ok);
  }
  sch.fakt(
    'начальное положение допустимо',
    ['A', 'B', 'C'].every((n) => VYSOTY.ogranichit(n, VYSOTY.nachalo[n], VYSOTY.nachalo) !== null),
  );
  sch.fakt('шаги построения подписаны', VYSOTY.shagi.length === 5);

  const plokho = sch.itog();
  console.log(`  ∠AHC: = 180° − B — ${vidyAHC['180−B']}, = B — ${vidyAHC.B} (из ${N})`);
  console.log(`  подписи в тесноте: ${tesno} на ${ekranov} экранах`);
  return { plokho, tesno, ekranov };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const N = Number(process.argv[2] ?? 1000);
  const { plokho } = proverit(N);
  process.exit(plokho === 0 ? 0 : 1);
}
