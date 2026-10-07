/**
 * Самопроверка пула аналогов задания №11 (pnpm test:zadanie11).
 *
 * На каждый прототип из пула — ровно 10 аналогов; у каждого:
 * solve(params) даёт ровно answer, ответ положительный, целый или с
 * двумя знаками после запятой; параметры модели не совпадают с банком
 * и с другими аналогами (и не отличаются от задачи банка одним
 * числом); тексты не повторяются; числа модели стоят в тексте, вопрос
 * текста совпадает с ask; числа правдоподобны для сюжета; варианты
 * вопроса распределены почти поровну; решение проходит те же проверки
 * методики, что задачи банка; склонения «1 час / 2 часа / 5 часов».
 */

import { BANK } from './bank';
import { POOL_ANALOGOV, type Analog } from './analogi';
import { paramsKey, pohozhaNa } from './gen/core';
import { kodNaSayte } from './kod';
import { nice, txt } from './num';
import { subtype } from './prototypes';
import { GEROI, TARY, VESHCHESTVA } from './prototypes/syuzhety';
import {
  checkDrobnye,
  checkMetodika,
  checkOboznacheniya,
  checkSolved,
  type Problem,
} from './selftest';
import { sk, SLOVA } from './sklonenie';
import type { Params } from './types';

/** Ключи сюжета: на модель не влияют, в сравнении с банком не участвуют. */
const SYUZHET = new Set(['geroy', 'vv', 'tara']);

export function model(params: Params): Params {
  return Object.fromEntries(Object.entries(params).filter(([k]) => !SYUZHET.has(k)));
}

/** Число так, как оно пишется в условии: 15,2. */
function vTekste(x: number): string {
  return txt(x);
}

interface Pravilo {
  /** Какие параметры модели обязаны стоять в тексте числами. */
  chisla: string[];
  /** Вопрос текста соответствует ask. */
  vopros: (a: Analog) => boolean;
  /** Правдоподобие чисел для сюжета: список нарушений. */
  pravdopodobie: (a: Analog) => string[];
}

const num = (p: Params, k: string): number => Number(p[k]);

const PRAVILA: Record<string, Pravilo> = {
  'DP-07': {
    chisla: ['S', 'd'],
    vopros: (a) => {
      const last = a.text.slice(a.text.lastIndexOf('Найдите'));
      return a.ask === 'AB' ? /из А в В/.test(last) : /из В в А/.test(last);
    },
    pravdopodobie: (a) => {
      const out: string[] = [];
      const g = GEROI[String(a.params.geroy)];
      if (g === undefined) return ['неизвестный герой'];
      const S = num(a.params, 'S');
      const d = num(a.params, 'd');
      const x = a.ask === 'AB' ? a.answer : a.answer - d;
      for (const v of [x, x + d]) {
        if (v < g.v[0] || v > g.v[1]) out.push(`скорость ${v} км/ч вне ${g.v.join('–')}`);
      }
      if (g.voda !== (a.params.form === 'barzha')) out.push('герой не совпадает с видом пути');
      if (g.voda && !/озер/.test(a.text)) out.push('по воде без течения — нужно озеро');
      const t = S / x;
      if (t > 24 || t < 1) out.push(`время в пути ${t} ч неправдоподобно`);
      const st = a.params.st === undefined ? d : num(a.params, 'st');
      if (!new RegExp(`(?<!\\d)${st} час`).test(a.text)) out.push(`в тексте нет остановки ${st} ч`);
      return out;
    },
  },
  'SM-07': {
    chisla: ['m1', 'm2', 'c', 'e'],
    vopros: (a) =>
      a.ask === 'pct' ? /Сколько процентов/.test(a.text) : /Сколько килограммов/.test(a.text),
    pravdopodobie: (a) => {
      const out: string[] = [];
      const v = VESHCHESTVA[String(a.params.vv)];
      if (v === undefined || TARY[String(a.params.tara)] === undefined) {
        return ['неизвестное вещество или ёмкость'];
      }
      const m1 = num(a.params, 'm1');
      const m2 = num(a.params, 'm2');
      const c = num(a.params, 'c');
      const e = num(a.params, 'e');
      const x = (c * (m1 + m2) - 2 * e * m2) / (m1 - m2);
      const y = 2 * e - x;
      for (const p of [x, y, c, e]) {
        if (p < v.p[0] || p > v.p[1]) out.push(`концентрация ${p}% вне ${v.p.join('–')}`);
      }
      for (const m of [m1, m2]) {
        if (m < 1 || m > 500) out.push(`масса ${m} кг вне 1–500`);
      }
      if (v.splav !== /сплав/.test(a.text)) out.push('сплав/раствор не совпадает с веществом');
      return out;
    },
  },
};

