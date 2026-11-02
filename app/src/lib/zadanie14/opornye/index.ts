/**
 * «Опорные задачи» задания №14: 15 блоков навыков по 10 задач.
 * Первая задача блока — с полным разбором, остальные — с подсказками
 * (вопросы с кнопками). На карточке блока формул нет (правило раздела),
 * правило с формулами — в «Запомни» внутри блока, и к нему пример.
 */

import type { Blok14 } from '../tipy';
import { ZADACHI_01 } from './b01-prosteyshie';
import { ZADACHI_02 } from './b02-argument';
import { ZADACHI_03 } from './b03-obedinenie';
import { ZADACHI_04 } from './b04-otbor-krug';
import { ZADACHI_05 } from './b05-otbor-nerav';
import { ZADACHI_06 } from './b06-privedenie';
import { ZADACHI_07 } from './b07-privedenie-kvadrat';
import { ZADACHI_08 } from './b08-dvoynoy';
import { ZADACHI_09 } from './b09-slozhenie';
import { ZADACHI_10 } from './b10-zamena';
import { ZADACHI_11 } from './b11-zamena-preobr';
import { ZADACHI_12 } from './b12-odnorodnye-1';
import { ZADACHI_13 } from './b13-odnorodnye-2';
import { ZADACHI_14 } from './b14-vspomogatelnyy';
import { ZADACHI_15 } from './b15-abc';

