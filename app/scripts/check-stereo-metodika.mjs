#!/usr/bin/env node
/* scripts/check-stereo-metodika.mjs — №3, новая методика: глава 2 теории
   «Пространство → плоский треугольник» и блок 2 опорных задач.

   Запуск: pnpm test:stereo-metodika

   Без браузера:
     1. Ответы двумя способами: ответ задачи (формулой) и пересчёт по
        координатам того же чертежа. Разобранные примеры главы — тоже:
        искомый отрезок или угол меряется на модели.
     2. Лайфхаки на случайных примерах:
        — расстояние в многограннике с прямыми углами = √(Δx² + Δy² + Δz²)
          против двух Пифагоров через проекцию — 200 случайных ступенек;
        — корень на промежуточном шаге не нужен: d² = (a² + b²) + c²;
        — равные катеты дают 45°;
        — «тройки в пространстве» из рамки — правда.
     3. Задачи блока: 10 штук, уровни не убывают, у «нажми» ответ — одна из
        целей, у «выбор» и «плоский чертёж» — номер варианта; подсказки:
        верный вариант в пределах, шаги алгоритма 1–5; у каждой задачи есть
        решение учителя и разбор ученика.
     4. Запечатанная задача: в разметке нет ответа открытым текстом,
        отпечаток принимает верный ответ и не принимает соседний;
        подсказки и разбор раскрываются.
     5. Рисунки — движок: подписи не налезают друг на друга, чёрных
        заливок нет, цели касания есть в SVG ровно с нужными id; плоский
        треугольник: прямой угол по теореме Пифагора на экране.
     6. Формулы: все строки $…$ и выкладки набираются KaTeX без ошибок. */

import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { APP, requireSrc } from './lib/load-ts.mjs';

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
  return ok;
}

const G2 = requireSrc('lib/stereo/glava2.ts');
const SEAL = requireSrc('lib/stereo/opornye3/seal.ts');
const SECRET = requireSrc('lib/stereo/opornye3/secret.ts');
const R = requireSrc('lib/solid/render.ts');
const PL = requireSrc('lib/stereo/ploskiy.ts');
const ST = requireSrc('lib/stereo/stupenka.ts');
const PK = requireSrc('lib/stereo/opornye3/piktogrammy.ts');
const BL = requireSrc('lib/stereo/opornye3/bloki.ts');

const near = (a, b) => Math.abs(a - b) < 1e-6;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const angle = (a, o, b) => {
  const u = [a[0] - o[0], a[1] - o[1], a[2] - o[2]];
  const v = [b[0] - o[0], b[1] - o[1], b[2] - o[2]];
  const c = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v));
  return Math.acos(Math.max(-1, Math.min(1, c)));
};

/* ── Формулы ───────────────────────────────────────────────────── */

function texOk(tex, where) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: 'ignore' });
    return check(true, where);
  } catch (e) {
    return check(false, `${where}: KaTeX — ${e.message.split('\n')[0]}`);
  }
}
function textOk(text, where) {
  const parts = text.split('$');
  check(parts.length % 2 === 1, `${where}: непарный $ в «${text.slice(0, 60)}»`);
  parts.forEach((p, i) => {
    if (i % 2 === 1) texOk(p, where);
  });
}

/* ── Рисунок движка ────────────────────────────────────────────── */

/* Условие без разметки: цифры путей SVG (знак корня KaTeX) и атрибутов — не текст. */
function tekstUsloviya(html) {
  return html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<annotation[\s\S]*?<\/annotation>/g, ' ').replace(/<[^>]*>/g, ' ');
}

function risunokOk(model, where, opts = {}) {
  const svg = R.renderSolid(model, opts);
  check(!/fill="(#000|#000000|black)"/i.test(svg), `${where}: чёрная заливка`);
  const d = R.solidDiagnostics(model, opts);
  const L = d.labels;
  for (let i = 0; i < L.length; i += 1) {
    for (let j = i + 1; j < L.length; j += 1) {
      const [a, b] = [L[i], L[j]];
      check(
        !(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y),
        `${where}: подписи «${a.text}» и «${b.text}» налезают`,
      );
    }
  }
  return svg;
}

