/**
 * Шесть блоков опорных задач №9, по десять микрозадач.
 */

import { BLOCK_1 } from './block-1';
import { BLOCK_2 } from './block-2';
import { BLOCK_3 } from './block-3';
import { BLOCK_4 } from './block-4';
import { BLOCK_5 } from './block-5';
import { BLOCK_6 } from './block-6';
import type { PrepBlock } from './types';

export const PREP_BLOCKS: PrepBlock[] = [
  {
    id: 'P9-1',
    slug: 'naklon',
    no: '01',
    nazvanie: 'Угловой коэффициент по двум узлам',
    lead: 'Находим наклон прямой по двум узловым точкам: катеты, дробь, знак',
    zapomni: [
      'Угловой коэффициент прямой: $k=\\operatorname{tg}\\alpha=\\dfrac{\\Delta y}{\\Delta x}$.',
      'Если прямая идёт вниз, угол $\\alpha$ тупой и $k=-\\dfrac{\\Delta y}{\\Delta x}$, где катеты считаем по модулю.',
    ],
    zadachi: BLOCK_1,
  },
  {
    id: 'P9-2',
    slug: 'smezhnyy',
    no: '02',
    nazvanie: 'Смежный угол и знак наклона',
    lead: 'Тупой угол наклона: знак тангенса и переход к острому смежному углу',
    zapomni: [
      '$\\operatorname{tg}(180^\\circ-\\alpha)=-\\operatorname{tg}\\alpha$.',
      'Угол острый: $k>0$; угол тупой: $k<0$; прямая параллельна $Ox$: $k=0$.',
    ],
    zadachi: BLOCK_2,
  },
  {
    id: 'P9-3',
    slug: 'znak',
    no: '03',
    nazvanie: 'Знак производной по графику функции',
    lead: 'Читаем возрастание, убывание и экстремумы по графику самой функции',
    zapomni: [
      "$f'(x)>0$ там, где $f$ возрастает; $f'(x)<0$ там, где $f$ убывает.",
      "В точке максимума или минимума $f'(x)=0$ и график меняет направление.",
    ],
    zadachi: BLOCK_3,
  },
  {
    id: 'P9-4',
    slug: 'nuli',
    no: '04',
    nazvanie: 'Нули производной и экстремумы по графику её производной',
    lead: 'Читаем нули, знаки и тип точек по графику производной',
    zapomni: [
      "Нуль $f'$, где знак меняется с «+» на «−», — точка максимума; с «−» на «+» — точка минимума.",
      "Если знак $f'$ не меняется, экстремума нет, хотя $f'(x)=0$.",
    ],
    zadachi: BLOCK_4,
  },
  {
    id: 'P9-5',
    slug: 'skorost',
    no: '05',
    nazvanie: 'Производная и скорость по формуле',
    lead: 'Считаем производную и мгновенную скорость по формуле, без рисунка',
    zapomni: [
      "$(x^n)'=nx^{n-1}$, $(c)'=0$, $(kx)'=k$.",
      "Скорость: $v(t)=x'(t)$.",
    ],
    zadachi: BLOCK_5,
  },
  {
    id: 'P9-6',
    slug: 'ploshchad',
    no: '06',
    nazvanie: 'Площадь и первообразная',
    lead: 'Площадь под ломаной на клетках, значения первообразной, приращение',
    zapomni: [
      '$F(b)-F(a)$ — площадь под графиком $f$ на $[a;\\ b]$ со знаком: «+» над осью, «−» под осью.',
      "$F'(x)=f(x)$; для $f(x)=kx^n$ одна из первообразных $F(x)=\\dfrac{kx^{n+1}}{n+1}$.",
    ],
    zadachi: BLOCK_6,
  },
];

export function prepBlockBySlug(slug: string): PrepBlock | undefined {
  return PREP_BLOCKS.find((b) => b.slug === slug);
}

export function prepBlockById(id: string): PrepBlock | undefined {
  return PREP_BLOCKS.find((b) => b.id === id);
}

export function prepMicroById(id: string) {
  return PREP_BLOCKS.flatMap((b) => b.zadachi).find((m) => m.id === id);
}
