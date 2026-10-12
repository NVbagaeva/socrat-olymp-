/**
 * Самотест задания №6 (pnpm test:sluchainye-velichiny).
 *
 *   — пересчёт ответов: ответ каждой задачи (исходной и аналога)
 *     совпадает с ответом решателя (точные дроби) и с независимым
 *     пересчётом прототипа обычной арифметикой прямо по параметрам;
 *   — суммы вероятностей: распределение в сумме даёт ровно 1 (в целых
 *     долях), ветви из одной вершины дерева — тоже, проигрышных билетов
 *     не меньше нуля, у Чебышёва $\varepsilon^2>D$;
 *   — распределение ответов: 50 аналогов, не меньше 20 разных, ни один
 *     не чаще трёх раз (исключения — с причиной); ответ — целое или
 *     конечная десятичная дробь; файл аналогов совпадает с подбором;
 *   — уникальность: нет двух задач с одинаковым набором чисел, в том
 *     числе среди исходных;
 *   — доля сюжетных: ровно 20 из 50, по две на каждую из десяти тем,
 *     один сюжет — не больше двух раз;
 *   — разметка: KaTeX в строгом режиме, нет «1x», «+ −», лишних скобок,
 *     десятичной точки, тысячи в тексте — неразрывным пробелом;
 *   — рисунки: подписи на диаграммах Эйлера не налезают друг на друга,
 *     подписи вероятностей на дереве не налезают на ветки, овалы
 *     событий охватывают свои листья.
 */

import labels from '@/lib/graph/labels.js';
import {
  KEGL_P,
  ramkaMetki,
  raskladkaDereva,
  type RaskladkaDereva,
} from '@/components/probability/derevoRaskladka';
import { problemyEilera, raskladkaEilera } from '@/components/probability/eilerRaskladka';
import { formuly, gigienaFormuly } from '../zadanie7/selftest';
import {
  ANALOGOV,
  dopustimo,
  GENERATORY,
  otpechatok,
  otvetEge,
  podobratAnalogi,
  pravila,
  SYUZHETNYH,
  syuzhetZadachi,
  V_STILE_FIPI,
  znakovOtveta,
} from './bank/analogi';
import { ANALOGI_PO_PROTOTIPAM, ISTOCHNIKI } from './bank/index';
import { PROTOTYPES, prototype } from './prototypes';
import type { BankItem, Ris, Solved, Tablica, Uslovie } from './types';
import { TEMY } from './velichiny';

export interface Problem {
  where: string;
  what: string;
}

/** Исходных задач: 19 из пяти подборок и задача демоверсии. */
export const ISTOCHNIKOV = 20;

/** Задачи, условие которых хранится «как в источнике» и не совпадает со сборкой прототипа. */
export const TEKST_KAK_V_ISTOCHNIKE = new Set(['S16']);

export { formuly, gigienaFormuly };

/* ── Тексты ─────────────────────────────────────────────────────── */

function tekstyTablicy(t: Tablica): string[] {
  return t.stroki.flatMap((s) => [s.zag, ...s.yach]);
}

function tekstyRis(r: Ris | undefined): string[] {
  if (!r) {
    return [];
  }
  switch (r.vid) {
    case 'tablica':
      return tekstyTablicy(r.tablica);
    case 'zapis':
      return [`$${r.tex}$`];
    case 'eiler':
      return r.tochki.flatMap((t) => [`$${t.x}$`, ...(t.p ? [`$${t.p}$`] : [])]);
    case 'derevo':
      return r.vetki.map((v) => `$${v.p}$`);
  }
}

/** Все строки условия и решения: для разметки и поиска формул вне $…$. */
export function vseTeksty(u: Uslovie, s: Solved): string[] {
  const out: string[] = [u.text, ...(u.posle ? [u.posle] : []), ...tekstyRis(u.ris)];
  for (const e of s.etapy) {
    out.push(e.title, ...e.lines);
    if (e.tablica) out.push(...tekstyTablicy(e.tablica));
    out.push(...tekstyRis(e.ris));
  }
  for (const c of s.vychisleniya) {
    out.push(c.tekst);
    if (c.tex) out.push(`$${c.tex}$`);
  }
  for (const h of s.hints) {
    out.push(h.question, ...h.options, ...(h.comment ? [h.comment] : []));
  }
  return out;
}

