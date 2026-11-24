/**
 * Тексты живых сцен блока «Понятие производной» (теория №8):
 * components/zhivye/proizvodnaya. Отдельно от content/theoryPonyatie9.ts
 * (содержание раздела, его сторожит check-redesign): здесь — подача.
 * Формулы — в $…$; подписи внутри SVG (ключи svg*) и тексты для диктора (aria*) — обычным текстом (правило в scripts/lib/math-source.mjs).
 */

import type { TekstyUpravleniya } from '@/components/zhivye/Elementy';

const UPRAVLENIE: TekstyUpravleniya = {
  zapustit: 'Запустить',
  prodolzhit: 'Продолжить',
  pauza: 'Пауза',
  snachala: 'Сначала',
  eshche: 'Ещё раз',
  skorostPokaza: 'Скорость показа',
  klaviatura: 'Пробел — пуск и пауза, стрелки — шаг по шкале.',
};

export const SEKUSHCHAYA8 = {
  nad: 'Посмотри, как это работает',
  zag: 'Секущая поворачивается к касательной',
  lead: 'График $f(x)=\\dfrac{(x-2)^2}{4}+1{,}5$, точка $M$ при $x=4$. Точка $M_1$ сдвинута на $\\Delta x$. Запусти — $\\Delta x$ уменьшается, $M_1$ подходит к $M$, и секущая $MM_1$ ложится на касательную.',
  alt: 'График параболы, неподвижная точка M и точка M₁, которая скользит к ней по графику; секущая MM₁ поворачивается и сливается с касательной MT.',
  zagruzka: 'Сцена загружается…',
  upravlenie: UPRAVLENIE,
  ariaVremya: 'Приращение Δx',
  puzyr: (dx: string) => `$\\Delta x = ${dx}$`,
  ariaPuzyr: (dx: string) => `Δx = ${dx}`,
  svgTg: (tg: string) => `tg β = ${tg}`,
  svgLupa: 'вблизи M',
  status: {
    start: 'Секущая $MM_1$ — тёплая, касательная в точке $M$ — пунктир.',
    idet: 'Точка $M_1$ подходит к $M$ — секущая поворачивается.',
    snimok: (dx: string, df: string, tg: string) =>
      `$\\Delta x=${dx}$: $\\Delta f=${df}$, $\\operatorname{tg}\\beta=\\dfrac{\\Delta f}{\\Delta x}=${tg}$.`,
    konec:
      "При $\\Delta x\\to0$ секущая сливается с касательной: $\\operatorname{tg}\\beta\\to\\operatorname{tg}\\alpha=1=f'(4)$.",
  },
  tablica: {
    caption: 'Отношение приращений',
    dx: '$\\Delta x$',
    df: '$\\Delta f$',
    tg: '$\\operatorname{tg}\\beta$',
    seychas: 'сейчас',
    predel: '$\\to 0$',
    predelTg: '$\\to 1$',
  },
  itog: '$\\operatorname{tg}\\alpha=\\lim\\limits_{\\Delta x\\to0}\\dfrac{\\Delta f}{\\Delta x}=1$ — угловой коэффициент касательной.',
};

export const SKOROST8_T = {
  nad: 'Посмотри, как это работает',
  zag: 'Средняя скорость подходит к мгновенной',
  lead: 'Точка движется по закону $s(t)=\\dfrac{t^2}{2}$ (метры, секунды). Момент $t=2$: точка в $M$. Запусти — промежуток $\\Delta t$ уменьшается, и средняя скорость на спидометре подходит к $2$ м/с.',
  alt: 'Прямая дорога с отметками в метрах, точка M и точка M₁, которая подходит к ней; над дорогой спидометр, стрелка средней скорости подходит к 2 м/с.',
  zagruzka: 'Сцена загружается…',
  upravlenie: UPRAVLENIE,
  ariaVremya: 'Промежуток Δt',
  puzyr: (dt: string) => `$\\Delta t = ${dt}$ с`,
  ariaPuzyr: (dt: string) => `Δt = ${dt} с`,
  svgDs: (ds: string) => `Δs = ${ds} м`,
  svgV: (v: string) => `${v} м/с`,
  svgSpidometr: 'средняя скорость',
  status: {
    start: 'За $\\Delta t$ точка проходит путь $\\Delta s$ от $M$ до $M_1$.',
    idet: 'Промежуток $\\Delta t$ уменьшается — путь $\\Delta s$ тоже.',
    snimok: (dt: string, ds: string, v: string) =>
      `$\\Delta t=${dt}$ с: $\\Delta s=${ds}$ м, $v_{\\text{ср}}=\\dfrac{\\Delta s}{\\Delta t}=${v}$ м/с.`,
    konec: 'При $\\Delta t\\to0$ средняя скорость подходит к мгновенной: $v=2$ м/с.',
  },
  tablica: {
    caption: 'Средняя скорость',
    dt: '$\\Delta t$, с',
    ds: '$\\Delta s$, м',
    v: '$v_{\\text{ср}}$, м/с',
    seychas: 'сейчас',
    predel: '$\\to 0$',
    predelV: '$\\to 2$',
  },
  itog: '$v=\\lim\\limits_{\\Delta t\\to0}\\dfrac{\\Delta s}{\\Delta t}=2$ м/с — мгновенная скорость в момент $t=2$.',
};

export const MODUL8_T = {
  nad: 'Посмотри, как это работает',
  zag: 'У модуля в нуле нет производной',
  lead: 'График $y=|x|$, точка $O$ — излом. Запусти — точка $M_1$ подходит к нулю справа, а потом слева, и посмотри, к чему стремится отношение $\\dfrac{\\Delta y}{\\Delta x}$.',
  alt: 'График модуля — «галочка» с изломом в нуле; секущая из начала координат к точке M₁ справа совпадает с правой ветвью, слева — с левой; наклон скачет от 1 к −1.',
  zagruzka: 'Сцена загружается…',
  upravlenie: UPRAVLENIE,
  ariaVremya: 'Приращение Δx',
  puzyr: (dx: string) => `$\\Delta x = ${dx}$`,
  ariaPuzyr: (dx: string) => `Δx = ${dx}`,
  svgOtn: (o: string) => `Δy/Δx = ${o}`,
  svgSprava: 'справа: 1',
  svgSleva: 'слева: −1',
  status: {
    start: 'Секущая из $O$ в $M_1$ справа лежит на правой ветви.',
    sprava: 'Справа от нуля $\\dfrac{\\Delta y}{\\Delta x}=1$ при любом $\\Delta x$.',
    nol: '$\\Delta x=0$ быть не может: на ноль делить нельзя — точка перескакивает на другую сторону.',
    sleva: 'Слева от нуля $\\dfrac{\\Delta y}{\\Delta x}=-1$ при любом $\\Delta x$.',
    konec:
      'Справа отношение стремится к $1$, слева — к $-1$: общего предела нет, производной в нуле нет.',
  },
  tablica: {
    caption: 'Отношение приращений',
    dx: '$\\Delta x$',
    dy: '$\\Delta y$',
    otn: '$\\dfrac{\\Delta y}{\\Delta x}$',
    seychas: 'сейчас',
  },
};
