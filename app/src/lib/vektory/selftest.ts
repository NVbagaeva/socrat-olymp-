/**
 * Самопроверка движка рисунков задания №2.
 *
 * Запускается служебным скриптом scripts/check-vektory.mjs; в браузер
 * не попадает. Проверяет то, что обещано движку: остриё ровно в узле
 * сетки, стержень и линии осей кончаются у основания наконечника,
 * подписи катетов без знаков, ни одна подпись не
 * касается отрезков, осей и других подписей, в режиме без сетки нет
 * сетки и есть проекции, катеты рисуются только по явному hints,
 * окно всегда вмещает векторы с запасом в клетку.
 *
 * Проверка идёт по отчёту движка и по разметке SVG одновременно:
 * отчёт говорит, куда движок поставил остриё, а разметка — куда он
 * его нарисовал. Расхождение между ними — тоже ошибка.
 *
 * Вторая половина — генераторы и банк: на тысяче seed каждого
 * прототипа ответ целый или конечная десятичная дробь не длиннее
 * двух знаков, независимый пересчёт сходится, модули координат в
 * пределах, рисунок чист по ограничениям (пересчитанным здесь
 * заново, не доверяя движку), катетов на рисунке задачи нет,
 * формулы собираются KaTeX; в банке десять разных вариантов.
 */

import { THEME } from '@/lib/graph/renderer.js';
import { nice, ru } from '../vychisleniya/numbers';
import { BANK } from './bank';
import { generate, risunokChist } from './generate';
import { pointSegDist, rectGap, segRectDist, segSegDist, type Rect, type Seg } from './geometry';
import { OBRAZTSY } from './obraztsy';
import { PROTOTYPES } from './prototypes';
import { kosoy } from './troyki';
import { emptyReport, renderVectorPlane } from './render';
import type { Box, Generated, Report, Risunok, Tochka, Vektor } from './types';

export interface Problem {
  where: string;
  what: string;
}

export interface RendererReport {
  rendered: number;
  problems: Problem[];
}

