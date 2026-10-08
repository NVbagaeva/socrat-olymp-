/**
 * «Найди ошибку»: решение ученика с типичной ошибкой.
 *
 * Ошибка вносится не в готовый текст, а в саму модель задачи: подтип
 * решает задачу так, как решил бы ученик с этой ошибкой
 * (solve({ ...params, osh: id }), см. Subtype.oshibki). Поэтому всё
 * после ошибки — таблица, уравнение, корни, ответ — посчитано из
 * неверной строки и согласовано с ней, как в настоящей работе: в
 * строке «Ответ» ученик пишет неверный ответ, к которому ошибка привела.
 *
 * Словарь — по разделам задания №11 (docs/audit/zadanie-11.md,
 * таблица 4.3). Учителю отдаётся, где ошибка (шаг), что не так, строка
 * как написано и как верно, ответ ученика и верный ответ.
 */

import { rngOf } from '../vychisleniya/rng';
import { izStroki } from './proporciya/bloki';
import type { Etap, Params, Subtype, Tablitsa } from './types';

export type { Etap } from './types';

export interface Oshibka {
  id: string;
  /** Что не так — коротко, для учителя. */
  chto: string;
  /** Как верно — правило, формулы в $…$. */
  verno: string;
}

export const OSHIBKI: readonly Oshibka[] = [
  {
    id: 'procent-znak',
    chto: 'Снижение (удержание) на несколько процентов записано как повышение.',
    verno:
      'Стало меньше — от $100\\%$ отнимаем: новая величина составляет $100\\%-p\\%$ от старой.',
  },
  {
    id: 'massa-tretego',
    chto: 'Масса третьего сплава записана как $2x$: разность масс $d$ потеряна.',
    verno: 'Масса третьего сплава — сумма масс двух первых: $x+(x+d)=2x+d$.',
  },
  {
    id: 'obem-ne-izmenen',
    chto: 'Масса (объём) раствора не пересчитана: воду не прибавили к раствору.',
    verno:
      'Вещества после добавления воды столько же, а раствора стало больше: $m_{\\text{р-ра}}+m_{\\text{воды}}$.',
  },
  {
    id: 'stoyanka',
    chto: 'Время стоянки не вычтено: всё время от отплытия до возвращения принято за время в движении.',
    verno: 'Стоянку вычитаем из общего времени до составления уравнения.',
  },
  {
    id: 'navstrechu',
    chto: 'При встречном движении скорости вычли.',
    verno: 'Навстречу скорости складываются, в одном направлении — вычитаются.',
  },
  {
    id: 'put-mimo',
    chto: 'Путь «мимо» принят за длину одного поезда: длину второго поезда не учли.',
    verno: 'Чтобы пройти мимо встречного поезда, нужно сместиться на сумму длин обоих поездов.',
  },
  {
    id: 'minuty',
    chto: 'Минуты переведены в часы как десятичная дробь: $40$ мин записали как $0{,}4$ ч.',
    verno: 'В часе $60$ минут: $40$ мин $=\\dfrac{40}{60}=\\dfrac{2}{3}$ ч.',
  },
  {
    id: 'summa-progressii',
    chto: 'В формуле суммы потеряно деление на $2$.',
    verno:
      '$S_n=\\dfrac{(a_1+a_n)\\cdot n}{2}$ — сумма равна полусумме крайних, умноженной на число членов.',
  },
  {
    id: 'ne-ta-velichina',
    chto: 'Уравнение решено верно, но в ответ записана не та величина, которую спрашивают.',
    verno: 'Перечитываем вопрос задачи и выражаем через $x$ именно то, что спрашивают.',
  },
];

const PO_ID = new Map(OSHIBKI.map((o) => [o.id, o]));

export function oshibkaPoId(id: string): Oshibka {
  const o = PO_ID.get(id);
  if (o === undefined) throw new Error(`нет ошибки «${id}» в словаре`);
  return o;
}

