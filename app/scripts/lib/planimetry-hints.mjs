/* scripts/lib/planimetry-hints.mjs — разбор подсказок задания №1.

   Общая часть аудита (scripts/audit-planimetry-hints.mjs) и автопроверки
   (scripts/check-planimetry-hints.mjs): перечисление всех задач тренажёра
   и опорных задач, обозначения в текстах и подписи на чертежах.

   Задача тренажёра разбирается после подстановки: числа — из банка,
   аналога или генератора, буквы — после переименования варианта. */

import { requireSrc } from './load-ts.mjs';

const { PROTOTIPY, prototip } = requireSrc('lib/planimetriya/stseny/index');
const { reshenie } = requireSrc('lib/planimetriya/reshenie/index');
const { dannyeTrenazhera1 } = requireSrc('lib/planimetriya/trenazher/dannye');
const { razreshit, rezhimVoprosa, bezOtvetaSrediKnopok, idFaktovShaga } = requireSrc(
  'lib/planimetriya/trenazher/zadacha',
);
const { klyuchProto } = requireSrc('lib/planimetriya/trenazher/sessiya');
const { renderPlan, pustoyOtchet, shagovPodskazki } = requireSrc('lib/planimetriya/render');
const { pereimenovat } = requireSrc('lib/planimetriya/variant');
const { POROG } = requireSrc('lib/planimetriya/figury');
const { BLOKI } = requireSrc('lib/planimetriya/prep/bloki');
const { generateMikro, fixedSeed, sOtvetom } = requireSrc('lib/planimetriya/prep/generate');
const { chislo } = requireSrc('lib/planimetriya/stseny/dsl');

export { PROTOTIPY, prototip, reshenie, BLOKI, POROG, renderPlan, pustoyOtchet, shagovPodskazki };

/* ── Обозначения в тексте ────────────────────────────────────────── */

/** Буквы-величины: площадь, периметр, радиус — не точки (variant.ts). */
const VELICHINY = new Set(['S', 'P', 'R']);
const GRECHESKIE = ['alpha', 'beta', 'gamma', 'varphi', 'phi'];

/** Куски текста: математика ($…$) и слова. */
export function kuski(tekst) {
  const out = { tex: [], slova: [] };
  tekst.split('$').forEach((k, i) => (i % 2 === 1 ? out.tex : out.slova).push(k));
  return out;
}

/**
 * Обозначения в строке с формулами $…$ (или в голом TeX — tex: true).
 * tochki — заглавные латинские буквы (S, P, R — величины, если такой
 * точки в сцене нет); velichiny — строчные буквы и греческие;
 * vneFormul — латинские буквы и знаки формул вне $…$.
 */
export function oboznacheniya(tekst, { tex = false, tochkiSceny = [] } = {}) {
  const k = tex ? { tex: [tekst], slova: [] } : kuski(tekst);
  const tochki = new Set();
  const velichiny = new Set();
  for (const f of k.tex) {
    /* \text{…} и \operatorname{…} — слова, не обозначения. */
    const chist = f.replace(/\\(text|operatorname|mathrm)\s*\{[^}]*\}/g, ' ');
    for (const m of chist.matchAll(/\\([a-zA-Z]+)|([A-Za-z])/g)) {
      if (m[1] !== undefined) {
        if (GRECHESKIE.includes(m[1])) velichiny.add(`\\${m[1]}`);
        continue;
      }
      const b = m[2];
      if (b >= 'A' && b <= 'Z') {
        if (VELICHINY.has(b) && !tochkiSceny.includes(b)) continue;
        tochki.add(b);
      } else velichiny.add(b);
    }
  }
  const vneFormul = [];
  for (const s of k.slova) {
    for (const m of s.matchAll(/[A-Za-z]+|\d+\s*°|[=∠√]/g)) vneFormul.push(m[0]);
  }
  return { tochki: [...tochki], velichiny: [...velichiny], vneFormul };
}

/**
 * Числа, записанные в тексте: «$28^\\circ$», «$4{,}5$» → 28, 4.5.
 * gradusy: true — только числа со знаком градуса, false — только без
 * него, не задано — все.
 */
export function chislaTeksta(tekst, gradusy) {
  const out = new Set();
  for (const f of kuski(tekst).tex) {
    for (const m of f.matchAll(/(\d+(?:\{,\}\d+)?)(\^\\circ)?/g)) {
      if (gradusy !== undefined && gradusy !== (m[2] !== undefined)) continue;
      out.add(m[1].replace('{,}', ','));
    }
  }
  return out;
}

/* ── Чертёж ──────────────────────────────────────────────────────── */

