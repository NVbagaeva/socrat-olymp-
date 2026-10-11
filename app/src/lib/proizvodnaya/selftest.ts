/**
 * Автотест задания №9: движок графиков, генераторы всех прототипов,
 * банк. Запускается из scripts/check-proizvodnaya.mjs (`pnpm test:proizvodnaya`).
 *
 * Главная проверка — «ответ из данных узлов»: для каждого сгенерированного
 * задания ответ заново считается по рисунку и запросу (reshit.ts: выборка,
 * знаки, пересечения оси, интеграл) и сравнивается с ответом, заложенным
 * в прототип. Остальное — читаемость: нули и экстремумы в узлах сетки,
 * пересечение оси поперёк, отмеченные точки не на нулях, подписи не
 * пересекаются ни друг с другом, ни с кривой; на рисунке ученика нет
 * построений; формулы собираются KaTeX строго; в подсказках у каждого
 * неверного варианта есть объяснение.
 */

import { rngOf } from '../vychisleniya/rng';
import { ekstremumyUzlov, nuliUzlov } from './chtenie';
import { generate } from './generate';
import { figura, volna, volnaP } from './krivye';
import { PROTOTYPES } from './prototypes';
import { renderFigura, pustoyOtchet, type Otchet } from './render';
import { SHAG, postroit } from './spline';
import { ekstremumy, granitsy, nuli, problemy, reshit } from './reshit';
import { ru } from './tex';
import type { Figura, Generated } from './types';
import { pointSegDist, rectGap, segRectDist, type Rect, type Seg } from '../vektory/geometry';

/**
 * Порог разнообразия: сколько различных ответов должен давать прототип
 * на серии из 100+ seed. Исключений нет: если у типа задач ответов
 * мало, генератор расширяется (число узлов, отрезок, число меток).
 */
export const MIN_RAZNYH_OTVETOV = 6;

export interface Problem {
  where: string;
  what: string;
}

export interface Report {
  prototypes: number;
  generated: number;
  problems: Problem[];
  ms?: Record<string, number>;
}

/** Проверка текста: возвращает список замечаний. Подставляется скриптом. */
export type TextCheck = (text: string) => string[];

function boxRect(b: Otchet['boxes'][number]): Rect {
  return { left: b.x - b.halfW, right: b.x + b.halfW, top: b.y - b.halfH, bottom: b.y + b.halfH };
}

/** Рисунок ученика не содержит построений. */
export function studentSvgChist(svg: string): string[] {
  const out: string[] = [];
  if (svg.includes('stroke-dasharray')) {
    out.push('на рисунке ученика есть пунктир');
  }
  for (const cls of ['pr-aux', 'pr-aux-seg', 'pr-tri', 'pr-tri-legs', 'pr-alpha', 'pr-beta']) {
    if (svg.includes(`class="${cls}"`)) {
      out.push(`на рисунке ученика есть построение ${cls}`);
    }
  }
  if (/d="[^"]*A[\d.-]/.test(svg)) {
    out.push('на рисунке ученика есть дуга');
  }
  if (svg.includes('?')) {
    out.push('на рисунке ученика есть подпись «?»');
  }
  return out;
}

