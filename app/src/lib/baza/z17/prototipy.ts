/**
 * База, задание №17 «Уравнения»: прототипы задач тренажёра.
 *
 * Прототип — «Задание N» задачника (25 штук), задачи прототипа — его
 * аналоги (analogi.ts). Параметр задачи — номер аналога; запись
 * уравнения разбирает razbor.ts, решение по шагам строит reshenie.ts,
 * а независимый пересчёт ответа — перебор с точной подстановкой
 * (proverka.ts).
 */

import type { GruppaBazy, Params, Prototip } from '../types';
import { ANALOGI_17 } from './analogi';
import { otvetPerebor, type Vopros } from './proverka';
import { pokaz, razobrat } from './razbor';
import { reshit } from './reshenie';

export const GRUPPY_17: GruppaBazy[] = [
  { id: 'A', nazvanie: 'Линейные уравнения', znak: 'ax=b', ton: 'blue' },
  { id: 'B', nazvanie: 'Квадратные уравнения', znak: 'x^2', ton: 'orange' },
  { id: 'C', nazvanie: 'Иррациональные уравнения', znak: '\\sqrt{x}', ton: 'terra' },
  { id: 'D', nazvanie: 'Показательные уравнения', znak: 'a^x', ton: 'green' },
  { id: 'E', nazvanie: 'Логарифмические уравнения', znak: '\\log_a x', ton: 'navy' },
];

const VOPROS: Record<Vopros, string> = {
  koren: 'Найдите корень уравнения $%$.',
  menshiy:
    'Решите уравнение $%$. Если уравнение имеет более одного корня, в ответ запишите меньший из корней.',
  bolshiy:
    'Решите уравнение $%$. Если уравнение имеет более одного корня, в ответ запишите больший из корней.',
};

function prototip(nomer: number, gruppa: string, title: string, vopr: Vopros = 'koren'): Prototip {
  const spisok = ANALOGI_17[nomer - 1];
  if (spisok === undefined) throw new Error(`нет аналогов задания ${nomer}`);
  const zapis = (p: Params): string => {
    const s = spisok[Number(p.i)];
    if (s === undefined) throw new Error(`нет аналога ${String(p.i)}`);
    return s;
  };
  return {
    id: `P${String(nomer).padStart(2, '0')}`,
    gruppa,
    title,
    tip: 'chislo',
    zadach: spisok.length,
    generate: (rng) => ({ i: rng.int(0, spisok.length - 1) }),
    text: (p) => VOPROS[vopr].replace('%', pokaz(zapis(p))),
    solve: (p) => reshit(razobrat(zapis(p)), vopr),
    proverka: (p) => otvetPerebor(razobrat(zapis(p)), vopr),
  };
}

export const PROTOTIPY_17: Prototip[] = [
  prototip(1, 'A', 'Линейное: $ax+b=cx+d$'),
  prototip(2, 'A', 'Линейное со скобкой'),
  prototip(3, 'A', 'Скобка и $x$ в обеих частях'),
  prototip(4, 'A', 'Квадраты, которые сокращаются'),
  prototip(5, 'B', 'Неполное квадратное, меньший корень', 'menshiy'),
  prototip(6, 'B', 'Неполное квадратное, больший корень', 'bolshiy'),
  prototip(7, 'B', 'Квадратное, меньший корень', 'menshiy'),
  prototip(8, 'B', 'Квадратное, больший корень', 'bolshiy'),
  prototip(9, 'C', 'Корень: $\\sqrt{ax+b}=c$'),
  prototip(10, 'D', 'Степени с одним основанием'),
  prototip(11, 'D', 'Произведение и частное степеней'),
  prototip(12, 'D', 'Основание — дробь $\\frac{1}{a}$'),
  prototip(13, 'D', 'Произведение степеней дроби'),
  prototip(14, 'D', 'Степень равна дроби $\\frac{1}{b}$'),
  prototip(15, 'D', 'Произведение степеней равно дроби'),
  prototip(16, 'D', 'Степень дроби равна целому'),
  prototip(17, 'D', 'Основания $a$ и $\\frac{1}{a^k}$'),
  prototip(18, 'D', 'Общий множитель $a^x$'),
  prototip(19, 'E', '$\\log_a f(x)=\\log_a b$'),
  prototip(20, 'E', '$\\log_a f(x)=b$'),
  prototip(21, 'E', 'Десятичный логарифм'),
  prototip(22, 'E', 'Сумма и разность логарифмов'),
  prototip(23, 'E', 'Основание — дробь $\\frac{p}{q}$'),
  prototip(24, 'E', 'Разность логарифмов, справа дробь'),
  prototip(25, 'E', 'Основание меньше единицы'),
];
