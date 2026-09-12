/* data/index.js — наборы задач.

   Импортируются статически: сборщик кладёт их в бандл, страница
   ничего не догружает по сети. Список файлов явный — оглавления
   папки в бандле нет, а перечислять всё по одному честнее, чем
   собирать пути на лету.

   Ответы (answers.json) здесь намеренно не импортируются: им место
   на сервере, а не в клиентском бандле.
*/

import block1 from './prep/12/block-1.json';
import block2 from './prep/12/block-2.json';
import block3 from './prep/12/block-3.json';
import block4 from './prep/12/block-4.json';
import block5 from './prep/12/block-5.json';

import protoA from './prototypes/12/12-A.json';
import protoB from './prototypes/12/12-B.json';
import protoC from './prototypes/12/12-C.json';
import protoD from './prototypes/12/12-D.json';

/** Подготовка: собственный материал платформы, в покрытие банка не входит. */
export const prep = [block1, block2, block3, block4, block5];

/** Прототипы ФИПИ: только это число считается покрытием банка. */
export const prototypes = [protoA, protoB, protoC, protoD];

export default { prep, prototypes };
