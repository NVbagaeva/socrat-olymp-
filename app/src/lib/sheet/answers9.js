/* sheet/answers9.js — раздел «Ответы» для задания №9.

   У каждой задачи листа учителя разбор по этапам уже стоит в её
   карточке (task.solutionHtml), поэтому здесь — сводная таблица
   «номер — ответ» по группам. Ответ набран формулой: настоящий
   минус и десятичная запятая; в data-answer — точное значение
   с обычным дефисом, по нему автотест сверяет таблицу с движком.
*/

import answers from './answers.js';
import typo from './typography.js';

/** Ответ-число формулой: «-3,5» → минус и запятая как в бланке. */
export function answerHtml(answer) {
  var tex = String(answer).replace(/,/g, '{,}');
  return typo.mathText('$' + tex + '$');
}

/** Строк таблицы ответов в одном куске потока (по 5 ответов в строке). */
const ROWS_PER_PIECE = 18;

export function answersItems(blocks, title, note) {
  const items = [answers.sectionHead(title, note)];
  blocks.forEach((block) => {
    const rows = block.tasks.map((task) => ({
      no: task.no,
      answer: task.answer,
      html: answerHtml(task.answer),
    }));
    /* Таблица группы — кусками по ROWS_PER_PIECE строк: целиком большая
       группа (сотни задач) выше страницы, а кусок потока на две страницы
       не делится. */
    for (let i = 0; i < rows.length; i += ROWS_PER_PIECE * 5) {
      const title = i === 0 ? block.title : block.title + ' (продолжение)';
      items.push(answers.table(title, rows.slice(i, i + ROWS_PER_PIECE * 5), 5));
    }
  });
  return items;
}

const api = { answersItems: answersItems, answerHtml: answerHtml };

export default api;
