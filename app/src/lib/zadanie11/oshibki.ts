/**
 * «Найди ошибку»: типичная ошибка вносится в наш же разбор.
 *
 * Словарь ошибок — по разделам задания №11 (docs/audit/zadanie-11.md,
 * таблица 4.3): разность времён наоборот, скорость против течения
 * $c-x$, стоянка не вычтена, снижение записано как повышение, проценты
 * сложены вместо произведения множителей, уравнение смеси по строке
 * концентрации, вода «добавляет вещество», скорости навстречу вычли,
 * на круге скорости сложили, в сумме прогрессии потеряно деление на 2,
 * корень не проверен по смыслу, сложены времена вместо
 * производительностей.
 *
 * Ошибка меняет ровно одну строку разбора: остальные строки остаются
 * верными, и несогласованность с ними — подсказка ученику. Учителю
 * отдаётся, где ошибка (шаг), что не так, строка как было и как верно.
 */

import { rngOf } from '../vychisleniya/rng';
import type { SectionId } from './types';

export interface Etap {
  title: string;
  lines: string[];
}

export interface Oshibka {
  id: string;
  /** Разделы, где ошибка типична. */
  razdely: readonly SectionId[];
  /** Что не так — коротко, для учителя. */
  chto: string;
  /** Как верно — правило, формулы в $…$. */
  verno: string;
  /** Испортить строку разбора; null — к этой строке ошибка не применима. */
  primenit(line: string, title: string): string | null;
}

const DROB = '\\\\dfrac\\{[^{}]+\\}\\{[^{}]+\\}';
const vUravnenii = (title: string) => /Уравнение/.test(title);

/** Процент из десятичной записи «0{,}05» → 5. */
function procent(dec: string): number {
  return Math.round(Number(`0.${dec}`) * 100 * 1000) / 1000;
}

export const OSHIBKI: readonly Oshibka[] = [
  {
    id: 'znak-raznosti',
    razdely: ['DP', 'RB', 'VD', 'OK', 'PT'],
    chto: 'Разность записана наоборот: из меньшего времени вычли большее.',
    verno: 'Из большего времени вычитаем меньшее — получаем разницу из условия.',
    primenit(line, title) {
      if (!vUravnenii(title)) return null;
      const re = new RegExp(`(${DROB})-(${DROB})=`);
      const m = re.exec(line);
      if (m === null) return null;
      return line.replace(re, `${m[2]}-${m[1]}=`);
    },
  },
  {
    id: 'protiv-techeniya',
    razdely: ['VD'],
    chto: 'Скорость против течения записана как «течение минус собственная».',
    verno: 'Против течения скорость $x-c$: собственная скорость минус скорость течения.',
    primenit(line) {
      const m = /против — \$x-(\d+)\$/.exec(line);
      if (m === null) return null;
      return line.replace(m[0], `против — $${m[1]}-x$`);
    },
  },
  {
    id: 'stoyanka',
    razdely: ['VD', 'DP'],
    chto: 'Время стоянки не вычтено: всё время от отплытия до возвращения принято за время в движении.',
    verno: 'Стоянку вычитаем из общего времени до составления уравнения.',
    primenit(line) {
      const m = /^(.*?)\$(\d+)-(\d+)=(\d+)\$ ч\.$/.exec(line);
      if (m === null) return null;
      return `${m[1]}$${m[2]}$ ч.`;
    },
  },
  {
    id: 'procent-znak',
    razdely: ['RZ', 'PR'],
    chto: 'Снижение (удержание) на несколько процентов записано как повышение.',
    verno:
      'Стало меньше — от $100\\%$ отнимаем: новая величина составляет $100\\%-p\\%$ от старой.',
    primenit(line) {
      const m = /\$100\\%-(\d+)\\%=(\d+)\\%\$/.exec(line);
      if (m === null) return null;
      const p = Number(m[1]);
      return line.replace(m[0], `$100\\%+${p}\\%=${100 + p}\\%$`);
    },
  },
  {
    id: 'procenty-slozheny',
    razdely: ['PR'],
    chto: 'Проценты сложили: подорожание и подешевление на одно число процентов «дали ноль».',
    verno:
      'Последовательные изменения — произведение множителей: $1{,}15\\cdot0{,}85$, а не $+15\\%-15\\%$.',
    primenit(line) {
      const m = /\$1\\cdot1\{,\}(\d+)\\cdot0\{,\}(\d+)=([^$]+)\$/.exec(line);
      if (m === null) return null;
      return line.replace(m[0], `$1+0{,}${m[1]}-0{,}${m[1]}=1$`);
    },
  },
  {
    id: 'po-kontsentratsii',
    razdely: ['SM'],
    chto: 'Уравнение составлено по строке концентрации: проценты сложили.',
    verno: 'Уравнение — только по строке массы вещества: сколько было, столько стало.',
    primenit(line, title) {
      if (!vUravnenii(title)) return null;
      const m = /\$([^$]*)\$\.?$/.exec(line);
      const tex = m?.[1];
      if (m === null || tex === undefined) return null;
      const dec = [...tex.matchAll(/0\{,\}(\d+)/g)].map((x) => procent(x[1] ?? '0'));
      if (dec.length < 3 || !/=/.test(tex)) return null;
      const levo = dec
        .slice(0, -1)
        .map((x) => `${x}\\%`)
        .join('+');
      const pravo = `${dec[dec.length - 1]}\\%`;
      return line.replace(m[0], `$${levo}=${pravo}$.`);
    },
  },
  {
    id: 'voda',
    razdely: ['SM'],
    chto: 'Вода «добавила вещество»: у воды концентрация вещества $0\\%$.',
    verno: 'Вода вещества не добавляет — в строке массы вещества у воды стоит $0$.',
    primenit(line) {
      if (!/Вода вещества не добавляет\./.test(line)) return null;
      return line.replace(
        'Вода вещества не добавляет.',
        'Вода добавляет столько же вещества, сколько её долили.',
      );
    },
  },
  {
    id: 'suhoe',
    razdely: ['SM'],
    chto: 'За долю сухого вещества взят процент воды.',
    verno:
      'Сухое вещество — всё, кроме воды: $100\\%-p_{\\text{воды}}$. Уравнение — по массе сухого вещества, оно при сушке не меняется.',
    primenit(line) {
      const m = /сухого вещества \$100\\%-(\d+)\\%=(\d+)\\%\$/.exec(line);
      if (m === null) return null;
      return line.replace(m[0], `сухого вещества $${m[1]}\\%$`);
    },
  },
  {
    id: 'navstrechu',
    razdely: ['PT', 'DP'],
    chto: 'При встречном движении скорости вычли.',
    verno: 'Навстречу скорости складываются, в одном направлении — вычитаются.',
    primenit(line) {
      const m = /Навстречу скорости складываются: \$(\d+)\+(\d+)=(\d+)\$/.exec(line);
      if (m === null) return null;
      const a = Number(m[1]);
      const b = Number(m[2]);
      return line.replace(
        m[0],
        `Навстречу скорости вычитаются: $${Math.max(a, b)}-${Math.min(a, b)}=${Math.abs(a - b)}$`,
      );
    },
  },
  {
    id: 'krug',
    razdely: ['OK'],
    chto: 'Скорости при движении в одном направлении сложили.',
    verno: 'В одном направлении скорость сближения — разность скоростей.',
    primenit(line, title) {
      if (!vUravnenii(title)) return null;
      const m = /^\$(\d+)-x=(\d+)\$\.$/.exec(line);
      if (m === null) return null;
      return `$${m[1]}+x=${m[2]}$.`;
    },
  },
  {
    id: 'summa-progressii',
    razdely: ['PG'],
    chto: 'В формуле суммы потеряно деление на $2$.',
    verno:
      '$S_n=\\dfrac{(a_1+a_n)\\cdot n}{2}$ — сумма равна полусумме крайних, умноженной на число членов.',
    primenit(line) {
      const bylo = 'S_n=\\dfrac{(a_1+a_n)\\cdot n}{2}';
      if (!line.includes(bylo)) return null;
      return line.replace(bylo, 'S_n=(a_1+a_n)\\cdot n');
    },
  },
  {
    id: 'otbor-kornya',
    razdely: ['DP', 'VD', 'RB', 'OK', 'PG'],
    chto: 'Корень проверен только по ОДЗ: проверка по смыслу задачи пропущена, отрицательный корень оставлен.',
    verno:
      'Каждый корень сверяем и с ОДЗ, и с условием по смыслу задачи; не подходит — отбрасываем и пишем почему.',
    primenit(line) {
      const m =
        /^(\$x=[^$]+\$) — входит в ОДЗ, но не подходит по смыслу задачи: нужно \$[^$]+\$\. Отбрасываем\.$/.exec(
          line,
        );
      if (m === null) return null;
      return `${m[1]} — входит в ОДЗ, значит, подходит.`;
    },
  },
  {
    id: 'vremena-slozheny',
    razdely: ['RB'],
    chto: 'Сложили времена работы, а не производительности.',
    verno: 'При совместной работе складываются производительности — части работы за час.',
    primenit(line) {
      const m = /^Складываем: \$\\dfrac\{1\}\{(\d+)\}\+\\dfrac\{1\}\{(\d+)\}=[^$]+\$\.$/.exec(line);
      if (m === null) return null;
      const a = Number(m[1]);
      const b = Number(m[2]);
      return `Складываем времена: $${a}+${b}=${a + b}$ ч — общее время работы.`;
    },
  },
];