function ploskiyOk(t, where) {
  const svg = PL.renderPloskiy(t);
  check(svg.startsWith('<svg') && svg.includes('<title>'), `${where}: плоский чертёж без SVG или title`);
  const [C, A, B] = PL.vershinyNaEkrane(t);
  const u = [A[0] - C[0], A[1] - C[1]];
  const v = [B[0] - C[0], B[1] - C[1]];
  check(Math.abs(u[0] * v[0] + u[1] * v[1]) < 1e-6, `${where}: на плоском чертеже угол при ${t.vershiny[0]} не прямой`);
  const k = Math.hypot(...u) / t.kateti[0];
  check(near(Math.hypot(...v) / k, t.kateti[1]), `${where}: катеты плоского чертежа не в пропорции`);
}

/* ── 1. Примеры главы 2 ────────────────────────────────────────── */

for (const p of G2.primeryGlavy2()) {
  const where = `глава 2, пример «${p.id}»`;
  if ('otrezok' in p.proverka) {
    const [a, b] = p.proverka.otrezok;
    check(near(dist(a, b), p.chislo), `${where}: ответ ${p.chislo}, а по чертежу ${dist(a, b)}`);
  } else {
    const [a, o, b] = p.proverka.ugol;
    const deg = (angle(a, o, b) * 180) / Math.PI;
    const ok = p.id === 'tangens' ? near(Math.tan(angle(a, o, b)), p.chislo) : near(deg, p.chislo);
    check(ok, `${where}: ответ ${p.chislo}, а по чертежу ${deg}°`);
  }
  check(p.shagi.every((s, i) => i === 0 || s.n >= p.shagi[i - 1].n), `${where}: шаги алгоритма не по порядку`);
  check(p.shagi.some((s) => s.n === 3), `${where}: нет шага ③ «обосновать прямой угол»`);
  const maxShag = Math.max(
    0,
    ...[...(p.model.lines ?? []), ...(p.model.sections ?? []), ...(p.model.angles ?? []), ...(p.model.marks ?? [])].map((x) => x.shag ?? 0),
  );
  check(maxShag <= p.shagiChertezha.length, `${where}: шагов чертежа ${maxShag}, подписей ${p.shagiChertezha.length}`);
  for (let k = 0; k <= p.shagiChertezha.length; k += 1) risunokOk(p.model, `${where}, шаг ${k}`, { shag: k });
  ploskiyOk(p.ploskiy, where);
  [p.title, p.uslovie, p.otvet, ...p.shagiChertezha, ...p.shagi.flatMap((s) => s.paras)].forEach((t) => textOk(t, where));
  p.shagi.flatMap((s) => s.formuly ?? []).forEach((f) => texOk(f, where));
}

/* Задачи к рамкам «Важно» и «Лайфхак». */
for (const [name, z] of Object.entries(G2)) {
  if (!/^(VAZHNO|LAYFHAK)_/.test(name)) continue;
  check(near(z.pereschet(), z.chislo), `рамка ${name}: ответ ${z.chislo}, пересчёт ${z.pereschet()}`);
  check(z.uslovie.length > 0 && z.reshenie.length > 0, `рамка ${name}: нет задачи или объяснения`);
  [z.uslovie, z.otvet, ...z.reshenie].forEach((t) => textOk(t, `рамка ${name}`));
  (z.formuly ?? []).forEach((f) => texOk(f, `рамка ${name}`));
}
for (const name of ['LOVUSHKA_ODNA', 'LOVUSHKA_GLAZ']) {
  const l = G2[name];
  check(l.neverno.length > 0 && l.verno.length > 0, `${name}: нет «Неверно» или «Верно»`);
  [l.title, ...l.neverno, ...l.verno].forEach((t) => textOk(t, name));
  check(![...l.neverno, ...l.verno].some((t) => /\*\*/.test(t)), `${name}: сырой markdown`);
}