/** Подписи чертежа в режиме: буквы точек и значения. */
export function podpisi(scena, optsii) {
  const o = pustoyOtchet();
  let oshibka = null;
  try {
    renderPlan(scena, optsii, o);
  } catch (e) {
    oshibka = String(e.message ?? e);
  }
  /* Рамка названа именем точки сцены; на чертеже — буква варианта. */
  const imya = (n) => optsii.variant?.bukvy?.[n] ?? n;
  const bukvy = o.ramki.filter((r) => r.kind === 'tochka').map((r) => imya(r.id));
  const znacheniya = o.ramki.filter((r) => r.kind === 'znachenie').map((r) => r.id);
  return { bukvy, znacheniya, teksty: o.teksty, problems: o.problems, oshibka, otchet: o };
}

/* ── Задачи тренажёра ────────────────────────────────────────────── */

let DANNYE = null;
function dannye() {
  DANNYE ??= dannyeTrenazhera1();
  return DANNYE;
}

/**
 * Планы всех задач тренажёра: каждая задача банка, каждый аналог и
 * novyh новых задач генератора на прототип.
 */
export function planyTrenazhera(novyh = 3) {
  const d = dannye();
  const plany = [];
  for (const b of d.bank) {
    plany.push({ vid: b.analog ? 'analog' : 'bank', id: b.id, no: b.no });
  }
  for (const p of PROTOTIPY) {
    for (let i = 0; i < novyh; i += 1) {
      plany.push({ vid: 'new', id: klyuchProto(p.id), seed: `audit-${i}` });
    }
  }
  return plany;
}

/** Задача тренажёра в сыром виде: тексты с буквами варианта и сцена. */
export function zadachaTrenazhera(plan) {
  const z = razreshit(plan, dannye().bank);
  const p = prototip(z.proto);
  const b = z.variant.bukvy;
  const ren = (t) => pereimenovat(t, b);
  const scena = p.stsena(z.params, POROG);
  const r = reshenie(z.proto, z.params);
  const nShagov = shagovPodskazki(scena);
  const tochkiSceny = Object.keys(scena.tochki).map((n) => b[n] ?? n);
  const voprosy = r.voprosy.map((v) => bezOtvetaSrediKnopok(v, p.otvet(z.params)));
  return {
    kod:
      plan.vid === 'new'
        ? `п${z.proto}·новая·${plan.seed}`
        : `п${z.proto}·${plan.vid === 'bank' ? 'ФИПИ' : 'аналог'} ${plan.no}`,
    plan,
    proto: z.proto,
    nazvanie: p.nazvanie,
    variant: z.variant,
    scena,
    tochkiSceny,
    otvet: p.otvet(z.params),
    otvetTekst: chislo(p.otvet(z.params)),
    uslovie: ren(p.uslovie(z.params)),
    risunokUsloviya: { rezhim: { rezhim: 'uchenik' }, variant: z.variant, chisla: false },
    voprosy: voprosy.map((v, i) => ({
      vopros: ren(v.vopros),
      knopki: v.knopki.map(ren),
      verno: v.verno,
      poyasnenie: ren(v.poyasnenie),
      sloy: v.sloy,
      fakt: v.fakt,
      vvod: v.vvod === undefined ? undefined : ren(v.vvod),
      vNashey: v.vNashey === undefined ? undefined : ren(v.vNashey),
      optsii: { rezhim: rezhimVoprosa(voprosy, i, nShagov), variant: z.variant, chisla: true },
    })),
    shagi: r.shagi.map((s) => ({
      zagolovok: ren(s.zagolovok),
      tekst: s.tekst.map(ren),
      formuly: (s.formuly ?? []).map(ren),
      sloy: s.sloy,
      fakty: idFaktovShaga(s, voprosy),
    })),
    risunokResheniya: { rezhim: { rezhim: 'uchitel' }, variant: z.variant, chisla: true },
    sverka: ren(r.sverka),
  };
}

/* ── Опорные задачи ──────────────────────────────────────────────── */

/** Опорные задачи: зафиксированный вариант и dop вариантов «Ещё вариант». */
export function opornyeZadachi(dop = 3) {
  const out = [];
  for (const blok of BLOKI) {
    for (const m of blok.zadachi) {
      const seeds = [fixedSeed(m.id), ...Array.from({ length: dop }, (_, i) => `audit-${i}`)];
      for (const seed of seeds) {
        let g;
        try {
          g = generateMikro(m.id, seed);
        } catch (e) {
          out.push({ kod: `${m.id}·${seed}`, blok, m, seed, oshibka: String(e.message ?? e) });
          continue;
        }
        out.push({
          kod: `${m.id}·${seed === fixedSeed(m.id) ? 'осн.' : seed}`,
          blok,
          m,
          seed,
          g,
          scenaUchitelya: g.risunok === null ? null : sOtvetom(g.risunok, g.otvet),
          otvetTekst: chislo(g.otvet),
        });
      }
    }
  }
  return out;
}