/** Склонения часов и минут в тексте: «1 час», «2 часа», «5 часов». */
function sklonenia(text: string): string[] {
  const out: string[] = [];
  for (const forms of [SLOVA.chas, SLOVA.minuta, SLOVA.minutu, SLOVA.detal, SLOVA.litr]) {
    const re = new RegExp(`(\\d+) (${forms.join('|')})(?![а-яё])`, 'g');
    for (const m of text.matchAll(re)) {
      const n = Number(m[1]);
      /* sk ставит неразрывный пробел — сравниваем по словам. */
      const ok = [sk(n, forms), sk(n, SLOVA.minuta), sk(n, SLOVA.minutu)].map((x) =>
        x.replace(/\s/g, ' '),
      );
      if (!ok.includes(`${m[1]} ${m[2]}`)) out.push(`«${m[0]}» вместо «${sk(n, forms)}»`);
    }
  }
  return out;
}

export function checkAnalogi(typeset: (tex: string) => string) {
  const problems: Problem[] = [];
  const pohozha = pohozhaNa(BANK);
  let checked = 0;
  for (const [proto, list] of Object.entries(POOL_ANALOGOV)) {
    const add = (where: string, what: string) => problems.push({ where, what });
    const st = subtype(proto);
    const pravilo = PRAVILA[proto];
    if (pravilo === undefined) add(proto, 'нет правил проверки для прототипа');
    if (list.length !== 10) add(proto, `аналогов ${list.length}, а нужно 10`);
    const kod = kodNaSayte(proto);
    const klyuchi = new Set<string>();
    const teksty = new Set<string>();
    list.forEach((a, i) => {
      const where = a.id;
      checked += 1;
      const want = `${kod}-a${String(i + 1).padStart(2, '0')}`;
      if (a.id !== want) add(where, `номер аналога должен быть ${want}`);
      if (a.prototypeId !== proto || a.source !== 'analog') add(where, 'prototypeId или source');
      if (a.level !== st.level) add(where, `уровень ${a.level}, у прототипа ${st.level}`);
      if (a.plotTag.trim() === '') add(where, 'нет метки сюжета');
      if (String(a.params.ask ?? a.ask) !== a.ask) add(where, 'ask не совпадает с params.ask');
      let s;
      try {
        s = st.solve(a.params);
      } catch (e) {
        add(where, `solve упал: ${(e as Error).message}`);
        return;
      }
      if (Math.abs(s.answer - a.answer) > 1e-9)
        add(where, `solve ${s.answer} ≠ answer ${a.answer}`);
      if (!(a.answer > 0) || !nice(a.answer, 2)) add(where, `ответ ${a.answer} не «красивый»`);
      /* Решение — те же проверки методики, что у банка; условие — текст аналога. */
      const solved = { ...s, uslovie: a.text };
      problems.push(
        ...checkSolved(where, solved, typeset),
        ...checkMetodika(where, proto, solved),
        ...checkDrobnye(where, solved),
        ...checkOboznacheniya(where, solved),
      );
      const m = model(a.params);
      const key = paramsKey(proto, m);
      if (klyuchi.has(key)) add(where, 'параметры повторяют другой аналог');
      klyuchi.add(key);
      if (pohozha(proto, m)) add(where, 'параметры совпадают с банком или отличаются одним числом');
      if (teksty.has(a.text)) add(where, 'текст повторяет другой аналог');
      teksty.add(a.text);
      if (pravilo !== undefined) {
        for (const k of pravilo.chisla) {
          const n = vTekste(num(m, k));
          if (!new RegExp(`(?<![\\d,])${n.replace(',', '\\,')}(?![\\d,])`).test(a.text)) {
            add(where, `в тексте нет числа ${k} = ${n}`);
          }
        }
        if (!pravilo.vopros(a)) add(where, `вопрос текста не совпадает с ask = ${a.ask}`);
        for (const w of pravilo.pravdopodobie(a)) add(where, w);
      }
      for (const w of sklonenia(a.text)) add(where, `склонение: ${w}`);
    });
    /* Варианты вопроса — почти поровну. */
    const po = new Map<string, number>();
    for (const a of list) po.set(a.ask, (po.get(a.ask) ?? 0) + 1);
    const vsegoVariantov = new Set([
      ...list.map((a) => a.ask),
      ...BANK.filter((b) => b.id === proto).map((b) => String(b.params.ask ?? '')),
    ]);
    vsegoVariantov.delete('');
    if (vsegoVariantov.size > 1) {
      const counts = [...vsegoVariantov].map((v) => po.get(v) ?? 0);
      if (Math.max(...counts) - Math.min(...counts) > 2) {
        add(
          proto,
          `варианты вопроса распределены неровно: ${[...po].map(([k, n]) => `${k} ${n}`).join(', ')}`,
        );
      }
    }
  }
  return { problems, checked };
}