/* Рисунки ловушек: «В чём ошибка?» и «Как правильно?» — движком, без
   наложения подписей, в обеих темах. На «Как правильно?» прямые углы
   отмечены только там, где они действительно прямые. */
for (const [name, risunki] of [['LOVUSHKA_ODNA', G2.risunkiLovushkiOdna()], ['LOVUSHKA_GLAZ', G2.risunkiLovushkiGlaz()]]) {
  for (const [kol, m] of Object.entries(risunki)) {
    for (const tema of ['pechat', 'ekran']) risunokOk(m, `${name}, ${kol}, тема ${tema}`, { tema });
    (m.angles ?? []).forEach((a) => {
      const dot = a.u[0] * a.v[0] + a.u[1] * a.v[1] + a.u[2] * a.v[2];
      check(Math.abs(dot) < 1e-9, `${name}, ${kol}: отмечен прямым непрямой угол`);
    });
  }
}

/* Пиктограммы блоков и декор: модель есть у всех блоков, кроме «Считаю удобно». */
for (const b of BL.BLOKI_3) {
  const m = PK.piktogrammaBloka(b.id);
  const kartinka = PK.kartinkaBloka(b.id);
  check((m === null) !== (kartinka === null), `пиктограмма блока ${b.no}: нужна ровно одна — чертёж движка или картинка`);
  if (kartinka !== null) {
    check(fs.existsSync(path.join(APP, 'public', kartinka)), `пиктограмма блока ${b.no}: нет файла ${kartinka}`);
  }
  if (m !== null) {
    const svg = R.renderSolid(m, { tema: 'ekran', bezPodpisey: true });
    check(svg.includes('solid--ekran') && !svg.includes('<text'), `пиктограмма блока ${b.no}: не «стекло» или с подписями`);
  }
}
check(R.renderSolid(PK.dekorBlokov(), { tema: 'ekran', bezPodpisey: true }).startsWith('<svg'), 'декор списка блоков не рисуется');

/* Темы движка: «печать» без градиента и с выделением не плотнее 0,15. */
for (const p of G2.primeryGlavy2()) {
  const n = p.shagiChertezha.length;
  const pechat = R.renderSolid(p.model, { shag: n });
  const ekran = R.renderSolid(p.model, { shag: n, tema: 'ekran' });
  check(!pechat.includes('Gradient') && !pechat.includes('solid--ekran'), `тема «печать», ${p.id}: градиент или экранный класс`);
  const zalivki = [...pechat.matchAll(/fill="(?!none|transparent)[^"]+" fill-opacity="([\d.]+)"/g)];
  check(zalivki.length > 0, `тема «печать», ${p.id}: нет заливок`);
  zalivki.forEach((m) => check(Number(m[1]) <= 0.15, `тема «печать», ${p.id}: заливка плотнее 0,15 (${m[1]})`));
  check(!/="var\(--/.test(pechat), `тема «печать», ${p.id}: цвет токеном var(--…)`);
  check(ekran.includes('linearGradient') && ekran.includes('solid-vershina'), `тема «экран», ${p.id}: нет градиента или кружков вершин`);
}

/* ── 2. Лайфхаки на случайных примерах ─────────────────────────── */

let seed = 12345;
const rnd = (n) => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return 1 + (seed % n);
};
for (let i = 0; i < 200; i += 1) {
  const w = rnd(9);
  const s = { W: w + rnd(9), w, H: rnd(15) + 3, h: 0, D: rnd(9) };
  s.h = Math.max(1, Math.min(s.H - 1, rnd(s.H)));
  const v = ST.vershinyStupenki(s);
  const A = v.A;
  const X = v.C2;
  const F = [X[0], X[1], 0];
  /* Два Пифагора через проекцию F: AF в нижней грани, FX — вертикаль. */
  const AF = Math.hypot(F[0] - A[0], F[1] - A[1]);
  const dvaPifagora = Math.hypot(AF, X[2] - F[2]);
  const formula = Math.sqrt((X[0] - A[0]) ** 2 + (X[1] - A[1]) ** 2 + (X[2] - A[2]) ** 2);
  check(near(dvaPifagora, dist(A, X)) && near(formula, dist(A, X)), `ступенька ${JSON.stringify(s)}: сдвиги не дают расстояние`);
  check(near(angle(A, F, X), Math.PI / 2), `ступенька ${JSON.stringify(s)}: угол AFC₂ не прямой`);
  /* Корень на промежуточном шаге не нужен. */
  const [a, b, c] = [rnd(20), rnd(20), rnd(20)];
  check(near((a * a + b * b) + c * c, Math.hypot(Math.sqrt(a * a + b * b), c) ** 2), `d² без промежуточного корня: ${a}, ${b}, ${c}`);
  /* Равные катеты — 45°. */
  const k = rnd(50) / 3;
  check(near((Math.atan2(k, k) * 180) / Math.PI, 45), `равные катеты ${k} — не 45°`);
}
/* Тройки в пространстве из рамки. */
for (const [a, b, c, d] of [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11]]) {
  check(a * a + b * b + c * c === d * d, `тройка в пространстве ${a}, ${b}, ${c} → ${d} — неверна`);
}