function rect(b: Box): Rect {
  return { left: b.x - b.halfW, right: b.x + b.halfW, top: b.y - b.halfH, bottom: b.y + b.halfH };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Проверка одного рисунка: собирает SVG и сверяет отчёт с разметкой. */
export function checkRisunok(where: string, config: Risunok): Problem[] {
  const problems: Problem[] = [];
  const push = (what: string) => problems.push({ where, what });
  const report: Report = emptyReport();
  const svg = renderVectorPlane(config, report);

  if (/NaN|undefined|Infinity/.test(svg)) {
    push('в SVG есть NaN, undefined или Infinity');
  }
  for (const p of report.problems) {
    push(`движок: ${p}`);
  }

  const { window: win, cell } = report;
  const pad = THEME.geometry.pad;
  const sx = (x: number) => pad + (x - win.xmin) * cell;
  const sy = (y: number) => pad + (win.ymax - y) * cell;

  /* Окно: каждый конец вектора не ближе клетки к краю. */
  for (const v of config.vectors) {
    for (const p of [v.from, v.to]) {
      if (
        p[0] < win.xmin + 1 ||
        p[0] > win.xmax - 1 ||
        p[1] < win.ymin + 1 ||
        p[1] > win.ymax - 1
      ) {
        push(`конец вектора ${v.name} (${p[0]}; ${p[1]}) ближе клетки к краю окна`);
      }
    }
  }
  if (win.xmin > 0 || win.ymin > 0 || win.xmax < 1 || win.ymax < 1) {
    push('начало координат вне окна');
  }

  /* Остриё: отчёт и разметка указывают на узел сетки. */
  if (report.vectors.length !== config.vectors.length) {
    push(`в отчёте ${report.vectors.length} векторов вместо ${config.vectors.length}`);
  }
  for (const rv of report.vectors) {
    const tx = round2(sx(rv.to[0]));
    const ty = round2(sy(rv.to[1]));
    if (round2(rv.tip.x) !== tx || round2(rv.tip.y) !== ty) {
      push(`остриё ${rv.name} в отчёте (${rv.tip.x}; ${rv.tip.y}), узел (${tx}; ${ty})`);
    }
    const head = new RegExp(
      `data-vector="${rv.name}">.*?<path class="vp-head" d="M([-\\d.]+) ([-\\d.]+)L`,
    ).exec(svg);
    if (head === null) {
      push(`в SVG нет наконечника ${rv.name}`);
    } else if (Number(head[1]) !== tx || Number(head[2]) !== ty) {
      push(`остриё ${rv.name} в SVG (${head[1]}; ${head[2]}), узел (${tx}; ${ty})`);
    }
    const shaft = new RegExp(
      `data-vector="${rv.name}"><path class="vp-shaft" d="M([-\\d.]+) ([-\\d.]+)L([-\\d.]+) ([-\\d.]+)"`,
    ).exec(svg);
    if (shaft === null) {
      push(`в SVG нет стержня ${rv.name}`);
    } else {
      const fx = round2(sx(rv.from[0]));
      const fy = round2(sy(rv.from[1]));
      if (Number(shaft[1]) !== fx || Number(shaft[2]) !== fy) {
        push(`начало стержня ${rv.name} в SVG (${shaft[1]}; ${shaft[2]}), узел (${fx}; ${fy})`);
      }
      const len = Math.hypot(tx - fx, ty - fy);
      const endLen = Math.hypot(Number(shaft[3]) - fx, Number(shaft[4]) - fy);
      /* Стержень кончается у основания наконечника: не выходит за него
         дальше половины своей толщины и не отстаёт больше чем на пиксель. */
      const base = len - report.head.len;
      if (endLen > base + report.head.shaftWidth / 2) {
        push(`стержень ${rv.name} выходит за основание наконечника на ${round2(endLen - base)} px`);
      } else if (endLen < base - 1) {
        push(`стержень ${rv.name} не доходит до наконечника на ${round2(base - endLen)} px`);
      }
    }
    if (rv.label === null) {
      push(`у вектора ${rv.name} нет подписи`);
    }
  }

  /* Линии осей кончаются у основания наконечников, остриё — сама
     точка tipX / tipY. */
  const axes = /class="vp-axes" d="M[-\d.]+ [-\d.]+H([-\d.]+)M[-\d.]+ [-\d.]+V([-\d.]+)"/.exec(svg);
  const heads = /class="vp-axes-heads" d="M([-\d.]+) ([-\d.]+)L.*?ZM([-\d.]+) ([-\d.]+)L/.exec(svg);
  if (axes === null || heads === null) {
    push('в SVG нет осей или их наконечников');
  } else {
    const halfAxis = THEME.width.axis / 2;
    const baseX = report.axes.tipX - report.axes.arrowLen;
    const baseY = report.axes.tipY + report.axes.arrowLen;
    if (Number(axes[1]) > baseX + halfAxis || Number(axes[1]) < baseX - 1) {
      push(`линия оси x кончается в ${axes[1]}, основание наконечника ${round2(baseX)}`);
    }
    if (Number(axes[2]) < baseY - halfAxis || Number(axes[2]) > baseY + 1) {
      push(`линия оси y кончается в ${axes[2]}, основание наконечника ${round2(baseY)}`);
    }
    if (
      Number(heads[1]) !== round2(report.axes.tipX) ||
      Number(heads[2]) !== round2(report.axes.x)
    ) {
      push(
        `остриё оси x в SVG (${heads[1]}; ${heads[2]}), в отчёте (${report.axes.tipX}; ${report.axes.x})`,
      );
    }
    if (
      Number(heads[3]) !== round2(report.axes.y) ||
      Number(heads[4]) !== round2(report.axes.tipY)
    ) {
      push(
        `остриё оси y в SVG (${heads[3]}; ${heads[4]}), в отчёте (${report.axes.y}; ${report.axes.tipY})`,
      );
    }
  }
  if (svg.includes('class="vp-head"') && /class="vp-head"[^>]*stroke="(?!none)/.test(svg)) {
    push('у наконечника вектора есть обводка: она вылезла бы за узел');
  }

  /* Подписи: никаких пересечений между собой и с линиями. */
  const boxes = report.boxes;
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (rectGap(rect(boxes[i]!), rect(boxes[j]!)) < 0) {
        push(`подписи «${boxes[i]!.id}» и «${boxes[j]!.id}» перекрываются`);
      }
    }
  }
  const axisX = sy(0);
  const axisY = sx(0);
  const lines = [
    {
      seg: {
        x1: sx(win.xmin),
        y1: axisX,
        x2: sx(win.xmax) + THEME.geometry.arrowExtend,
        y2: axisX,
      },
      what: 'ось x',
    },
    {
      seg: {
        x1: axisY,
        y1: sy(win.ymin),
        x2: axisY,
        y2: sy(win.ymax) - THEME.geometry.arrowExtend,
      },
      what: 'ось y',
    },
    ...config.vectors.map((v) => ({
      seg: { x1: sx(v.from[0]), y1: sy(v.from[1]), x2: sx(v.to[0]), y2: sy(v.to[1]) },
      what: `вектор ${v.name}`,
    })),
  ];
  for (const b of boxes) {
    if (b.kind === 'tick' || b.kind === 'axisName') {
      /* Числа и имена осей стоят у своих осей по построению; их
         проверяет только пересечение с векторами. */
      for (const l of lines.slice(2)) {
        if (segRectDist(l.seg, rect(b)) < 1.6) {
          push(`${l.what} проходит по подписи «${b.id}»`);
        }
      }
      continue;
    }
    for (const l of lines) {
      if (segRectDist(l.seg, rect(b)) < 1.6) {
        push(`подпись «${b.id}» касается: ${l.what}`);
      }
    }
    const r = rect(b);
    if (r.left < 0 || r.top < 0 || r.right > report.width || r.bottom > report.height) {
      push(`подпись «${b.id}» выходит за рисунок`);
    }
  }

  /* Режимы. */
  const hasGrid = svg.includes('class="vp-grid"');
  if (config.grid === false) {
    if (hasGrid) push('в режиме без сетки нарисована сетка');
    const expectProj = config.vectors
      .flatMap((v) => [v.from, v.to])
      .filter((p) => p[0] !== 0 && p[1] !== 0).length;
    const projCount = (svg.match(/class="vp-proj" d="([^"]*)"/)?.[1] ?? '').split('M').length - 1;
    if (projCount !== expectProj * 2) {
      push(`проекций ${projCount}, ожидалось ${expectProj * 2}`);
    }
    if (svg.includes('>1</text>') && !report.ticks.some((t) => t.at === 1)) {
      push('в режиме без сетки подписана единица, которой нет среди координат');
    }
  } else if (!hasGrid) {
    push('нет сетки');
  }
  const hintCount = (svg.match(/data-hint=/g) ?? []).length;
  if (config.hints === true && config.grid !== false) {
    const expect =
      config.vectors.reduce(
        (n, v) => n + (v.to[0] !== v.from[0] ? 1 : 0) + (v.to[1] !== v.from[1] ? 1 : 0),
        0,
      ) + config.vectors.length;
    if (hintCount !== expect) {
      push(`элементов подсказки ${hintCount}, ожидалось ${expect}`);
    }
    for (const v of config.vectors) {
      const dx = v.to[0] - v.from[0];
      const dy = v.to[1] - v.from[1];
      for (const d of [dx, dy]) {
        if (d === 0) continue;
        const text = String(Math.abs(d));
        if (!svg.includes(`>${text}</text>`)) {
          push(`нет подписи катета «${text}» у вектора ${v.name}`);
        }
      }
    }
    /* Подписи катетов — длины по модулю: ни плюса, ни минуса. */
    for (const m of svg.matchAll(/<g data-hint="[^"]*"><text[^>]*>([^<]*)<\/text>/g)) {
      if (/[+\-\u2212]/.test(m[1] ?? '')) {
        push(`в подписи катета есть знак: «${m[1]}»`);
      }
    }
  } else if (hintCount !== 0) {
    push(`катеты нарисованы без hints: ${hintCount} элементов`);
  }
  if (report.hints !== (config.hints === true && config.grid !== false)) {
    push('report.hints не совпадает с конфигом');
  }
  return problems;
}

