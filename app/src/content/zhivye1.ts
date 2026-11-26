/**
 * Тексты живых сцен справочника №1 (планиметрия): components/zhivye/
 * planimetriya1. Формулы — в $…$; ключи svg* и aria* — обычный текст.
 */

import type { TekstyUpravleniya } from '@/components/zhivye/Elementy';

const UPRAVLENIE: TekstyUpravleniya = {
  zapustit: 'Запустить',
  prodolzhit: 'Продолжить',
  pauza: 'Пауза',
  snachala: 'Сначала',
  eshche: 'Ещё раз',
  skorostPokaza: 'Скорость показа',
  klaviatura: 'Пробел — пуск и пауза, стрелки — шаг вперёд и назад.',
};

export const VPISANNYY1 = {
  nad: 'Посмотри, как это работает',
  zag: 'Вписанный угол — половина центрального',
  lead: 'Точка $C$ идёт по окружности, а $\\angle ACB$ не меняется: он всё время равен половине центрального $\\angle AOB$, который опирается на ту же дугу $AB$.',
  alt: 'Окружность с центром O, точки A и B, дуга AB подсвечена; точка C движется по большой дуге, у C и у O подписаны углы.',
  zagruzka: 'Сцена загружается…',
  upravlenie: UPRAVLENIE,
  ariaVremya: 'Положение точки C',
  puzyr: (vp: string) => `$\\angle ACB=${vp}^\\circ$`,
  ariaPuzyr: (vp: string) => `угол ACB = ${vp}°`,
  metkaStart: '∠AOB = 80°',
  metkaDiametr: '180°',
  svgCentralnyy: (g: string) => `∠AOB = ${g}°`,
  svgVpisannyy: (g: string) => `∠ACB = ${g}°`,
  status: {
    start:
      'Центральный $\\angle AOB=80^\\circ$ опирается на дугу $AB$. Запусти — точка $C$ пойдёт по окружности.',
    vne: 'Центр $O$ вне угла $ACB$, а угол всё равно $40^\\circ$.',
    naStorone:
      'Сторона угла прошла через центр $O$ — это диаметр. Угол $ACB$ по-прежнему $40^\\circ$.',
    vnutri: 'Центр $O$ внутри угла $ACB$ — снова $40^\\circ$.',
    itog1:
      'Где бы ни была $C$ на этой дуге, $\\angle ACB=\\dfrac12\\angle AOB=40^\\circ$. Теперь раздвинем точки $A$ и $B$.',
    rastet: (c: string, v: string) =>
      `Дуга $AB$ растёт: $\\angle AOB=${c}^\\circ$, $\\angle ACB=${v}^\\circ$ — ровно половина.`,
    konec:
      '$AB$ — диаметр: $\\angle AOB=180^\\circ$, значит, $\\angle ACB=90^\\circ$. Вписанный угол, опирающийся на диаметр, — прямой.',
  },
};

export const SUMMA1 = {
  nad: 'Посмотри, как это работает',
  zag: 'Почему сумма углов треугольника — 180°',
  lead: 'Через вершину $B$ проведём прямую, параллельную $AC$, и перенесём к ней углы $A$ и $C$: накрест лежащие углы равны. Три угла сложатся в развёрнутый.',
  alt: 'Треугольник ABC; через B проводится прямая, параллельная AC; цветные углы A и C переезжают к вершине B и вместе с углом B заполняют развёрнутый угол.',
  zagruzka: 'Сцена загружается…',
  upravlenie: UPRAVLENIE,
  vid: 'Треугольник',
  vidy: { ostryy: 'остроугольный', tupoy: 'тупоугольный', pryamoy: 'прямоугольный' } as Record<
    string,
    string
  >,
  ariaVremya: 'Шаг доказательства',
  puzyr: [
    '$\\angle A+\\angle B+\\angle C$',
    'прямая $\\parallel AC$',
    'переносим $\\angle A$',
    'переносим $\\angle C$',
    '$180^\\circ$',
  ],
  metki: ['', 'прямая', '∠A', '∠C'],
  svgUgol: (v: string, g: number) => `${v} = ${g}°`,
  status: {
    start: (a: number, b: number, c: number) =>
      `$\\angle A=${a}^\\circ$, $\\angle B=${b}^\\circ$, $\\angle C=${c}^\\circ$. Запусти — сложим их у вершины $B$.`,
    pryamaya: 'Через $B$ проводим прямую, параллельную $AC$.',
    a: (a: number) =>
      `Угол $A$ и угол у $B$ слева — накрест лежащие при параллельных прямых и секущей $AB$: оба по $${a}^\\circ$.`,
    c: (c: number) =>
      `Так же угол $C$ равен углу у $B$ справа — оба по $${c}^\\circ$ (секущая $BC$).`,
    konec: (a: number, b: number, c: number) =>
      `У вершины $B$ три угла заполнили развёрнутый: $${a}^\\circ+${b}^\\circ+${c}^\\circ=180^\\circ$.`,
  },
};
