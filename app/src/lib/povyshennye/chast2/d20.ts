/**
 * №20 (варианты 7–8): ряд из M чисел по натуральному D ≥ 2:
 * n₁ = N₀ − sD; если n_k > sD, то n_{k+1} = n_k − sD, иначе
 * n_{k+1} = (n_k − sD)². N₀ ≡ 1 (mod 3), s кратно 3.
 *
 * а) Все числа ряда дают остаток 1 при делении на 3 (вычитание sD
 *    остаток не меняет, квадрат числа, не кратного 3, даёт остаток 1),
 *    поэтому число A с другим остатком в ряду не встречается.
 * б) Пример D, при котором B — член первой прогрессии.
 * в) Ряд при D = D_в: прогрессии с разностью sD, пока очередное число
 *    не повторит уже встречавшееся (дальше всё повторяется).
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PD20 {
  N0: number;
  /** Множитель s: шаг sD. */
  s: number;
  /** Длина ряда M. */
  M: number;
  /** а) число, которого нет ни в одном ряду. */
  A: number;
  /** б) число, которое бывает. */
  B: number;
  /** в) D. */
  Dv: number;
  /** Имя автора программы (сюжет). */
  kto: number;
}

/** Автор программы: имя и окончание глагола «написал(а)». */
const KTO = [
  ['Олег', ''],
  ['Вера', 'а'],
  ['Ильдар', ''],
  ['Соня', 'а'],
  ['Тимур', ''],
  ['Лиза', 'а'],
  ['Глеб', ''],
  ['Ника', 'а'],
  ['Артём', ''],
  ['Дина', 'а'],
  ['Марк', ''],
  ['Ева', 'а'],
] as const;

export function ryadD20(p: PD20, D: number): number[] {
  let n = p.N0 - p.s * D;
  const out = [n];
  while (out.length < p.M) {
    n = n > p.s * D ? n - p.s * D : (n - p.s * D) ** 2;
    out.push(n);
  }
  return out;
}

/** D для пункта б: B — член первой прогрессии. */
export function primerB(p: PD20): { D: number; j: number } | null {
  for (let D = 2; D < 1000; D += 1) {
    const sh = p.s * D;
    if (p.N0 - sh <= 0) break;
    if ((p.N0 - p.B) % sh === 0 && p.B > 0) {
      const j = (p.N0 - p.B) / sh;
      if (j >= 1 && j <= p.M) return { D, j };
    }
  }
  return null;
}

interface Kusok {
  start: number;
  end: number;
  len: number;
}

/** Разбор ряда при D: прогрессии до первого повтора. */
export function razborD20(p: PD20, D: number) {
  const r = ryadD20(p, D);
  const seen = new Map<number, number>();
  let povtor = -1;
  for (let i = 0; i < r.length; i += 1) {
    if (seen.has(r[i]!)) {
      povtor = i;
      break;
    }
    seen.set(r[i]!, i);
  }
  const do_ = povtor === -1 ? r.length : povtor;
  const kuski: Kusok[] = [];
  for (let i = 0; i < do_; i += 1) {
    const last = kuski[kuski.length - 1];
    if (last !== undefined && r[i - 1]! - r[i]! === p.s * D) {
      last.end = r[i]!;
      last.len += 1;
    } else kuski.push({ start: r[i]!, end: r[i]!, len: 1 });
  }
  return {
    r,
    povtor,
    kuski,
    razlichnyh: new Set(r).size,
    seenIdx: povtor === -1 ? -1 : seen.get(r[povtor]!)!,
  };
}

const ch = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');