/** Подписи не пересекаются друг с другом и с кривой; метки — на целых абсциссах. */
function podpisiChisty(fig: Figura, rep: Otchet): string[] {
  const out: string[] = [];
  const boxes = rep.boxes;
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (
        rectGap(
          boxRect(boxes[i] as Otchet['boxes'][number]),
          boxRect(boxes[j] as Otchet['boxes'][number]),
        ) < 0
      ) {
        out.push(
          `подписи ${(boxes[i] as Otchet['boxes'][number]).id} и ${(boxes[j] as Otchet['boxes'][number]).id} пересекаются`,
        );
      }
    }
  }
  /* Кривая из узлов: плотная ломаная в пикселях окна. */
  if (fig.rezhim === 'f' || fig.rezhim === 'F' || fig.rezhim === 'fprime') {
    const spl = postroit(fig.uzly);
    const cell = rep.cell;
    const g = 38;
    const sx = (x: number) => g + (x - fig.okno.xmin) * cell;
    const sy = (y: number) => g + (fig.okno.ymax - y) * cell;
    const first = fig.uzly[0];
    const last = fig.uzly[fig.uzly.length - 1];
    if (first !== undefined && last !== undefined) {
      const pts: [number, number][] = [];
      for (let x = first.x; x <= last.x + 1e-9; x += 0.05) {
        pts.push([sx(x), sy(spl.y(x))]);
      }
      /* Дуга угла α не пересекает и не касается кривой. */
      for (const arc of rep.dugi) {
        const n = Math.max(8, Math.ceil(Math.abs(arc.t1 - arc.t0) / 2));
        let hit = false;
        for (let i = 0; i <= n && !hit; i += 1) {
          const t = ((arc.t0 + ((arc.t1 - arc.t0) * i) / n) * Math.PI) / 180;
          const ax = arc.cx + arc.r * Math.cos(t);
          const ay = arc.cy - arc.r * Math.sin(t);
          for (let k = 0; k < pts.length - 1; k += 1) {
            const p0 = pts[k] as [number, number];
            const p1 = pts[k + 1] as [number, number];
            if (pointSegDist(ax, ay, { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1] }) < 3.4) {
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          out.push(`дуга угла ${arc.id} пересекает кривую`);
        }
      }
      for (const b of boxes) {
        if (b.kind === 'axisName') {
          continue;
        }
        const rect = boxRect(b);
        for (let k = 0; k < pts.length - 1; k += 1) {
          const seg: Seg = {
            x1: (pts[k] as [number, number])[0],
            y1: (pts[k] as [number, number])[1],
            x2: (pts[k + 1] as [number, number])[0],
            y2: (pts[k + 1] as [number, number])[1],
          };
          if (segRectDist(seg, rect) < 0.5) {
            out.push(`подпись ${b.id} пересекает кривую`);
            break;
          }
        }
      }
    }
  }
  return out;
}

/** Движок: волны, сплайн, нули, подписи. */
export function checkEngine(n: number): Report {
  const problems: Problem[] = [];
  let rendered = 0;
  for (let s = 0; s < n; s += 1) {
    const r = rngOf(`engine#${s}`);
    const isF = s % 2 === 0;
    let uzly: Figura['uzly'] | null = null;
    let want: number[] = [];
    if (isF) {
      const w = volna(r, { n: [2, 5] });
      if (w === null) {
        continue;
      }
      uzly = w.uzly;
      want = w.ekstremumy.map((e) => e.x);
    } else {
      const w = volnaP(r, { n: [2, 5] });
      if (w === null) {
        continue;
      }
      uzly = w.uzly;
      want = w.nuli.map((z) => z.x);
    }
    const fig = figura(isF ? 'f' : 'fprime', isF ? 'f(x)' : "f'(x)", uzly, {});
    const where = `${fig.rezhim}#${s}`;
    const spl = postroit(fig.uzly);
    /* C¹: производная непрерывна в узлах. */
    for (const u of fig.uzly.slice(1, -1)) {
      const left = spl.dy(u.x - 1e-7);
      const right = spl.dy(u.x + 1e-7);
      if (Math.abs(left - right) > 1e-4) {
        problems.push({ where, what: `производная разрывна в узле ${u.x}` });
      }
    }
    /* Экстремумы/нули — ровно там, где задумано, и только целые. */
    const found = (isF ? ekstremumy(fig, ...granitsy(fig)) : nuli(spl.y, ...granitsy(fig))).map(
      (z) => z.x,
    );
    if (
      found.length !== want.length ||
      found.some((x, i) => Math.abs(x - (want[i] as number)) > 1e-6)
    ) {
      problems.push({ where, what: `нули/экстремумы ${found.join(',')} вместо ${want.join(',')}` });
    }
    const types = (isF ? ekstremumy(fig, ...granitsy(fig)) : nuli(spl.y, ...granitsy(fig))).map(
      (z) => z.tip,
    );
    if (types.some((t) => t !== 'plus-minus' && t !== 'minus-plus')) {
      problems.push({ where, what: 'нуль не пересекает ось: касание или площадка' });
    }
    for (let i = 1; i < types.length; i += 1) {
      if (types[i] === types[i - 1]) {
        problems.push({ where, what: 'типы нулей не чередуются' });
      }
    }
    /* Структура узлов даёт те же числа. */
    const structural = isF
      ? ekstremumyUzlov(fig.uzly).map((e) => e.x)
      : nuliUzlov(fig.uzly).map((z) => z.x);
    if (structural.join(',') !== want.join(',')) {
      problems.push({ where, what: 'структурное чтение узлов расходится с задуманным' });
    }
    /* Монотонность между узлами: производная не меняет знак внутри сегмента. */
    for (let i = 0; i < fig.uzly.length - 1; i += 1) {
      const a = fig.uzly[i] as { x: number };
      const b = fig.uzly[i + 1] as { x: number };
      let signs = new Set<number>();
      for (let x = a.x + 0.02; x < b.x - 0.02 + 1e-9; x += 1 / SHAG) {
        const v = isF ? spl.dy(x) : spl.y(x);
        if (Math.abs(v) > 1e-9) {
          signs.add(Math.sign(v));
        }
      }
      if (signs.size > 1) {
        problems.push({ where, what: `выброс внутри сегмента [${a.x}; ${b.x}]` });
      }
      signs = new Set();
    }
    /* Рисунок. */
    for (const rezhim of ['student', 'teacher'] as const) {
      const rep = pustoyOtchet();
      const svg = renderFigura(fig, { rezhim }, rep);
      rendered += 1;
      if (rezhim === 'student') {
        problems.push(...studentSvgChist(svg).map((what) => ({ where, what })));
      }
      problems.push(
        ...podpisiChisty(fig, rep).map((what) => ({ where: `${where} ${rezhim}`, what })),
      );
    }
  }
  return { prototypes: 0, generated: rendered, problems };
}