/* ── 3–5. Задачи опорных блоков ─────────────────────────────────
   Все написанные блоки: по десять задач, уровни не убывают, ответ
   пересчитывается по чертежу, задача уходит на страницу закрытой.
   Глава теории блока есть в оглавлении. Задача с меткой «банк» —
   задача №3 из снимка открытого банка ФИПИ. */

const GLAVY = requireSrc('content/stereo/glavy.ts');
const BANK_FIPI = new Set(
  JSON.parse(fs.readFileSync(path.join(APP, '..', 'content-source/stereometria/fipi-otkrytyy-bank.json'), 'utf8'))
    .zadachi.filter((t) => t.zadanie === '3')
    .map((t) => t.nomer),
);

for (const b of BL.BLOKI_3) {
  check(GLAVY.GLAVY_3.some((g) => g.id === b.glava), `блок ${b.no}: нет главы теории «${b.glava}»`);
  const zadachi = BL.zadachiBloka(b.id);
  check(b.gotov === zadachi.length > 0, `блок ${b.no}: «готов» не совпадает с наличием задач`);
  if (!b.gotov) continue;
  const N = b.no;
  check(zadachi.length === 10, `в блоке ${N} задач ${zadachi.length}, а не 10`);
  check(new Set(zadachi.map((z) => z.id)).size === zadachi.length, `блок ${N}: ключи задач повторяются`);
  check(zadachi.every((z) => z.id.startsWith(`o3-${N}-`) && z.blok === b.id), `блок ${N}: ключ или блок задачи не того блока`);
  check(zadachi.every((z, i) => i === 0 || z.uroven >= zadachi[i - 1].uroven), `блок ${N}: уровни задач убывают`);
  const vidy = new Set(zadachi.map((z) => z.vid));
  check(b.id === 'treugolnik' ? vidy.size === 4 : vidy.size >= 3, `блок ${N}: форматов ответа ${vidy.size}`);
  zadachi.forEach((z) => {
    if (z.istochnik === 'fipi') {
      check(z.fipi !== undefined && BANK_FIPI.has(z.fipi), `блок ${N}, ${z.id}: метка «банк», а задачи ${z.fipi ?? '—'} в открытом банке №3 нет`);
    } else {
      check(z.fipi === undefined, `блок ${N}, ${z.id}: номер ФИПИ у задачи не из банка`);
    }
  });
  zadachi.forEach((z, i) => {
    const where = `блок ${N}, ${z.id}`;
    const p = z.pereschet();
    if (z.vid === 'chislo') {
      check(near(Number(z.otvet.replace(',', '.')), Number(p)), `${where}: ответ ${z.otvet}, пересчёт ${p}`);
    } else {
      check(String(p) === z.otvet, `${where}: ответ ${z.otvet}, пересчёт ${p}`);
    }
    if (z.vid === 'nazhmi') {
      check((z.celi ?? []).some((c) => c.id === z.otvet), `${where}: ответ не среди целей`);
      const celi = z.celi.map((c) => ({ id: c.id, points: c.points }));
      /* На странице блока чертёж — в теме «экран»: подписи проверяются в обеих. */
      risunokOk(z.model, `${where}, тема ekran`, { celi, tema: 'ekran' });
      const svg = risunokOk(z.model, where, { celi });
      for (const c of z.celi) {
        check(svg.includes(`data-cel="${c.id}"`), `${where}: на чертеже нет цели ${c.id}`);
      }
      check(R.renderSolid(z.model) === R.renderSolid(z.model, {}), `${where}: без целей чертёж меняется`);
      z.celi.forEach((c) => textOk(c.label, where));
    } else {
      risunokOk(z.model, where);
      risunokOk(z.model, `${where}, тема ekran`, { tema: 'ekran' });
    }
    if (z.vid === 'vybor') {
      check(Number(z.otvet) >= 0 && Number(z.otvet) < (z.varianty ?? []).length, `${where}: ответ вне вариантов`);
      (z.varianty ?? []).forEach((v) => textOk(v, where));
    }
    if (z.vid === 'ploskiy') {
      check(Number(z.otvet) >= 0 && Number(z.otvet) < (z.ploskie ?? []).length, `${where}: ответ вне чертежей`);
      (z.ploskie ?? []).forEach((t, k) => ploskiyOk(t, `${where}, чертёж ${k + 1}`));
    }
    check(z.podskazka.length >= 1, `${where}: нет подсказки`);
    z.podskazka.forEach((s, k) => {
      check(s.n >= 1 && s.n <= 5, `${where}: шаг подсказки ${k + 1} — не шаг алгоритма`);
      check(s.verno >= 0 && s.verno < s.varianty.length, `${where}: шаг подсказки ${k + 1} — верный вариант вне списка`);
      [s.vopros, s.vyvod, ...s.varianty].forEach((t) => textOk(t, where));
    });
    check(z.uchitel.length > 0 && z.uchenik.length > 0, `${where}: нет решения учителя или разбора ученика`);
    z.uchitel.flatMap((e) => e.formuly).forEach((f) => texOk(f, `${where}, учитель`));
    z.uchenik.forEach((s) => {
      textOk(s.chto, `${where}, ученик`);
      if (s.formula !== undefined) texOk(s.formula, `${where}, ученик`);
    });
    textOk(z.uslovie, where);

    /* 4. Запечатанная задача. */
    const sealed = SEAL.sealZadacha(z, i + 1);
    const json = JSON.stringify({ ...sealed, model: null });
    if (z.vid === 'chislo') {
      check(!new RegExp(`(^|[^0-9.,])${z.otvet.replace(',', '[.,]')}([^0-9.,]|$)`).test(tekstUsloviya(sealed.uslovieHtml)) || z.uslovie.includes(z.otvet), `${where}: ответ в условии открыто`);
      check(SECRET.answerMatches(z.otvet, sealed.seal), `${where}: отпечаток не принимает верный ответ`);
      check(!SECRET.answerMatches(String(Number(z.otvet.replace(',', '.')) + 1), sealed.seal), `${where}: отпечаток принимает неверный ответ`);
    } else {
      check(SECRET.choiceMatches(z.otvet, sealed.seal), `${where}: отпечаток не принимает верный выбор`);
      const other = z.vid === 'nazhmi' ? z.celi.find((c) => c.id !== z.otvet).id : String((Number(z.otvet) + 1) % 3);
      check(!SECRET.choiceMatches(other, sealed.seal), `${where}: отпечаток принимает неверный выбор`);
    }
    check(!json.includes('"otvet"') && !json.includes('pereschet'), `${where}: в закрытой задаче поле ответа`);
    check(!json.includes('rabochaya') && !json.includes('pryamoy'), `${where}: рабочий треугольник открыто`);
    check(typeof z.kratko === 'string' && z.kratko.length > 0, `${where}: нет короткого названия`);
    textOk(z.kratko, where);
    check(b.id !== 'treugolnik' || z.rabochaya !== undefined, `${where}: нет рабочего треугольника для подсказки`);
    if (z.rabochaya !== undefined) {
      const [a, b, c] = z.rabochaya.points;
      const o = z.rabochaya.pryamoy;
      const others = [a, b, c].filter((q) => dist(q, o) > 1e-9);
      check(others.length === 2 && near(angle(others[0], o, others[1]), Math.PI / 2), `${where}: угол рабочего треугольника не прямой`);
    }
    const shagi = JSON.parse(SECRET.openText(sealed.podskazki, z.id));
    check(Array.isArray(shagi) && shagi.length === z.podskazka.length, `${where}: подсказки не раскрываются`);
    shagi.forEach((s, k) => {
      check(s.n === z.podskazka[k].n && s.correct === z.podskazka[k].verno, `${where}: шаг подсказки ${k + 1} раскрылся не тем`);
      check((s.rabochaya === null) === (z.rabochaya === undefined || s.n < 2), `${where}: шаг подсказки ${k + 1} — чертёж не по шагу`);
    });
    const razbor = JSON.parse(SECRET.openText(sealed.razbor, z.id));
    check(typeof razbor.uchenikHtml === 'string' && razbor.uchenikHtml.length > 0, `${where}: разбор не раскрывается`);
  });
}