/* ── Случайные рисунки по ограничениям генератора ─────────────── */

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function randomConfig(seed: number): Risunok | null {
  const r = lcg(seed);
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const count = int(2, 3);
  const win =
    count === 3
      ? { xmin: -1, xmax: 13, ymin: -2, ymax: 11 }
      : { xmin: -1, xmax: 9, ymin: -2, ymax: 7 };
  const names = ['a', 'b', 'c'];
  const vectors: Vektor[] = [];
  for (let attempt = 0; attempt < 200 && vectors.length < count; attempt += 1) {
    const x1 = int(win.xmin + 1, win.xmax - 1);
    const y1 = int(win.ymin + 1, win.ymax - 1);
    const dx = int(-6, 6);
    const dy = int(-6, 6);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    if (x2 < win.xmin + 1 || x2 > win.xmax - 1 || y2 < win.ymin + 1 || y2 > win.ymax - 1) continue;
    if (Math.hypot(dx, dy) < 2) continue;
    if ((y1 === 0 && y2 === 0) || (x1 === 0 && x2 === 0)) continue;
    const probe: Risunok = {
      vectors: [...vectors, { name: names[vectors.length]!, from: [x1, y1], to: [x2, y2] }],
      window: win,
    };
    const rep = emptyReport();
    renderVectorPlane(probe, rep);
    if (rep.problems.some((p) => /пересекаются|ближе|закрывает|не помещается/.test(p))) continue;
    vectors.push(probe.vectors[probe.vectors.length - 1]!);
  }
  if (vectors.length < count) return null;
  const mode = r();
  return { vectors, window: win, hints: mode < 0.3, grid: mode > 0.85 ? false : true };
}