function nice(x: number, places = 2): boolean {
  if (!Number.isFinite(x)) {
    return false;
  }
  const scaled = x * 10 ** places;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

/** Строки, которые надо проверить KaTeX и на «плоскую математику». */
export function stroki(t: Generated): string[] {
  const out: string[] = [t.uslovie];
  for (const s of t.shagi) {
    out.push(s.zagolovok, ...s.stroki);
  }
  for (const q of t.podskazka) {
    out.push(q.vopros);
    if (q.itog !== undefined) {
      out.push(q.itog);
    }
    for (const v of q.knopki) {
      out.push(v.tekst);
      if (v.pochemu !== undefined) {
        out.push(v.pochemu);
      }
    }
  }
  return out;
}

/** Все формулы $…$ собираются KaTeX строго; вне формул — нет сырого TeX и плоской математики. */
export function proveritStroki(
  list: string[],
  typeset: (tex: string) => string,
  textCheck: TextCheck,
  where: string,
): Problem[] {
  const out: Problem[] = [];
  for (const line of list) {
    const parts = line.replace(/\*\*/g, '').split('$');
    if (parts.length % 2 === 0) {
      out.push({ where, what: `нечётное число долларов: ${line.slice(0, 80)}` });
      continue;
    }
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
        try {
          typeset(part);
        } catch (e) {
          out.push({
            where,
            what: `KaTeX: ${(e as Error).message.slice(0, 120)} в «${part.slice(0, 60)}»`,
          });
        }
      }
    });
    const plain = parts.filter((_, i) => i % 2 === 0).join(' ');
    for (const msg of textCheck(plain)) {
      out.push({ where, what: `${msg}: «${plain.slice(0, 80)}»` });
    }
  }
  return out;
}

/** Число различных ответов прототипа в последнем прогоне генераторов: им пользуется проверка банка. */
export const razneOtvety = new Map<string, number>();

