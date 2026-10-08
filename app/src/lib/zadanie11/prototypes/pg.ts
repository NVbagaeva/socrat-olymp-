/**
 * Раздел ПГ — задачи на прогрессии (ПГ-01). Геометрическая
 * прогрессия (ПГ-02) зарезервирована.
 *
 * Сумма арифметической прогрессии: S = (a₁ + aₙ)·n / 2.
 */

import { chtoSprashivayut, etapy, num, osh, slovo, str, vopros } from '../kit';
import { d, frac, txt } from '../num';
import { sk, SLOVA } from '../sklonenie';
import type { Subtype } from '../types';
import { otvet } from './common';

const PG01: Subtype = {
  id: 'PG-01',
  section: 'PG',
  title: 'Арифметическая прогрессия: улитка, задачи по дням',
  level: 1,
  keywords: ['улитка', 'прогрессия', 'каждый день больше', 'задачи'],
  oshibki: ['summa-progressii'],
  solve(p) {
    /* «Найди ошибку»: в формуле суммы потеряно деление на 2. */
    const bezDvuh = osh(p) === 'summa-progressii';
    const formula = bezDvuh ? '$S_n=(a_1+a_n)\\cdot n$.' : '$S_n=\\dfrac{(a_1+a_n)\\cdot n}{2}$.';
    const form = str(p, 'form', ['ulitka', 'vasya'] as const);
    /* Аналог: страницы книги, слова, отжимания — что растёт по дням. */
    const chto = slovo(p, 'chto', form === 'ulitka' ? 'Расстояния по дням' : 'Задачи по дням');
    const posled = slovo(
      p,
      'posled',
      form === 'ulitka' ? 'расстояние за последний день' : 'число задач в последний день',
    );
    if (form === 'ulitka') {
      const S = num(p, 'S');
      const s = num(p, 's');
      const n = bezDvuh ? S / s : (2 * S) / s;
      return {
        uslovie: `Улитка ползёт от одного дерева до другого. Каждый день она проползает на одно и то же расстояние больше, чем в предыдущий день. Известно, что за первый и последний дни улитка проползла в общей сложности ${txt(s)} метров. Определите, сколько дней улитка потратила на весь путь, если расстояние между деревьями равно ${txt(S)} метрам.`,
        answer: n,
        etapy: etapy(
          [
            'Обозначаем',
            [`${chto} — арифметическая прогрессия $a_1, a_2, \\ldots, a_n$; $n$ — число дней.`],
          ],
          ['Формула суммы', [formula]],
          [
            'Уравнение',
            [
              bezDvuh
                ? `$a_1+a_n=${d(s)}$, $S_n=${d(S)}$: $${d(s)}n=${d(S)}$.`
                : `$a_1+a_n=${d(s)}$, $S_n=${d(S)}$: $\\dfrac{${d(s)}n}{2}=${d(S)}$.`,
            ],
          ],
          [
            'Решение',
            [
              bezDvuh
                ? `$n=${frac(d(S), d(s))}=${d(n)}$.`
                : `$n=${frac(`2\\cdot${d(S)}`, d(s))}=${d(n)}$.`,
            ],
          ],
          ['Ответ на вопрос задачи', [otvet(n)]],
        ),
        hints: [
          vopros('Какая это последовательность?', 'арифметическая прогрессия', [
            'геометрическая прогрессия',
            'постоянная',
          ]),
          vopros('Какая формула суммы нужна?', '$S_n=\\dfrac{(a_1+a_n)n}{2}$', [
            '$S_n=a_1\\cdot n$',
            '$S_n=a_1+a_n$',
          ]),
          vopros('Чему равно $a_1+a_n$?', `$${d(s)}$`, [`$${d(S)}$`, `$${d(S - s)}$`]),
          chtoSprashivayut('число дней', [posled, 'разность прогрессии']),
        ],
        lifehacks: ['fast-count'],
      };
    }
    const S = num(p, 'S');
    const a1 = num(p, 'a1');
    const n = num(p, 'n');
    const summa = bezDvuh ? S / n : (2 * S) / n;
    const an = summa - a1;
    return {
      uslovie: `Васе надо решить ${sk(S, SLOVA.zadachu)}. Ежедневно он решает на одно и то же количество задач больше по сравнению с предыдущим днём. Известно, что за первый день Вася решил ${sk(a1, SLOVA.zadachu)}. Определите, сколько задач решил Вася в последний день, если со всеми задачами он справился за ${sk(n, SLOVA.den)}.`,
      answer: an,
      etapy: etapy(
        [
          'Обозначаем',
          [
            `${chto} — арифметическая прогрессия, $a_1=${d(a1)}$, $n=${d(n)}$, $S_n=${d(S)}$; ищем $a_n$.`,
          ],
        ],
        ['Формула суммы', [formula]],
        [
          'Уравнение',
          [
            bezDvuh
              ? `$(${d(a1)}+a_n)\\cdot${d(n)}=${d(S)}$.`
              : `$\\dfrac{(${d(a1)}+a_n)\\cdot${d(n)}}{2}=${d(S)}$.`,
          ],
        ],
        [
          'Решение',
          [
            `$${d(a1)}+a_n=${bezDvuh ? frac(d(S), d(n)) : frac(`2\\cdot${d(S)}`, d(n))}=${d(summa)}$, $a_n=${d(an)}$.`,
          ],
        ],
        ['Ответ на вопрос задачи', [otvet(an)]],
      ),
      hints: [
        vopros('Какая это последовательность?', 'арифметическая прогрессия', [
          'геометрическая прогрессия',
          'постоянная',
        ]),
        vopros('Что известно?', '$a_1$, $n$ и сумма $S_n$', ['$a_1$ и разность', 'только сумма']),
        vopros('Чему равно $a_1+a_n$?', `$${d((2 * S) / n)}$`, [`$${d(S / n)}$`, `$${d(S)}$`]),
        chtoSprashivayut(posled, ['разность прогрессии', 'число дней']),
      ],
      lifehacks: ['fast-count'],
    };
  },
};

export const PG: Subtype[] = [PG01];