/**
 * Образцы демо-страницы плюс случайные рисунки по ограничениям.
 *
 * Случайный рисунок берётся, только если движок счёл его чистым
 * (пустой report.problems): тогда независимая геометрия обязана
 * подтвердить, что подписи и правда ничего не касаются. Доля чистых
 * рисунков тоже проверяется: слишком строгий движок не оставил бы
 * генератору места.
 */
export function checkRenderer(randomCount: number): RendererReport {
  const problems: Problem[] = [];
  let rendered = 0;
  let clean = 0;
  let tried = 0;
  for (const o of OBRAZTSY) {
    problems.push(...checkRisunok(`образец ${o.id}`, o.config));
    rendered += 1;
  }
  for (let seed = 1; seed <= randomCount; seed += 1) {
    const config = randomConfig(seed);
    if (config === null) continue;
    tried += 1;
    const rep = emptyReport();
    renderVectorPlane(config, rep);
    if (rep.problems.length > 0) continue;
    clean += 1;
    problems.push(...checkRisunok(`случайный seed=${seed}`, config));
    rendered += 1;
  }
  if (tried > 20 && clean < tried * 0.5) {
    problems.push({
      where: 'случайные рисунки',
      what: `движок принял только ${clean} из ${tried}`,
    });
  }
  return { rendered, problems };
}

/* ── Генераторы и банк ──────────────────────────────────────────── */

export interface GenReport {
  prototypes: number;
  generated: number;
  problems: Problem[];
}

type Typeset = ((tex: string) => void) | null;

/** Формулы условия и разбора: всё между долларами. */
function formulas(task: Generated): string[] {
  const out: string[] = [];
  const texts = [task.uslovie, ...task.shagi.flatMap((s) => [s.zagolovok, ...s.stroki])];
  for (const text of texts) {
    for (const match of text.matchAll(/\$([^$]+)\$/g)) {
      out.push(match[1] as string);
    }
  }
  return out;
}

/** Координаты всех векторов задачи по подписи «x,y|x,y». */
function vektoryIzSignature(task: Generated): Tochka[] {
  if (!/^-?\d+,-?\d+(\|-?\d+,-?\d+)*$/.test(task.signature)) {
    return [];
  }
  return task.signature.split('|').map((p) => p.split(',').map(Number) as unknown as Tochka);
}