/** Генераторы: ответ из данных узлов совпадает с заложенным, рисунок и тексты чисты. */
export function checkGenerators(
  seeds: number,
  typeset: (tex: string) => string,
  textCheck: TextCheck,
): Report {
  const problems: Problem[] = [];
  let generated = 0;
  const ms: Record<string, number> = {};
  razneOtvety.clear();
  for (const proto of PROTOTYPES) {
    const t0 = Date.now();
    const answers = new Map<number, number>();
    const signatures = new Set<string>();
    let count = 0;
    for (let i = 1; i <= seeds; i += 1) {
      const seed = `chk#${i}`;
      const where = `${proto.id} ${seed}`;
      let t: Generated;
      try {
        t = generate(proto.id, seed);
      } catch (e) {
        problems.push({ where, what: `не сгенерировалась: ${(e as Error).message}` });
        continue;
      }
      generated += 1;
      count += 1;
      if (t.istochnik !== 'ne-iz-otkrytogo-banka') {
        problems.push({
          where,
          what: 'у собственной задачи не стоит пометка «не из открытого банка»',
        });
      }
      if (!nice(t.otvet)) {
        problems.push({
          where,
          what: `ответ ${t.otvet} — не целое и не конечная десятичная дробь`,
        });
      }
      if (Math.abs(t.proverka - t.otvet) > 1e-6) {
        problems.push({ where, what: `независимый счёт ${t.proverka} ≠ ${t.otvet}` });
      }
      answers.set(t.otvet, (answers.get(t.otvet) ?? 0) + 1);
      signatures.add(t.signature);
      /* Рисунок. */
      if (proto.risunok !== (t.risunok !== null)) {
        problems.push({ where, what: 'флаг risunok прототипа не совпадает с задачей' });
      }
      if (t.risunok !== null) {
        if (t.zapros === null) {
          problems.push({ where, what: 'у задачи с рисунком нет запроса' });
        } else {
          const re = reshit(t.risunok, t.zapros);
          if (re === null || Math.abs(re - t.otvet) > 1e-6) {
            problems.push({ where, what: `ответ из узлов ${re} ≠ ${t.otvet}` });
          }
          for (const p of problemy(t.risunok, t.zapros)) {
            problems.push({ where, what: `читаемость: ${p}` });
          }
        }
        for (const rezhim of ['student', 'hint', 'teacher'] as const) {
          const rep = pustoyOtchet();
          const svg = renderFigura(t.risunok, { rezhim }, rep);
          for (const p of rep.problems) {
            problems.push({ where, what: `${rezhim}: ${p}` });
          }
          problems.push(
            ...podpisiChisty(t.risunok, rep).map((what) => ({ where, what: `${rezhim}: ${what}` })),
          );
          if (rezhim === 'student') {
            problems.push(...studentSvgChist(svg).map((what) => ({ where, what })));
          }
        }
      }
      /* Решение: этапы с подписями, последний — «Ответ». */
      const last = t.shagi[t.shagi.length - 1];
      if (t.shagi.length < 2 || last === undefined || last.zagolovok !== 'Ответ') {
        problems.push({ where, what: 'последний этап решения должен называться «Ответ»' });
      } else if (!last.stroki.some((s) => s.includes(`**Ответ: ${ru(t.otvet)}**`))) {
        problems.push({ where, what: `в этапе «Ответ» нет «**Ответ: ${ru(t.otvet)}**»` });
      }
      for (const s of t.shagi) {
        if (s.zagolovok.trim() === '' || s.stroki.length === 0) {
          problems.push({ where, what: 'пустой этап решения' });
        }
      }
      /* Подсказка: лесенка вопросов с кнопками. */
      if (t.podskazka.length < 2) {
        problems.push({ where, what: 'в подсказке меньше двух вопросов' });
      }
      for (const q of t.podskazka) {
        const right = q.knopki.filter((v) => v.verno).length;
        if (right !== 1) {
          problems.push({
            where,
            what: `в вопросе «${q.vopros.slice(0, 40)}» верных вариантов ${right}`,
          });
        }
        if (q.knopki.length < 2 || q.knopki.length > 5) {
          problems.push({
            where,
            what: `в вопросе «${q.vopros.slice(0, 40)}» ${q.knopki.length} вариантов`,
          });
        }
        for (const v of q.knopki) {
          if (!v.verno && (v.pochemu === undefined || v.pochemu.trim() === '')) {
            problems.push({
              where,
              what: `у неверного варианта «${v.tekst.slice(0, 40)}» нет объяснения`,
            });
          }
        }
        const texts = q.knopki.map((v) => v.tekst);
        if (new Set(texts).size !== texts.length) {
          problems.push({ where, what: 'варианты ответа повторяются' });
        }
      }
      problems.push(...proveritStroki(stroki(t), typeset, textCheck, where));
    }
    ms[proto.id] = count === 0 ? 0 : Math.round((Date.now() - t0) / count);
    const top = Math.max(0, ...answers.values());
    if (seeds >= 50 && top / Math.max(count, 1) > 0.6) {
      problems.push({
        where: proto.id,
        what: `один ответ встречается в ${Math.round((100 * top) / count)}% задач`,
      });
    }
    if (seeds >= 100 && answers.size < MIN_RAZNYH_OTVETOV) {
      problems.push({
        where: proto.id,
        what: `различных ответов ${answers.size} — меньше порога ${MIN_RAZNYH_OTVETOV}`,
      });
    }
    razneOtvety.set(proto.id, answers.size);
    if (seeds >= 50 && signatures.size < count * 0.8) {
      problems.push({ where: proto.id, what: `различных задач ${signatures.size} из ${count}` });
    }
  }
  return { prototypes: PROTOTYPES.length, generated, problems, ms };
}