export interface NaydennayaOshibka {
  oshibka: Oshibka;
  /** Индекс этапа и строки в разборе. */
  etap: number;
  stroka: number;
  /** Номер шага для ученика и учителя: «Шаг 3». */
  shag: string;
  bylo: string;
  stalo: string;
  /** Разбор с внесённой ошибкой — отличается от исходного ровно одной строкой. */
  etapy: Etap[];
}

/**
 * Подобрать ошибку к разбору. Среди применимых ошибок раздела выбор —
 * по seed, чтобы на листе встречались разные. Нет применимых — null.
 */
export function naytiOshibku(
  etapy: readonly Etap[],
  section: SectionId,
  seed: string,
): NaydennayaOshibka | null {
  const varianty: NaydennayaOshibka[] = [];
  for (const o of OSHIBKI) {
    if (!o.razdely.includes(section)) continue;
    let gotovo = false;
    etapy.forEach((e, ei) => {
      if (gotovo) return;
      e.lines.forEach((l, li) => {
        if (gotovo) return;
        const stalo = o.primenit(l, e.title);
        if (stalo === null || stalo === l) return;
        gotovo = true;
        const novye = etapy.map((x, xi) =>
          xi === ei
            ? { title: x.title, lines: x.lines.map((y, yi) => (yi === li ? stalo : y)) }
            : x,
        );
        const shag = /^Шаг \d+/.exec(e.title)?.[0] ?? `Шаг ${ei + 1}`;
        varianty.push({ oshibka: o, etap: ei, stroka: li, shag, bylo: l, stalo, etapy: novye });
      });
    });
  }
  if (varianty.length === 0) return null;
  const i = Math.floor(rngOf(`z11-oshibka|${seed}`).next() * varianty.length);
  return varianty[Math.min(i, varianty.length - 1)] ?? null;
}
