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

export function answersItems(blocks, title, note) {
  const items = [answers.sectionHead(title, note)];
  blocks.forEach((block) => {
    items.push(
      answers.table(
        block.title,
        block.tasks.map((task) => ({
          no: task.no,
          answer: task.answer,
          html: answerHtml(task.answer),
        })),
        5,
      ),
    );
  });
  return items;
}

const api = { answersItems: answersItems, answerHtml: answerHtml };

export default api;