/** Банк: по десять разных вариантов на прототип. */
export function checkBank(
  bank: { prototype: string; variants: { n: number; seed: string }[] }[],
  typeset: (tex: string) => string,
  textCheck: TextCheck,
): Report {
  const problems: Problem[] = [];
  let generated = 0;
  for (const proto of PROTOTYPES) {
    const entry = bank.find((e) => e.prototype === proto.id);
    if (entry === undefined) {
      problems.push({ where: proto.id, what: 'нет в банке' });
      continue;
    }
    if (entry.variants.length !== 10) {
      problems.push({
        where: proto.id,
        what: `в банке ${entry.variants.length} вариантов вместо 10`,
      });
    }
    const sig = new Set<string>();
    const vids = new Map<string, number>();
    const otvety = new Map<number, number>();
    for (const v of entry.variants) {
      const where = `${proto.id} ${v.seed}`;
      try {
        const t = generate(proto.id, v.seed);
        generated += 1;
        if (sig.has(t.signature)) {
          problems.push({ where, what: 'повтор варианта в банке' });
        }
        sig.add(t.signature);
        otvety.set(t.otvet, (otvety.get(t.otvet) ?? 0) + 1);
        const vid = t.vid ?? '';
        vids.set(vid, (vids.get(vid) ?? 0) + 1);
        problems.push(...proveritStroki(stroki(t), typeset, textCheck, where));
      } catch (e) {
        problems.push({ where, what: `не сгенерировался: ${(e as Error).message}` });
      }
    }
    /* Ответы в банке разные; если у прототипа возможных ответов меньше
       десяти — один ответ не больше двух раз. */
    const vozmozhno = razneOtvety.get(proto.id) ?? 10;
    const dopusk = vozmozhno >= 10 ? 1 : 2;
    for (const [otvet, k] of otvety) {
      if (k > dopusk) {
        problems.push({
          where: proto.id,
          what: `в банке ответ ${otvet} встречается ${k} раз (допустимо ${dopusk})`,
        });
      }
    }
    for (const [vid, k] of vids) {
      if (k > 4 && vid !== '') {
        problems.push({ where: proto.id, what: `вид «${vid}» встречается ${k} раз из 10` });
      }
    }
  }
  return { prototypes: bank.length, generated, problems };
}