/* ── 6. Главы 0, 1, 3–10: данные глав ──────────────────────────────
   Каждый ответ — пересчётом по координатам или формулой независимо от
   текста решения; «Ответ: $…$.» совпадает с числом; все строки и
   выкладки набираются KaTeX; чертежи — в обеих темах и на каждом шаге,
   прямые углы отмечены только там, где они прямые. */

const GL = requireSrc('lib/stereo/glavy/index.ts');
const chisloTex = (x) => String(x).replace('.', '{,}');
const vseId = new Set();

function modelOk(m, where, shagov = 0) {
  check(typeof m.alt === 'string' && m.alt.length > 0, `${where}: нет alt`);
  for (const tema of ['pechat', 'ekran']) {
    for (let k = 0; k <= shagov; k += 1) {
      risunokOk(m, `${where}, тема ${tema}${shagov > 0 ? `, шаг ${k}` : ''}`, shagov > 0 ? { tema, shag: k } : { tema });
    }
  }
  (m.angles ?? []).forEach((a) => {
    const dot = a.u[0] * a.v[0] + a.u[1] * a.v[1] + a.u[2] * a.v[2];
    check(Math.abs(dot) < 1e-9 * Math.hypot(...a.u) * Math.hypot(...a.v), `${where}: отмечен прямым непрямой угол`);
  });
  const maxShag = Math.max(
    0,
    ...[...(m.lines ?? []), ...(m.sections ?? []), ...(m.angles ?? []), ...(m.marks ?? []), ...(m.measures ?? [])].map((x) => x.shag ?? 0),
  );
  check(maxShag <= shagov, `${where}: шагов чертежа ${maxShag}, подписей ${shagov}`);
}

