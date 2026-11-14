/**
 * Разбор задачи №12 для «Стеклянной сцены»: шаги движка (PrepStep —
 * тот же разбор, что в опорных задачах) в шаги ShagiResheniya. Сами
 * шаги не переписываются: каждый блок выводится как есть и в том же
 * порядке — текст, выкладка, чертёж шага, ответ, врезка, «если нужна
 * вся формула». Модуль чистый: KaTeX приходит параметром (на сборке —
 * карта «О задании», в браузере — тренажёр).
 */

import type { PrepBlock, PrepStep } from '@/lib/prep';

/** Шаг разбора в разметке: название, всё содержимое одним куском, тон. */
export interface Shag12 {
  zagolovokHtml: string;
  chtoHtml: string;
  ton?: 'odz' | 'otbor';
}

type Typeset = (text: string) => string;

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function blokHtml(block: PrepBlock, typeset: Typeset): string {
  switch (block.type) {
    case 'text':
      return `<p class="z12-shag__tekst">${block.html}</p>`;
    case 'formula':
      return `<div class="z12-shag__formula${block.feature ? ' is-glavnaya' : ''}">${block.html}</div>`;
    case 'answer':
      return `<p class="z12-shag__otvet">${block.html}</p>`;
    case 'chart':
      return `<div class="chart z12-shag__chertezh">${block.svg}</div>`;
    case 'callout':
      return `<div class="z12-shag__vrezka"><p class="z12-shag__vrezka-zag">${typeset(esc(block.title))}</p>${blokiHtml(block.blocks, typeset)}</div>`;
    case 'details':
      return `<details class="z12-shag__podrobno"><summary>${typeset(esc(block.title))}</summary>${blokiHtml(block.blocks, typeset)}</details>`;
  }
}

function blokiHtml(blocks: PrepBlock[], typeset: Typeset): string {
  return blocks.map((b) => blokHtml(b, typeset)).join('');
}

/** Тон шага по названию: ОДЗ и отбор корней не пропускают (как у №7). */
function tonShaga(title: string): Shag12['ton'] {
  if (/^ОДЗ/.test(title)) return 'odz';
  if (/^Отбор/.test(title)) return 'otbor';
  return undefined;
}

/**
 * Шаги разбора. Нет разбора у движка (линейная функция строит решение
 * одной строкой) — один шаг с этой строкой (rightHint задачи).
 */
export function shagiIz12(
  solution: PrepStep[] | null,
  rightHint: string,
  typeset: Typeset,
): Shag12[] {
  if (solution === null || solution.length === 0) {
    return rightHint === '' ? [] : [{ zagolovokHtml: '', chtoHtml: `<p>${rightHint}</p>` }];
  }
  return solution.map((step) => {
    const ton = tonShaga(step.title);
    return {
      zagolovokHtml: step.titleHtml ?? typeset(step.title),
      chtoHtml: blokiHtml(step.blocks, typeset),
      ...(ton === undefined ? {} : { ton }),
    };
  });
}