function proveritTeksty(
  where: string,
  teksty: string[],
  typeset: (tex: string) => string,
  problems: Problem[],
) {
  for (const t of teksty) {
    if (/NaN|undefined|Infinity|\[object|null/.test(t)) {
      problems.push({ where, what: `мусор в тексте: «${t.slice(0, 80)}»` });
    }
    if ((t.match(/\$/g) ?? []).length % 2 !== 0) {
      problems.push({ where, what: `непарный $: «${t.slice(0, 80)}»` });
    }
    const vne = t.replace(/\$[^$]*\$/g, ' ');
    /* Тысячи — неразрывным пробелом: «20 000», не «20000» и не «20 000». */
    if (/\d{5,}/.test(vne)) {
      problems.push({ where, what: `большое число без разбивки на разряды: «${t.slice(0, 80)}»` });
    }
    if (/\d \d{3}(?!\d)/.test(vne)) {
      problems.push({
        where,
        what: `тысячи обычным пробелом вместо неразрывного: «${t.slice(0, 80)}»`,
      });
    }
    if (/\d\.\d/.test(vne)) {
      problems.push({ where, what: `десятичная точка в тексте: «${t.slice(0, 80)}»` });
    }
    for (const f of formuly(t)) {
      try {
        typeset(f);
      } catch (e) {
        problems.push({
          where,
          what: `KaTeX: ${(e as Error).message.slice(0, 120)} в «${f.slice(0, 80)}»`,
        });
      }
      for (const b of gigienaFormuly(f)) {
        problems.push({ where, what: `формула: ${b} в «${f.slice(0, 90)}»` });
      }
    }
  }
}

function proveritReshenie(where: string, s: Solved, problems: Problem[]) {
  s.etapy.forEach((e, i) => {
    if (!e.title.startsWith(`Шаг ${i + 1}. `)) {
      problems.push({ where, what: `этап без подписи «Шаг ${i + 1}»: ${e.title}` });
    }
    if (e.lines.length === 0) {
      problems.push({ where, what: `пустой этап ${e.title}` });
    }
  });
  const last = s.etapy.at(-1)?.lines.at(-1) ?? '';
  if (!last.startsWith('**Ответ:**')) {
    problems.push({ where, what: 'последняя строка разбора — не ответ' });
  }
  if (s.etapy.length < 2) {
    problems.push({ where, what: 'этапов меньше двух' });
  }
  if (s.hints.length < 3) {
    problems.push({ where, what: 'подсказок меньше трёх' });
  }
  for (const h of s.hints) {
    if (h.options[h.correct] === undefined) {
      problems.push({ where, what: `подсказка без верного варианта: ${h.question}` });
    }
    if (new Set(h.options).size !== h.options.length || h.options.length < 2) {
      problems.push({ where, what: `варианты подсказки повторяются или их мало: ${h.question}` });
    }
  }
}

/* ── Рисунки ────────────────────────────────────────────────────── */

/** Подписи вероятностей на дереве: не на ветках и не друг на друге; овалы — вокруг своих листьев. */
export function problemyDereva(r: RaskladkaDereva): string[] {
  const out: string[] = [];
  const ramki = r.metki.map((m) => ({
    id: m.id,
    box: ramkaMetki(m.x, m.y, labels.pointTextWidth(m.text, KEGL_P), m.anchor),
  }));
  for (const { id, box } of ramki) {
    for (const s of r.otrezki) {
      if (labels.segRectDist(s.x1, s.y1, s.x2, s.y2, box) < 1) {
        out.push(`подпись вероятности ветки ${id} задевает ветку ${s.id}`);
      }
    }
    for (const o of ramki) {
      if (o.id !== id) {
        const dx = Math.abs(o.box.x - box.x) - o.box.halfW - box.halfW;
        const dy = Math.abs(o.box.y - box.y) - o.box.halfH - box.halfH;
        if (dx < 1 && dy < 1) {
          out.push(`подписи веток ${id} и ${o.id} налезают друг на друга`);
        }
      }
    }
  }
  return out;
}

function proveritRis(where: string, ris: Ris | undefined, problems: Problem[], protoId: string) {
  if (protoId === 'P01' || protoId === 'P02') {
    if (ris?.vid !== 'eiler') {
      problems.push({ where, what: 'нет диаграммы Эйлера' });
      return;
    }
    if (ris.tochki.length < 5 || ris.tochki.length > 10) {
      problems.push({ where, what: `точек ${ris.tochki.length}, нужно 5–10` });
    }
    try {
      problemyEilera(raskladkaEilera(ris.tochki, ris.zerno)).forEach((w) =>
        problems.push({ where, what: `диаграмма: ${w}` }),
      );
    } catch (e) {
      problems.push({ where, what: (e as Error).message });
    }
    if (protoId === 'P02' && ris.tochki.some((t) => t.p !== undefined)) {
      problems.push({ where, what: 'у равновозможных исходов на рисунке вероятности' });
    }
  }
  if (protoId === 'P03') {
    if (ris?.vid !== 'derevo') {
      problems.push({ where, what: 'нет дерева' });
      return;
    }
    const branches = ris.vetki.map((v) => ({
      id: v.id,
      parent: v.parent,
      label: v.imya,
      p: v.pv,
      pLabel: v.p,
    }));
    const events = ris.sobytiya.map((s) => ({ name: s.imya, leaves: s.listya }));
    const r = raskladkaDereva({ branches, events });
    if (r.urovney < 2 || r.urovney > 3) {
      problems.push({ where, what: `уровней дерева ${r.urovney}, нужно 2–3` });
    }
    problemyDereva(r).forEach((w) => problems.push({ where, what: `дерево: ${w}` }));
    for (const ov of r.ovaly) {
      const ev = events.find((e) => e.name === ov.name);
      const listya = r.listya.map((l) => l.id);
      const idx = (ev?.leaves ?? []).map((id) => listya.indexOf(id)).sort((a, b) => a - b);
      if (idx.some((x, i) => i > 0 && x !== (idx[i - 1] as number) + 1)) {
        problems.push({ where, what: `событие ${ov.name}: листья не подряд — овал их не охватит` });
      }
      for (const id of ev?.leaves ?? []) {
        const x = r.x.get(id) ?? 0;
        if (Math.abs(x - ov.cx) > ov.rx - 8) {
          problems.push({ where, what: `лист ${id} не внутри овала ${ov.name}` });
        }
      }
    }
  }
}

/* ── Проверка банка ─────────────────────────────────────────────── */

export interface Itog {
  problems: Problem[];
  solved: { where: string; item: BankItem; u: Uslovie; s: Solved }[];
  statistika: string[];
}

function proveritZadachu(
  item: BankItem,
  typeset: (tex: string) => string,
  problems: Problem[],
  itog: Itog,
) {
  const proto = prototype(item.prototypeId);
  let s: Solved;
  let u: Uslovie;
  try {
    s = proto.solve(item.params);
    u = proto.uslovie(item.params);
  } catch (e) {
    problems.push({ where: item.id, what: `решатель упал: ${(e as Error).message}` });
    return;
  }
  const uItem: Uslovie = {
    text: item.text,
    ...(item.posle ? { posle: item.posle } : {}),
    ...(u.ris ? { ris: u.ris } : {}),
  };
  itog.solved.push({ where: item.id, item, u: uItem, s });
  if (Math.abs(s.answer - item.answer) > 1e-9) {
    problems.push({ where: item.id, what: `ответ решателя ${s.answer}, в банке ${item.answer}` });
  }
  const p2 = proto.pereschet(item.params);
  if (Math.abs(p2 - item.answer) > 1e-9) {
    problems.push({ where: item.id, what: `независимый пересчёт ${p2}, в банке ${item.answer}` });
  }
  if (!otvetEge(item.answer, znakovOtveta(item.prototypeId))) {
    problems.push({ where: item.id, what: `ответ не для бланка: ${item.answer}` });
  }
  if (!dopustimo(proto, item.params, item.answer)) {
    problems.push({
      where: item.id,
      what: 'не проходит правила подбора (суммы, знак, вид ответа)',
    });
  }
  for (const sm of proto.summy(item.params)) {
    const sum = sm.doli.reduce((a, b) => a + b, 0);
    if (sm.nado === null ? sm.doli.some((x) => x < 0) : sum !== sm.nado) {
      problems.push({
        where: item.id,
        what: `${sm.chto}: сумма ${sum}, нужно ${sm.nado ?? '≥ 0'}`,
      });
    }
  }
  if (!TEKST_KAK_V_ISTOCHNIKE.has(item.id)) {
    if (u.text !== item.text || (u.posle ?? '') !== (item.posle ?? '')) {
      problems.push({
        where: item.id,
        what: 'текст в банке не совпадает со сборкой прототипа по параметрам',
      });
    }
  }
  if (item.prototypeId === 'P10') {
    const { E, D, eps } = item.params as { E: number; D: number; eps: number };
    if (!(eps * eps > D)) {
      problems.push({ where: item.id, what: `Чебышёв: ε² = ${eps * eps} не больше D = ${D}` });
    }
    if (
      !item.text.includes(
        `\\leqslant${String(E - eps)
          .replace('.', '{,}')
          .replace('-', '-')}`,
      )
    ) {
      problems.push({ where: item.id, what: 'в событии не видно E − ε' });
    }
  }
  if (item.prototypeId === 'P12') {
    const xs = item.params.xs as number[];
    if (xs.length < 4 || xs.length > 7) {
      problems.push({ where: item.id, what: `в выборке ${xs.length} значений, нужно 4–7` });
    }
    if (xs.some((x) => Math.abs(x * 10 - Math.round(x * 10)) > 1e-9)) {
      problems.push({ where: item.id, what: 'значения выборки — не десятые' });
    }
  }
  proveritReshenie(item.id, s, problems);
  proveritTeksty(item.id, vseTeksty(uItem, s), typeset, problems);
  proveritRis(item.id, u.ris, problems, item.prototypeId);
  for (const e of s.etapy) {
    if (e.ris) proveritRis(`${item.id} разбор`, e.ris, problems, item.prototypeId);
  }
}

export function checkBank(typeset: (tex: string) => string): Itog {
  const problems: Problem[] = [];
  const itog: Itog = { problems, solved: [], statistika: [] };

  /* ── Исходные задачи ── */
  if (ISTOCHNIKI.length !== ISTOCHNIKOV) {
    problems.push({
      where: 'источники',
      what: `задач ${ISTOCHNIKI.length}, ожидалось ${ISTOCHNIKOV}`,
    });
  }
  ISTOCHNIKI.forEach((it, i) => {
    if (it.no !== i + 1) {
      problems.push({ where: it.id, what: `номер ${it.no}, ожидался ${i + 1}` });
    }
    if (!it.gde) {
      problems.push({ where: it.id, what: 'не указано, где задача в источнике' });
    }
    if (it.source === 'analog') {
      problems.push({ where: it.id, what: 'исходная задача помечена как аналог' });
    }
  });
  for (const p of PROTOTYPES) {
    if (!ISTOCHNIKI.some((s) => s.prototypeId === p.id)) {
      problems.push({ where: p.id, what: 'нет ни одной исходной задачи' });
    }
  }
  /* S16 хранится «как в источнике»: числа текста — те же, что в параметрах. */
  for (const id of TEKST_KAK_V_ISTOCHNIKE) {
    const it = ISTOCHNIKI.find((s) => s.id === id);
    const xs = (it?.params.xs as number[] | undefined) ?? [];
    const vTekste = (it?.text.match(/: ([\d, ]+)\./)?.[1] ?? '')
      .replace(/(\d),(\d)/g, '$1.$2')
      .split(', ')
      .map(Number);
    if (JSON.stringify(vTekste) !== JSON.stringify(xs)) {
      problems.push({
        where: id,
        what: `числа условия ${JSON.stringify(vTekste)} не совпадают с параметрами ${JSON.stringify(xs)}`,
      });
    }
  }

  const otpechatki = new Map<string, string>();
  const vse: BankItem[] = [...ISTOCHNIKI, ...Object.values(ANALOGI_PO_PROTOTIPAM).flat()];
  for (const item of vse) {
    proveritZadachu(item, typeset, problems, itog);
    const fp = otpechatok(item.prototypeId, item.params);
    const byl = otpechatki.get(fp);
    if (byl !== undefined) {
      problems.push({ where: item.id, what: `тот же набор чисел, что у ${byl}` });
    }
    otpechatki.set(fp, item.id);
  }

  /* ── Аналоги ── */
  const zanyatye = ISTOCHNIKI.map((s) => otpechatok(s.prototypeId, s.params));
  let strogih = 0;
  let nestrogih = 0;
  let granicaVne = 0;
  for (const p of PROTOTYPES) {
    const a = ANALOGI_PO_PROTOTIPAM[p.id] ?? [];
    const where = `${p.id} аналоги`;
    if (a.length !== ANALOGOV) {
      problems.push({ where, what: `аналогов ${a.length}, нужно ${ANALOGOV}` });
    }
    const syuzh = a.filter((x) => x.stil === 'syuzhet');
    if (syuzh.length !== SYUZHETNYH || a.filter((x) => x.stil === 'fipi').length !== V_STILE_FIPI) {
      problems.push({
        where,
        what: `сюжетных ${syuzh.length}, в стиле ФИПИ ${a.length - syuzh.length}; нужно 20 и 30`,
      });
    }
    for (const tema of TEMY) {
      const n = syuzh.filter((x) => x.tema === tema).length;
      if (n !== 2) {
        problems.push({ where, what: `тема «${tema}»: ${n} задач, нужно 2` });
      }
    }
    const poSyuzhetu = new Map<string, number>();
    syuzh.forEach((x) => {
      const k = String(x.params.sj ?? x.params.tovar ?? '');
      poSyuzhetu.set(k, (poSyuzhetu.get(k) ?? 0) + 1);
    });
    for (const [k, n] of poSyuzhetu) {
      if (n > 2) problems.push({ where, what: `сюжет «${k}» встречается ${n} раз` });
    }
    syuzh.forEach((x, j) => {
      const ozhid = syuzhetZadachi(p.id, j);
      if (x.params.sj !== ozhid.key && x.params.tovar !== ozhid.key) {
        problems.push({ where: x.id, what: `сюжет ${String(x.params.sj)} вместо ${ozhid.key}` });
      }
    });
    if (a.some((x) => x.source !== 'analog')) {
      problems.push({ where, what: 'аналог без пометки «не из открытого банка»' });
    }
    const cnt = new Map<number, number>();
    a.forEach((x) => cnt.set(x.answer, (cnt.get(x.answer) ?? 0) + 1));
    const pr = pravila(p.id);
    if (cnt.size < pr.minRaznyh) {
      problems.push({ where, what: `разных ответов ${cnt.size}, нужно не меньше ${pr.minRaznyh}` });
    }
    const max = Math.max(0, ...cnt.values());
    if (max > pr.maxPovtor) {
      problems.push({
        where,
        what: `ответ повторяется ${max} раз, можно не больше ${pr.maxPovtor}`,
      });
    }
    if (p.id === 'P11') {
      for (const x of [...a, ...ISTOCHNIKI.filter((s) => s.prototypeId === 'P11')]) {
        const prm = x.params as { a: number; b: number; zl: string; zr: string; xs: number[] };
        for (const z of [prm.zl, prm.zr]) {
          if (z === 'lt') strogih += 1;
          else nestrogih += 1;
        }
        if (!prm.xs.includes(prm.a) || !prm.xs.includes(prm.b)) granicaVne += 1;
      }
    }
    if (p.id === 'P15') {
      for (const x of a) {
        const D = x.answer * x.answer;
        if (Math.abs(D * 1e4 - Math.round(D * 1e4)) > 1e-6) {
          problems.push({
            where: x.id,
            what: `σ = ${x.answer}, D = ${D} — не квадрат конечной дроби`,
          });
        }
      }
    }
    itog.statistika.push(
      `${p.id}: исходных ${ISTOCHNIKI.filter((s) => s.prototypeId === p.id).length}, аналогов ${a.length} (сюжетных ${syuzh.length}), разных ответов ${cnt.size}, макс. повтор ${max}`,
    );
    if (!GENERATORY[p.id]) {
      problems.push({ where, what: 'нет генератора аналогов' });
      continue;
    }
    const zanovo = podobratAnalogi(p.id, zanyatye);
    if (JSON.stringify(zanovo) !== JSON.stringify(a)) {
      problems.push({ where, what: 'файл аналогов устарел — запустите pnpm build:bank-6' });
    }
  }
  if (strogih === 0 || nestrogih === 0) {
    problems.push({
      where: 'P11',
      what: `строгих границ ${strogih}, нестрогих ${nestrogih} — нужны и те и другие`,
    });
  }
  if (granicaVne < 5) {
    problems.push({
      where: 'P11',
      what: `задач с границей не из значений ${granicaVne}, нужно хотя бы 5`,
    });
  }
  itog.statistika.push(
    `6.11: строгих границ ${strogih}, нестрогих ${nestrogih}, задач с границей не из значений ${granicaVne}.`,
  );
  return itog;
}
