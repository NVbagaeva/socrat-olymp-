/* scripts/lib/quadratic-solution-text.mjs — разбор задачи о параболе
   и его перевод в простой текст.

   Один модуль на две надобности: по нему проверка (test:graph-quadratic,
   validate:graph) убеждается, что в шагах нет оборванных формул, и по
   нему же собираются тексты разборов для отчётов. Второго перевода
   разметки в текст в проекте нет намеренно: именно он однажды съел
   «< 0$» — знак «меньше» снимался с экранирования раньше, чем
   удалялись теги, и кусок «< 0$</b>» уходил как начало тега.

   Порядок здесь обратный и единственно верный: сначала формулы
   вынимаются в метки, потом снимаются теги, и только потом
   раскрывается экранирование.
*/

import Q from '../../src/lib/graph/families/quadratic.js';
import Solution from '../../src/lib/graph/solution-quadratic.js';

/** Обратная замена к экранированию движка. */
function unescape(value) {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

const MATH = /<span class="math" data-tex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g;

/** Блок разбора в простой текст: формулы остаются записью TeX. */
export function blockText(block) {
  if (block.type === 'formula') {
    return `$$ ${block.tex} $$`;
  }
  if (block.type === 'details' || block.type === 'callout') {
    const inner = (block.blocks ?? []).map(blockText).join('\n');
    return `[${block.title}]\n${inner}`;
  }
  const formulas = [];
  /* Формула заменяется меткой: её TeX может содержать «<» и «>»,
     и под удаление тегов он попадать не должен. */
  const tagged = String(block.html ?? '').replace(MATH, (_match, tex) => {
    formulas.push(unescape(tex));
    return `\u0000${formulas.length - 1}\u0000`;
  });
  const stripped = tagged.replace(/<[^>]*>/g, '');
  return unescape(stripped).replace(/\u0000(\d+)\u0000/g, (_m, index) => `$${formulas[Number(index)]}$`);
}

/** Шаг целиком: строки блоков одна под другой. */
export function stepText(step) {
  return step.blocks.map(blockText).join('\n');
}

/** Вторая кривая сцены в том виде, в каком её ждёт разбор. */
function secondOf(meta) {
  const curve = meta.curves?.[1];
  if (!curve) {
    return null;
  }
  if (curve.kind === 'line') {
    return { kind: 'line', line: { k: curve.kFraction, b: curve.bFraction } };
  }
  return { kind: 'quadratic', curve: Q.exact(curve.aFraction, curve.bFraction, curve.cFraction) };
}

/**
 * Разбор собранной задачи.
 *
 * task — то, что вернул генератор; source — её запись в данных
 * набора: оттуда правило ответа и признак «a дан в условии».
 */
export function buildSolution(task, source) {
  const meta = task.meta;
  const curve = Q.exact(meta.aFraction, meta.bFraction, meta.cFraction);
  return Solution.build({
    curve,
    window: meta.window,
    points: meta.points,
    second: secondOf(meta),
    task: {
      rule: source?.answerRule,
      answer: task.answer,
      knownA: source?.knownA === true,
      query: meta.query,
      intersection: meta.intersection,
    },
  });
}