function otvetOk(o, where) {
  const x = o.pereschet();
  check(Number.isFinite(x) && near(x, o.chislo), `${where}: ответ ${o.chislo}, пересчёт ${x}`);
  check(o.otvet === `Ответ: $${chisloTex(o.chislo)}$.`, `${where}: «${o.otvet}» не совпадает с числом ${o.chislo}`);
  textOk(o.otvet, where);
  (o.formuly ?? []).forEach((f) => texOk(f, where));
}

function zadachaOk(z, where) {
  check(z.uslovie.length > 0 && z.reshenie.length > 0, `${where}: нет условия или объяснения`);
  [z.uslovie, ...z.reshenie].forEach((t) => textOk(t, where));
  otvetOk(z, where);
}

let primerov = 0;
let zadach = 0;
for (const [id, dannye] of Object.entries(GL.GLAVY_DANNYE_3)) {
  const g = dannye();
  check(g.id === id, `глава ${id}: id данных ${g.id}`);
  textOk(g.lead, `глава ${id}, лид`);
  if (g.dekor !== undefined) modelOk(g.dekor, `глава ${id}, декор`);
  check(g.razdely.length > 0, `глава ${id}: нет разделов`);
  for (const r of g.razdely) {
    const where = `глава ${id}, раздел «${r.title}»`;
    check(!vseId.has(r.id), `${where}: id ${r.id} повторяется`);
    vseId.add(r.id);
    check(!/[$\\]/.test(r.title), `${where}: в заголовке раздела формула — в «Содержании» она не наберётся`);
    if (r.lead !== undefined) textOk(r.lead, where);
    check(r.bloki.length > 0, `${where}: пустой раздел`);
    r.bloki.forEach((b, i) => {
      const w = `${where}, блок ${i + 1} (${b.vid})`;
      switch (b.vid) {
        case 'abzacy':
        case 'ideya':
          b.paras.forEach((t) => textOk(t, w));
          break;
        case 'opredelenie':
          b.paras.forEach((t) => textOk(t, w));
          (b.formuly ?? []).forEach((f) => texOk(f, w));
          break;
        case 'algoritm':
          b.shagi.forEach((s) => textOk(s.text, w));
          break;
        case 'formuly':
          check(!/[$\\]/.test(b.title), `${w}: в заголовке карточки формула — он не набирается KaTeX`);
          b.stroki.forEach((s) => {
            texOk(s.tex, w);
            textOk(s.podpis, w);
          });
          break;
        case 'spisok':
          b.items.forEach((t) => textOk(t, w));
          break;
        case 'formula':
          texOk(b.tex, w);
          break;
        case 'primer': {
          const p = b.primer;
          const wp = `${w} «${p.id}»`;
          primerov += 1;
          check(!vseId.has(p.id), `${wp}: id повторяется`);
          vseId.add(p.id);
          [p.title, p.uslovie, ...(p.shagiChertezha ?? []), ...p.shagi.flatMap((s) => [s.title, ...s.paras])].forEach((t) =>
            textOk(t, wp),
          );
          p.shagi.flatMap((s) => s.formuly ?? []).forEach((f) => texOk(f, wp));
          otvetOk(p, wp);
          if (p.model !== undefined) modelOk(p.model, wp, (p.shagiChertezha ?? []).length);
          else check(p.ploskiy === undefined, `${wp}: плоская панель без объёмного чертежа`);
          if (p.ploskiy !== undefined) ploskiyOk(p.ploskiy, wp);
          if (p.most !== undefined) textOk(p.most, wp);
          break;
        }
        case 'vazhno':
        case 'layfhak':
          textOk(b.title, w);
          (b.paras ?? []).forEach((t) => textOk(t, w));
          zadachaOk(b.zadacha, w);
          zadach += 1;
          break;
        case 'lovushka':
          textOk(b.title, w);
          check(b.neverno.length > 0 && b.verno.length > 0, `${w}: нет «В чём ошибка?» или «Как правильно?»`);
          [...b.neverno, ...b.verno].forEach((t) => textOk(t, w));
          if (b.risunki !== undefined) {
            modelOk(b.risunki.neverno, `${w}, рисунок «ошибка»`);
            modelOk(b.risunki.verno, `${w}, рисунок «правильно»`);
          }
          zadachaOk(b.zadacha, w);
          zadach += 1;
          break;
        case 'risunki':
          b.items.forEach((it, k) => {
            textOk(it.podpis, `${w}, рисунок ${k + 1}`);
            modelOk(it.model, `${w}, рисунок ${k + 1}`);
          });
          break;
        case 'tipy':
        case 'shpargalki':
          break;
        default:
          check(false, `${w}: неизвестный вид блока`);
      }
    });
  }
}
check(Object.keys(GL.GLAVY_DANNYE_3).length === 10, `глав-данных ${Object.keys(GL.GLAVY_DANNYE_3).length}, нужно 10 (все, кроме главы 2)`);
console.log(`check-stereo-metodika: главы-данные — ${primerov} примеров, ${zadach} задач в рамках`);

if (failures.length > 0) {
  console.error(`check-stereo-metodika: ${failures.length} из ${checks} проверок не прошли`);
  failures.slice(0, 50).forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(`check-stereo-metodika: ok (${checks} проверок)`);