export interface NaydennayaOshibka {
  oshibka: Oshibka;
  /** Первая неверная строка: индекс этапа и строки в разборе ученика. */
  etap: number;
  stroka: number;
  /** Номер шага для ученика и учителя: «Шаг 3». */
  shag: string;
  /** Строка как верно (в нашем разборе) и как написал ученик. */
  bylo: string;
  stalo: string;
  /** Работа ученика целиком: с ошибкой и всем, что из неё следует (без пояснений методики). */
  etapy: Etap[];
  tables: Tablitsa[];
  /** Ответ ученика и верный ответ. */
  otvetUchenika: number;
  otvet: number;
}

/* Пояснения методики, которых нет в тетради ученика: карточки и
   плашки разбора, «зачем» и «почему» шагов, лайфхаки и второй способ. */
const KARTOCHKI = new Set(['spravka100', 'plashka', 'pravilo', 'priznaki']);
const POYASNENIYA = [
  /^Сначала решаем главный вопрос/,
  /^Краткая запись помогает/,
  /^Для удобства вместо знака вопроса/,
  /^Величины (прямо|обратно) пропорциональны/,
  /^Неизвестный (средний|крайний) член/,
  /^\*\*Лайфхак:\*\*/,
  /^\*\*Иначе/,
];

/** Решение в виде работы ученика: только его записи и вычисления. */
export function rabotaUchenika(etapy: readonly Etap[]): Etap[] {
  return etapy.map((e) => ({
    title: e.title,
    lines: e.lines.filter((l) => {
      const b = izStroki(l);
      if (b !== null) return !KARTOCHKI.has(b.vid);
      return !POYASNENIYA.some((re) => re.test(l));
    }),
  }));
}

/** Ответ, который ученик мог бы записать: положительное число, не больше трёх знаков после запятой. */
function pravdopodobnyy(x: number): boolean {
  return Number.isFinite(x) && x > 0 && Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-6;
}

/** Ошибка id в решении задачи: решение ученика или null, если с этими числами ошибка не получается. */
export function vnestiOshibku(st: Subtype, params: Params, id: string): NaydennayaOshibka | null {
  let verno;
  let uchenik;
  try {
    verno = st.solve(params);
    uchenik = st.solve({ ...params, osh: id });
  } catch {
    return null;
  }
  if (!pravdopodobnyy(uchenik.answer) || Math.abs(uchenik.answer - verno.answer) < 1e-9) {
    return null;
  }
  const rabota = rabotaUchenika(uchenik.etapy);
  const obrazec = rabotaUchenika(verno.etapy);
  for (let ei = 0; ei < rabota.length; ei += 1) {
    const e = rabota[ei] as Etap;
    const ev = obrazec[ei];
    for (let li = 0; li < e.lines.length; li += 1) {
      const stalo = e.lines[li] as string;
      const bylo = ev?.lines[li];
      if (bylo === stalo) continue;
      return {
        oshibka: oshibkaPoId(id),
        etap: ei,
        stroka: li,
        shag: /^Шаг \d+/.exec(e.title)?.[0] ?? `Шаг ${ei + 1}`,
        bylo: bylo ?? '',
        stalo,
        etapy: rabota,
        tables: uchenik.tables ?? [],
        otvetUchenika: uchenik.answer,
        otvet: verno.answer,
      };
    }
  }
  return null;
}

/**
 * Подобрать ошибку к задаче. Среди ошибок подтипа, которые с этими
 * числами дают правдоподобный неверный ответ, выбор — по seed, чтобы
 * на листе встречались разные. Нет таких — null.
 */
export function naytiOshibku(st: Subtype, params: Params, seed: string): NaydennayaOshibka | null {
  const varianty = (st.oshibki ?? [])
    .map((id) => vnestiOshibku(st, params, id))
    .filter((o) => o !== null);
  if (varianty.length === 0) return null;
  /* Ошибка в модели (до ответа) показательнее, чем «не та величина» в
     ответе: она берётся, когда с этими числами получается. */
  const vModeli = varianty.filter((o) => o.oshibka.id !== 'ne-ta-velichina');
  const iz = vModeli.length > 0 ? vModeli : varianty;
  const i = Math.floor(rngOf(`z11-oshibka|${seed}`).next() * iz.length);
  return iz[Math.min(i, iz.length - 1)] ?? null;
}