/** Ограничения рисунка, пересчитанные независимо от движка. */
function checkRisunokZadachi(where: string, risunok: Risunok): Problem[] {
  const problems: Problem[] = [];
  const push = (what: string) => problems.push({ where, what });
  if (risunok.hints === true) {
    push('на рисунке задачи включены катеты');
  }
  const win = typeof risunok.window === 'object' ? risunok.window : null;
  const segs: { v: Vektor; seg: Seg }[] = risunok.vectors.map((v) => ({
    v,
    seg: { x1: v.from[0], y1: v.from[1], x2: v.to[0], y2: v.to[1] },
  }));
  for (const { v, seg } of segs) {
    for (const p of [v.from, v.to]) {
      if (!Number.isInteger(p[0]) || !Number.isInteger(p[1]))
        push(`вектор ${v.name}: координаты не целые`);
      if (
        win !== null &&
        (p[0] < win.xmin + 1 || p[0] > win.xmax - 1 || p[1] < win.ymin + 1 || p[1] > win.ymax - 1)
      ) {
        push(`вектор ${v.name}: конец ближе клетки к краю окна`);
      }
    }
    if (Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) < 2) push(`вектор ${v.name} короче 2 клеток`);
    if ((seg.y1 === 0 && seg.y2 === 0) || (seg.x1 === 0 && seg.x2 === 0))
      push(`вектор ${v.name} лежит на оси`);
  }
  for (let i = 0; i < segs.length; i += 1) {
    for (let j = i + 1; j < segs.length; j += 1) {
      const a = segs[i]!;
      const b = segs[j]!;
      const shared = a.seg.x1 === b.seg.x1 && a.seg.y1 === b.seg.y1;
      const dist = shared
        ? Math.min(pointSegDist(a.seg.x2, a.seg.y2, b.seg), pointSegDist(b.seg.x2, b.seg.y2, a.seg))
        : segSegDist(a.seg, b.seg);
      if (dist < 1) push(`векторы ${a.v.name} и ${b.v.name} ближе клетки или пересекаются`);
    }
  }
  if (!risunokChist(risunok)) {
    push('движок нашёл нарушения на рисунке задачи');
  }
  const svg = renderVectorPlane(risunok);
  if (svg.includes('data-hint')) push('в SVG рисунка задачи есть катеты');
  return problems;
}

/** Проверка одной задачи. */
export function checkTask(task: Generated, typeset: Typeset): Problem[] {
  const where = `${task.prototype} seed=${task.seed}`;
  const problems: Problem[] = [];
  const push = (what: string) => problems.push({ where, what });
  const prototype = PROTOTYPES.find((p) => p.id === task.prototype);
  if (!Number.isFinite(task.otvet)) {
    push(`ответ не число: ${String(task.otvet)}`);
  } else if (!nice(task.otvet, 2)) {
    push(`ответ не целый и не десятичная дробь до двух знаков: ${task.otvet}`);
  }
  if (!Number.isFinite(task.proverka) || Math.abs(task.proverka - task.otvet) > 1e-6) {
    push(`независимый счёт ${task.proverka} не сходится с ответом ${task.otvet}`);
  }
  if (Math.abs(task.otvet) > 1000) push(`ответ слишком велик: ${task.otvet}`);
  for (const p of vektoryIzSignature(task)) {
    if (Math.abs(p[0]) > 31 || Math.abs(p[1]) > 31)
      push(`координата больше 31: (${p[0]}; ${p[1]})`);
  }
  if (task.shagi.length < 2) push('в разборе меньше двух шагов');
  const last = task.shagi[task.shagi.length - 1];
  if (last === undefined || last.zagolovok !== 'Ответ') {
    push('последний шаг — не «Ответ»');
  } else {
    const tail = (last.stroki[0] ?? '').replace(/\{,\}/g, ',').replace(/[$\s]/g, '');
    if (tail !== ru(task.otvet)) push(`шаг «Ответ» содержит «${tail}», а ответ ${ru(task.otvet)}`);
  }
  for (const sh of task.shagi) {
    if (sh.zagolovok.trim() === '' || sh.stroki.length === 0)
      push('шаг без заголовка или без строк');
  }
  const allText = task.uslovie + task.shagi.map((s) => s.zagolovok + s.stroki.join('')).join('');
  if (/NaN|Infinity|undefined/.test(allText)) push('NaN или undefined в тексте');
  if (prototype !== undefined) {
    const nuzhenRisunok = prototype.format === 'grid' || prototype.format === 'nogrid';
    if (nuzhenRisunok !== (task.risunok !== null)) push('рисунок есть не у того формата');
    if (task.risunok !== null) {
      if (prototype.format === 'nogrid' && task.risunok.grid !== false)
        push('рисунок без сетки с сеткой');
      if (prototype.format === 'grid' && task.risunok.grid === false)
        push('рисунок на сетке без сетки');
      problems.push(...checkRisunokZadachi(where, task.risunok));
    }
  }
  if (typeset !== null) {
    for (const tex of formulas(task)) {
      try {
        typeset(tex);
      } catch (error) {
        push(`KaTeX не принял «${tex}»: ${String(error)}`);
      }
    }
  }
  return problems;
}

