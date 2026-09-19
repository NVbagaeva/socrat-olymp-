/* sheet/answers8.js — раздел «Ответы» для задания №8.

   Проще, чем у №12: у каждой задачи уже есть свой разбор прямо
   в карточке (task.solutionHtml, только в файле для учителя),
   поэтому здесь — только сводная таблица «номер — ответ» по
   навыкам, без отдельного раздела кратких решений.
*/

import answers from './answers.js';

export function answersItems(blocks) {
  const items = [answers.sectionHead('Ответы', 'по навыкам, сквозная нумерация')];
  blocks.forEach((block) => {
    items.push(answers.table(
      block.title,
      block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
      5,
    ));
  });
  return items;
}

const api = { answersItems: answersItems };

export default api;