export const BLOKI_14: Blok14[] = [
  {
    id: 'prosteyshie',
    slug: 'prosteyshie',
    no: 1,
    nazvanie: 'Простейшие уравнения',
    opisanie: 'Синус, косинус, тангенс и котангенс равны числу: точки на окружности и серии.',
    zapomni:
      '$\\sin x=a$: прямая $y=a$, две точки — $x=\\arcsin a+2\\pi k$ и $x=\\pi-\\arcsin a+2\\pi k$. $\\cos x=a$: прямая $x=a$, точки симметричны — $x=\\pm\\arccos a+2\\pi k$. $\\operatorname{tg}x=a$: $x=\\operatorname{arctg}a+\\pi k$. При $|a|>1$ у синуса и косинуса корней нет.',
    primer:
      '$\\cos x=\\dfrac{\\sqrt{2}}{2}$: прямая $x=\\dfrac{\\sqrt{2}}{2}$ пересекает окружность в точках $\\dfrac{\\pi}{4}$ и $-\\dfrac{\\pi}{4}$, поэтому $x=\\pm\\dfrac{\\pi}{4}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    zadachi: ZADACHI_01,
  },
  {
    id: 'argument',
    slug: 'argument',
    no: 2,
    nazvanie: 'Уравнения, сводящиеся к простейшим (с аргументом $kx+b$)',
    opisanie:
      'Сначала решаем относительно всего аргумента, потом выражаем неизвестное и делим период.',
    zapomni:
      'Обозначаем аргумент целиком: $t=kx+b$, решаем простейшее уравнение относительно $t$, затем выражаем $x$. Период делится на $k$ вместе со всем остальным: $2x=\\dfrac{\\pi}{3}+\\pi k\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{2}$.',
    primer:
      '$\\cos 3x=0$: $3x=\\dfrac{\\pi}{2}+\\pi k$, значит $x=\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{3}$. Если поделить на $3$ только $\\dfrac{\\pi}{2}$, а $\\pi k$ оставить, половина корней потеряется.',
    zadachi: ZADACHI_02,
  },
  {
    id: 'obedinenie',
    slug: 'obedinenie',
    no: 3,
    nazvanie: 'Объединение серий',
    opisanie: 'Когда несколько точек окружности записываются одной серией.',
    zapomni:
      'Две диаметрально противоположные точки — одна серия с шагом $\\pi$. Четыре точки через четверть оборота — одна серия с шагом $\\dfrac{\\pi}{2}$. Объединять не обязательно, но так короче и легче отбирать корни.',
    primer:
      '$\\sin^2 x=\\dfrac{1}{2}$: точки $\\dfrac{\\pi}{4},\\ \\dfrac{3\\pi}{4},\\ \\dfrac{5\\pi}{4},\\ \\dfrac{7\\pi}{4}$ идут через $\\dfrac{\\pi}{2}$, поэтому $x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$.',
    zadachi: ZADACHI_03,
  },
  {
    id: 'otbor-krug',
    slug: 'otbor-po-okruzhnosti',
    no: 4,
    nazvanie: 'Отбор корней по окружности',
    opisanie: 'Выделяем дугу промежутка и подписываем точки серий, которые на неё попали.',
    zapomni:
      'Дугу отмечаем от левого конца промежутка против часовой стрелки до правого. Точку на дуге подписываем, считая от ближайшего подписанного конца. Промежуток длиннее оборота — рисуем две окружности.',
    primer:
      'Промежуток $\\left[-\\dfrac{5\\pi}{2};\\,-\\pi\\right]$, серия $x=\\pi k$: от $-\\dfrac{5\\pi}{2}$ (нижняя точка) идём против часовой стрелки до $-\\pi$ (левая точка). На дуге лежат $-2\\pi$ (правая точка) и $-\\pi$.',
    zadachi: ZADACHI_04,
  },
  {
    id: 'otbor-nerav',
    slug: 'otbor-neravenstvom',
    no: 5,
    nazvanie: 'Отбор двойным неравенством',
    opisanie: 'Подставляем серию в границы промежутка и ищем подходящие номера корней.',
    zapomni:
      'Корень серии $x=x_0+h\\pi k$ лежит в $[a;\\,b]$, если $a\\le x_0+h\\pi k\\le b$. Делим на $\\pi$, вычитаем $x_0$, делим на $h$ — получаем границы для $k$ и берём все целые между ними. Строгий знак — для конца, который не входит.',
    primer:
      '$x=\\dfrac{\\pi}{2}+2\\pi k$ на $\\left[-\\dfrac{\\pi}{2};\\,2\\pi\\right]$: $-\\dfrac{1}{2}\\le\\dfrac{1}{2}+2k\\le 2$, $-1\\le 2k\\le\\dfrac{3}{2}$, $-\\dfrac{1}{2}\\le k\\le\\dfrac{3}{4}$. Целое только $k=0$: корень $\\dfrac{\\pi}{2}$.',
    zadachi: ZADACHI_05,
  },
  {
    id: 'privedenie',
    slug: 'privedenie',
    no: 6,
    nazvanie: 'Формулы приведения',
    opisanie: 'Меняется ли функция и какой знак ставить: правило и проверка по четверти.',
    zapomni:
      'Если к $x$ прибавляется $\\dfrac{\\pi}{2}$ или $\\dfrac{3\\pi}{2}$ — функция меняется на кофункцию ($\\sin\\leftrightarrow\\cos$, $\\operatorname{tg}\\leftrightarrow\\operatorname{ctg}$); если $\\pi$ или $2\\pi$ — не меняется. Знак — как у исходной функции в той четверти, где лежит угол при малом положительном $x$.',
    primer:
      '$\\cos\\left(\\dfrac{3\\pi}{2}+x\\right)$: есть $\\dfrac{3\\pi}{2}$ — косинус меняется на синус. Угол $\\dfrac{3\\pi}{2}+x$ — в IV четверти, косинус там положителен. Итог: $\\cos\\left(\\dfrac{3\\pi}{2}+x\\right)=\\sin x$.',
    zadachi: ZADACHI_06,
  },
  {
    id: 'privedenie-kvadrat',
    slug: 'privedenie-pod-kvadratom',
    no: 7,
    nazvanie: 'Приведение под квадратом',
    opisanie: 'Когда знак формулы приведения можно не определять.',
    zapomni:
      'Под квадратом знак не важен: $(-a)^2=a^2$. Поэтому достаточно решить, меняется ли функция: $\\sin^2\\left(\\dfrac{3\\pi}{2}-x\\right)=\\cos^2 x$, $\\cos^2(\\pi+x)=\\cos^2 x$.',
    primer:
      '$\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)=-\\cos x$, а после возведения в квадрат минус исчезает: $\\sin^2\\left(\\dfrac{3\\pi}{2}-x\\right)=(-\\cos x)^2=\\cos^2x$.',
    zadachi: ZADACHI_07,
  },
  {
    id: 'dvoynoy',
    slug: 'dvoynoy-ugol',
    no: 8,
    nazvanie: 'Двойной угол и общий множитель',
    opisanie: 'Синус двойного угла, три вида косинуса двойного угла и разложение на множители.',
    zapomni:
      '$\\sin 2x=2\\sin x\\cos x$; $\\cos 2x=\\cos^2x-\\sin^2x=2\\cos^2x-1=1-2\\sin^2x$. **Не сокращай на функцию** — выноси её за скобки: $AB=0\\ \\Leftrightarrow\\ A=0$ или $B=0$.',
    primer:
      '$\\sin 2x=\\cos x$: $2\\sin x\\cos x-\\cos x=0$, $\\cos x\\,(2\\sin x-1)=0$. Если сократить на $\\cos x$, потеряется вся серия $x=\\dfrac{\\pi}{2}+\\pi k$.',
    zadachi: ZADACHI_08,
  },
  {
    id: 'slozhenie',
    slug: 'formuly-slozheniya',
    no: 9,
    nazvanie: 'Формулы сложения',
    opisanie: 'Синус и косинус суммы и разности: раскрываем и приводим подобные.',
    zapomni:
      '$\\sin(\\alpha\\pm\\beta)=\\sin\\alpha\\cos\\beta\\pm\\cos\\alpha\\sin\\beta$; $\\cos(\\alpha\\pm\\beta)=\\cos\\alpha\\cos\\beta\\mp\\sin\\alpha\\sin\\beta$.',
    primer:
      '$\\cos\\left(\\dfrac{\\pi}{3}-x\\right)=\\cos\\dfrac{\\pi}{3}\\cos x+\\sin\\dfrac{\\pi}{3}\\sin x=\\dfrac{1}{2}\\cos x+\\dfrac{\\sqrt{3}}{2}\\sin x$.',
    zadachi: ZADACHI_09,
  },
  {
    id: 'zamena',
    slug: 'zamena',
    no: 10,
    nazvanie: 'Замена сразу',
    opisanie: 'Уравнение уже квадратное относительно одной функции.',
    zapomni:
      'Обозначаем функцию буквой: $t=\\sin x$ или $t=\\cos x$ — и сразу пишем условие $-1\\le t\\le 1$. Корни квадратного уравнения вне этого отрезка отбрасываем. Для $t=\\operatorname{tg}x$ ограничений нет.',
    primer:
      '$2\\cos^2x-\\cos x-1=0$, $t=\\cos x$: $2t^2-t-1=0$, $t=1$ или $t=-\\dfrac{1}{2}$ — оба подходят, получаем $x=2\\pi k$ и $x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$.',
    zadachi: ZADACHI_10,
  },
  {
    id: 'zamena-preobr',
    slug: 'zamena-posle-preobrazovaniy',
    no: 11,
    nazvanie: 'Замена после преобразований',
    opisanie: 'Сначала оставляем одну функцию — через тождество, двойной угол или приведение.',
    zapomni:
      'Если в уравнении есть и $\\sin x$, и $\\cos x$, выразите одну функцию через другую: $\\sin^2x=1-\\cos^2x$, $\\cos 2x=1-2\\sin^2x$ или $2\\cos^2x-1$. Выбираем ту запись, после которой остаётся одна функция.',
    primer:
      '$6\\sin^2x+5\\cos x-2=0$: $\\sin^2x=1-\\cos^2x$, получаем $6\\cos^2x-5\\cos x-4=0$ — квадратное относительно $\\cos x$.',
    zadachi: ZADACHI_11,
  },
  {
    id: 'odnorodnye-1',
    slug: 'odnorodnye-pervoy-stepeni',
    no: 12,
    nazvanie: 'Однородные первой степени',
    opisanie: 'Синус и косинус в первой степени без свободного члена: делим на косинус.',
    zapomni:
      '$a\\sin x+b\\cos x=0$, $a\\ne0$. Пусть $\\cos x=0$. Тогда из уравнения $\\sin x=0$, а синус и косинус одновременно в ноль не обращаются ($\\sin^2x+\\cos^2x=1$). Значит, $\\cos x\\ne 0$, делим на $\\cos x$: $a\\operatorname{tg}x+b=0$.',
    primer:
      '$\\sin x-\\sqrt{3}\\cos x=0$: $\\cos x\\ne0$ (иначе и $\\sin x=0$), делим: $\\operatorname{tg}x=\\sqrt{3}$, $x=\\dfrac{\\pi}{3}+\\pi k$.',
    zadachi: ZADACHI_12,
  },
  {
    id: 'odnorodnye-2',
    slug: 'odnorodnye-vtoroy-stepeni',
    no: 13,
    nazvanie: 'Однородные второй степени',
    opisanie: 'Квадраты синуса и косинуса и их произведение, в том числе с числом справа.',
    zapomni:
      '$a\\sin^2x+b\\sin x\\cos x+c\\cos^2x=0$, $a\\ne0$: доказываем $\\cos x\\ne0$ от противного и делим на $\\cos^2x$. Если $a=0$ или $c=0$ — делить нельзя, выносим общий множитель. Число справа: $d=d(\\sin^2x+\\cos^2x)$.',
    primer:
      '$\\sin^2x-3\\sin x\\cos x+2\\cos^2x=0$: при $\\cos x=0$ было бы $\\sin x=0$ — противоречие; делим на $\\cos^2x$: $\\operatorname{tg}^2x-3\\operatorname{tg}x+2=0$, $\\operatorname{tg}x=1$ или $\\operatorname{tg}x=2$.',
    zadachi: ZADACHI_13,
  },
  {
    id: 'vspomogatelnyy',
    slug: 'vspomogatelnyy-ugol',
    no: 14,
    nazvanie: 'Вспомогательный угол',
    opisanie: 'Сумму синуса и косинуса с коэффициентами сворачиваем в одну функцию.',
    zapomni:
      '$a\\sin x+b\\cos x=c$: делим на $\\sqrt{a^2+b^2}$. Коэффициенты становятся косинусом и синусом одного угла $\\varphi$, и левая часть сворачивается: $\\sin(x+\\varphi)=\\dfrac{c}{\\sqrt{a^2+b^2}}$.',
    primer:
      '$\\sin x+\\sqrt{3}\\cos x=1$: делим на $2$, $\\dfrac{1}{2}\\sin x+\\dfrac{\\sqrt{3}}{2}\\cos x=\\dfrac{1}{2}$, то есть $\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=\\dfrac{1}{2}$.',
    zadachi: ZADACHI_14,
  },
  {
    id: 'abc',
    slug: 'a-sin-b-cos-c',
    no: 15,
    nazvanie: 'Синус и косинус с числом справа: два способа',
    opisanie: 'Через половинный угол и через вспомогательный угол на одних и тех же примерах.',
    zapomni:
      'Половинный угол: $\\sin x=2\\sin\\dfrac{x}{2}\\cos\\dfrac{x}{2}$, $\\cos x=\\cos^2\\dfrac{x}{2}-\\sin^2\\dfrac{x}{2}$, $c=c\\left(\\sin^2\\dfrac{x}{2}+\\cos^2\\dfrac{x}{2}\\right)$ — получается однородное уравнение второй степени. Вспомогательный угол — деление на $\\sqrt{a^2+b^2}$.',
    primer:
      '$\\sin x+\\cos x=1$ через половинный угол: $2\\sin\\dfrac{x}{2}\\cos\\dfrac{x}{2}+\\cos^2\\dfrac{x}{2}-\\sin^2\\dfrac{x}{2}=\\sin^2\\dfrac{x}{2}+\\cos^2\\dfrac{x}{2}$, откуда $2\\sin\\dfrac{x}{2}\\left(\\cos\\dfrac{x}{2}-\\sin\\dfrac{x}{2}\\right)=0$.',
    zadachi: ZADACHI_15,
  },
];