/** Опорные задачи: шесть блоков по десять микрозадач, у каждой ответ, разбор, подсказка и рисунок без построений. */
export function checkPrep(
  seeds: number,
  blocks: {
    id: string;
    lead: string;
    zapomni: string[];
    zadachi: { id: string; answerType: 'number' | 'choice' }[];
  }[],
  gen: (
    blockId: string,
    no: number,
    seed: string,
  ) => {
    uslovie: string;
    risunok: Figura | null;
    otvet: number;
    knopki?: string[];
    proverka: number;
    razbor: string[];
    podskazka: Generated['podskazka'];
  },
  typeset: (tex: string) => string,
  textCheck: TextCheck,
): Report {
  const problems: Problem[] = [];
  let generated = 0;
  for (const block of blocks) {
    if (block.zadachi.length !== 10) {
      problems.push({
        where: block.id,
        what: `в блоке ${block.zadachi.length} микрозадач вместо 10`,
      });
    }
    if (block.lead.includes('$') || /\\[A-Za-z]/.test(block.lead)) {
      problems.push({ where: block.id, what: 'на карточке блока есть формула' });
    }
    problems.push(...proveritStroki(block.zapomni, typeset, textCheck, `${block.id} запомни`));
    block.zadachi.forEach((micro, i) => {
      const seen = new Set<string>();
      for (let s = 1; s <= seeds; s += 1) {
        const where = `${micro.id} s${s}`;
        try {
          const t = gen(block.id, i + 1, `chk#${s}`);
          generated += 1;
          seen.add(
            t.uslovie + (t.risunok === null ? '' : JSON.stringify(t.risunok.uzly)) + t.otvet,
          );
          if (!nice(t.otvet, 3) && micro.answerType === 'number') {
            problems.push({ where, what: `ответ ${t.otvet} не годится` });
          }
          if (micro.answerType === 'choice') {
            if (
              t.knopki === undefined ||
              t.knopki.length < 2 ||
              !Number.isInteger(t.otvet) ||
              t.otvet < 0 ||
              t.otvet >= t.knopki.length
            ) {
              problems.push({
                where,
                what: 'у задачи на выбор нет вариантов или индекс верного вне диапазона',
              });
            } else if (new Set(t.knopki).size !== t.knopki.length) {
              problems.push({ where, what: 'варианты выбора повторяются' });
            }
          }
          if (Math.abs(t.proverka - t.otvet) > 1e-6) {
            problems.push({ where, what: `независимый счёт ${t.proverka} ≠ ${t.otvet}` });
          }
          if (t.razbor.length === 0) {
            problems.push({ where, what: 'нет разбора' });
          }
          for (const q of t.podskazka) {
            if (q.knopki.filter((v) => v.verno).length !== 1) {
              problems.push({ where, what: 'в вопросе подсказки не один верный вариант' });
            }
            for (const v of q.knopki) {
              if (!v.verno && (v.pochemu ?? '').trim() === '') {
                problems.push({ where, what: 'у неверного варианта подсказки нет объяснения' });
              }
            }
          }
          if (t.risunok !== null) {
            const rep = pustoyOtchet();
            const svg = renderFigura(t.risunok, { rezhim: 'student' }, rep);
            problems.push(...rep.problems.map((what) => ({ where, what })));
            problems.push(...studentSvgChist(svg).map((what) => ({ where, what })));
          }
          const lines = [t.uslovie, ...t.razbor, ...(t.knopki ?? [])];
          for (const q of t.podskazka) {
            lines.push(q.vopros, ...(q.itog === undefined ? [] : [q.itog]));
            for (const v of q.knopki) {
              lines.push(v.tekst, ...(v.pochemu === undefined ? [] : [v.pochemu]));
            }
          }
          problems.push(...proveritStroki(lines, typeset, textCheck, where));
        } catch (e) {
          problems.push({ where, what: `не сгенерировалась: ${(e as Error).message}` });
        }
      }
      if (seeds >= 20 && micro.answerType === 'number' && seen.size < seeds * 0.2) {
        problems.push({ where: micro.id, what: `различных задач ${seen.size} из ${seeds}` });
      }
    });
  }
  return { prototypes: blocks.length, generated, problems };
}