function sobrat(p: PD20): Chast2Zadacha {
  if (p.N0 % 3 !== 1 || p.s % 3 !== 0) throw new Error('d20: остатки');
  if (p.A % 3 === 1) throw new Error('d20: A даёт остаток 1');
  if (p.B % 3 !== 1) throw new Error('d20: B не даёт остаток 1');
  const pb = primerB(p);
  if (pb === null) throw new Error('d20: нет примера для б');
  const rz = razborD20(p, p.Dv);
  if (rz.povtor === -1) throw new Error('d20: нет повтора в ряду');
  const d = p.s * p.Dv;
  /* Различие прогрессий: остатки по модулю d или непересекающиеся значения. */
  const ost = rz.kuski.map((k) => ((k.start % d) + d) % d);
  for (let i = 0; i < rz.kuski.length; i += 1)
    for (let j = i + 1; j < rz.kuski.length; j += 1)
      if (ost[i] === ost[j]) {
        const a = rz.kuski[i]!;
        const b = rz.kuski[j]!;
        if (!(a.end > b.start || b.end > a.start)) throw new Error('d20: прогрессии пересекаются');
      }
  const otvetV = rz.razlichnyh;
  if (otvetV !== rz.povtor) throw new Error('d20: подсчёт');
  const kto = KTO[p.kto];
  if (kto === undefined) throw new Error('d20: сюжет');
  const sD = p.s === 1 ? 'D' : `${p.s}D`;
  const uslovie =
    `${kto[0]} написал${kto[1]} программу, которая по натуральному числу $D$ ($D\\ge2$) выдаёт ряд из $${p.M}$ чисел $n_1,\\,n_2,\\,\\ldots,\\,n_{${p.M}}$ по правилам:\n` +
    `1) $n_1=${p.N0}-${sD}$;\n` +
    `2) для всех $k\\ge1$: если $n_k>${sD}$, то $n_{k+1}=n_k-${sD}$, иначе $n_{k+1}=\\left(n_k-${sD}\\right)^2$.\n` +
    `а) Может ли в ряду полученных чисел быть число $${p.A}$?\n` +
    `б) Может ли в ряду полученных чисел быть число $${p.B}$?\n` +
    `в) Какое количество различных чисел будет в полученном ряду, если $D=${p.Dv}$?`;

  const kuskiTxt = rz.kuski.map((k, i) => {
    const nomer = i + 1;
    return `${nomer}-я: от $${ch(k.start)}$ до $${ch(k.end)}$ — $${k.len}$ ${k.len % 10 === 1 && k.len % 100 !== 11 ? 'число' : [2, 3, 4].includes(k.len % 10) && ![12, 13, 14].includes(k.len % 100) ? 'числа' : 'чисел'}`;
  });
  const rp = rz.r[rz.povtor]!;
  const raznye = ost.every((o, i) => ost.indexOf(o) === i)
    ? `Числа разных прогрессий различны: у прогрессий одна разность $${d}$, а остатки их членов при делении на $${d}$ разные ($${ost.join(',\\ ')}$).`
    : `Числа разных прогрессий различны: у прогрессий с одинаковым остатком при делении на $${d}$ промежутки значений не пересекаются.`;

  return {
    no: 20,
    shablon: 'd20.ryadKvadrat',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: false } },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'danet', verno: true } },
      { bukva: 'в', podpis: 'Количество', pole: { vid: 'chislo', verno: String(otvetV) } },
    ],
    otvet: `а) нет; б) да; в) $${otvetV}$`,
    reshenie: [
      {
        title: 'а) Остатки при делении на 3',
        lines: [
          `$n_1=${p.N0}-${sD}$ при делении на $3$ даёт остаток $1$ ($${p.N0}$ даёт остаток $1$, а $${sD}$ делится на $3$).`,
          `Если $n_k$ даёт остаток $1$, то $n_k-${sD}$ тоже даёт остаток $1$. Квадрат числа, не кратного $3$, при делении на $3$ даёт остаток $1$. Значит, каждое число ряда даёт остаток $1$.`,
          `Число $${p.A}$ даёт остаток $${p.A % 3}$, поэтому в ряду его быть не может.`,
        ],
      },
      {
        title: 'б) Пример',
        lines: [
          `Может. При $D=${pb.D}$: $n_1=${p.N0 - p.s * pb.D}$, пока числа больше $${p.s * pb.D}$, каждое следующее меньше предыдущего на $${p.s * pb.D}$: $n_k=${p.N0 - p.s * pb.D}-${p.s * pb.D}(k-1)$, и $n_{${pb.j}}=${p.B}$.`,
        ],
      },
      {
        title: 'в) Прогрессии',
        lines: [
          `При $D=${p.Dv}$ шаг $${sD}=${d}$. Ряд состоит из идущих подряд убывающих арифметических прогрессий с разностью $${d}$; после числа, не большего $${d}$, начинается новая — с числа $(n_k-${d})^2$.`,
          ...kuskiTxt.map((t) => `Прогрессия ${t}.`),
          raznye,
        ],
      },
      {
        title: 'в) Повтор',
        lines: [
          `Следующее число ряда — $n_{${rz.povtor + 1}}=${ch(rp)}$ — уже встречалось: это $n_{${rz.seenIdx + 1}}$. Каждое число ряда определяется предыдущим, поэтому дальше ряд повторяет уже выписанные числа, новых нет.`,
          `Всего различных чисел: $${rz.kuski.map((k) => k.len).join('+')}=${otvetV}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Все числа ряда дают остаток 1 при делении на 3',
        formula: `${p.A}\\not\\equiv1\\pmod3`,
      },
      {
        slovo: 'б) Подбираем $D$, при котором число попадает в первую прогрессию',
        formula: `D=${pb.D}`,
      },
      { slovo: 'в) Выписываем прогрессии до первого повтора', formula: `${otvetV}` },
    ],
    kontrol: { A: false, B: true, V: otvetV, Db: pb.D },
  };
}

export const D20_RYAD_KVADRAT: Shablon2<PD20> = {
  no: 20,
  prototip: 'Ряд с вычитанием и квадратом: остатки по модулю 3, пример, число различных членов',
  sobrat,
};