/** Генераторы на многих seed: каждый прототип. */
export function checkGenerators(seeds: number, typeset: Typeset): GenReport {
  const problems: Problem[] = [];
  let generated = 0;
  for (const prototype of PROTOTYPES) {
    const seen = new Map<string, number>();
    let vektorov = 0;
    let pryamykh = 0;
    let otritsatelnykh = 0;
    for (let i = 0; i < seeds; i += 1) {
      const seed = `t${i}`;
      let task: Generated;
      try {
        task = generate(prototype.id, seed);
      } catch (error) {
        problems.push({ where: `${prototype.id} seed=${seed}`, what: String(error) });
        continue;
      }
      generated += 1;
      problems.push(...checkTask(task, typeset));
      seen.set(task.uslovie + task.signature, (seen.get(task.uslovie + task.signature) ?? 0) + 1);
      if (task.risunok !== null) {
        for (const v of task.risunok.vectors) {
          vektorov += 1;
          if (!kosoy([v.to[0] - v.from[0], v.to[1] - v.from[1]])) pryamykh += 1;
        }
      }
      if (prototype.gruppa === 'C' && task.otvet < 0) otritsatelnykh += 1;
    }
    const max = Math.max(...seen.values());
    if (seeds >= 100 && max > seeds / 4) {
      problems.push({
        where: prototype.id,
        what: `одна задача повторилась ${max} раз из ${seeds}`,
      });
    }
    /* Большинство векторов на рисунках — косые. */
    if (vektorov >= 100 && pryamykh > vektorov / 4) {
      problems.push({ where: prototype.id, what: `прямых векторов ${pryamykh} из ${vektorov}` });
    }
    if (
      prototype.gruppa === 'C' &&
      seeds >= 100 &&
      (otritsatelnykh < seeds / 5 || otritsatelnykh > seeds / 2)
    ) {
      problems.push({
        where: prototype.id,
        what: `отрицательных косинусов ${otritsatelnykh} из ${seeds}, ждём около трети`,
      });
    }
  }
  return { prototypes: PROTOTYPES.length, generated, problems };
}

/**
 * Банк: десять seed на прототип, условия и наборы векторов разные,
 * ответы не повторяются, вид условия — не чаще трёх раз. У косинуса (C1, C2) ответ с двумя знаками
 * после запятой бывает только одним из восьми значений (±0,28; ±0,6;
 * ±0,8; ±0,96), поэтому там ответ допускается дважды.
 */
export function checkBank(typeset: Typeset): GenReport {
  const problems: Problem[] = [];
  let generated = 0;
  const ids = new Set(PROTOTYPES.map((p) => p.id));
  for (const entry of BANK) {
    const where = `банк ${entry.prototype}`;
    if (!ids.has(entry.prototype)) {
      problems.push({ where, what: 'нет такого прототипа' });
      continue;
    }
    ids.delete(entry.prototype);
    if (entry.variants.length !== 10) {
      problems.push({ where, what: `вариантов ${entry.variants.length}, нужно 10` });
    }
    const statements = new Set<string>();
    const signatures = new Set<string>();
    const answers = new Map<string, number>();
    const vidy = new Map<string, number>();
    const maxAnswers = entry.prototype.startsWith('C') ? 2 : 1;
    entry.variants.forEach((v, i) => {
      if (v.n !== i + 1) problems.push({ where, what: `номер ${v.n} на месте ${i + 1}` });
      let task: Generated;
      try {
        task = generate(entry.prototype, v.seed);
      } catch (error) {
        problems.push({ where: `${where} seed=${v.seed}`, what: String(error) });
        return;
      }
      generated += 1;
      problems.push(...checkTask(task, typeset));
      if (statements.has(task.uslovie + task.signature))
        problems.push({ where, what: `повтор условия: ${v.seed}` });
      statements.add(task.uslovie + task.signature);
      if (signatures.has(task.signature))
        problems.push({ where, what: `повтор набора векторов: ${v.seed}` });
      signatures.add(task.signature);
      const key = ru(task.otvet);
      answers.set(key, (answers.get(key) ?? 0) + 1);
      if ((answers.get(key) as number) > maxAnswers)
        problems.push({ where, what: `ответ ${key} повторяется` });
      if (task.vid !== undefined) {
        vidy.set(task.vid, (vidy.get(task.vid) ?? 0) + 1);
        if ((vidy.get(task.vid) as number) > 3)
          problems.push({ where, what: `вид условия ${task.vid} чаще трёх раз` });
      }
    });
  }
  for (const id of ids) {
    problems.push({ where: `банк ${id}`, what: 'прототипа нет в банке' });
  }
  return { prototypes: BANK.length, generated, problems };
}
