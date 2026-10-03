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
import block6 from './prep/12/block-6.json';

/* Подтема «Квадратичная функция»: девять навыков, P12Q-1 … P12Q-9. */
import quad1 from './prep/12q/skill-1.json';
import quad2 from './prep/12q/skill-2.json';
import quad3 from './prep/12q/skill-3.json';
import quad4 from './prep/12q/skill-4.json';
import quad5 from './prep/12q/skill-5.json';
import quad6 from './prep/12q/skill-6.json';
import quad7 from './prep/12q/skill-7.json';
import quad8 from './prep/12q/skill-8.json';
import quad9 from './prep/12q/skill-9.json';

/* Подтема «Гипербола»: одиннадцать опорных навыков, P12R-1 … P12R-11. */
import rat1 from './prep/12r/skill-1.json';
import rat2 from './prep/12r/skill-2.json';
import rat3 from './prep/12r/skill-3.json';
import rat4 from './prep/12r/skill-4.json';
import rat5 from './prep/12r/skill-5.json';
import rat6 from './prep/12r/skill-6.json';
import rat7 from './prep/12r/skill-7.json';
import rat8 from './prep/12r/skill-8.json';
import rat9 from './prep/12r/skill-9.json';
import rat10 from './prep/12r/skill-10.json';
import rat11 from './prep/12r/skill-11.json';

import protoA from './prototypes/12/12-A.json';
import protoB from './prototypes/12/12-B.json';
import protoC from './prototypes/12/12-C.json';
import protoD from './prototypes/12/12-D.json';

/* Прототипы квадратичной подтемы: те же девять навыков, но условия
   заданы полосой, а не точкой, и чертёж выбирается по seed. Отсюда
   берут задачи тренажёр и генератор. */
import quadA from './prototypes/12q/12Q-A.json';
import quadB from './prototypes/12q/12Q-B.json';
import quadC from './prototypes/12q/12Q-C.json';
import quadD from './prototypes/12q/12Q-D.json';
import quadE from './prototypes/12q/12Q-E.json';
import quadF from './prototypes/12q/12Q-F.json';
import quadG from './prototypes/12q/12Q-G.json';
import quadH from './prototypes/12q/12Q-H.json';
import quadI from './prototypes/12q/12Q-I.json';

/* Прототипы гиперболы: девять типов заданий и дополнительный набор
   по (kx + a)/(x + b). Собственный материал платформы, как у параболы. */
import ratA from './prototypes/12r/12R-A.json';
import ratB from './prototypes/12r/12R-B.json';
import ratC from './prototypes/12r/12R-C.json';
import ratD from './prototypes/12r/12R-D.json';
import ratE from './prototypes/12r/12R-E.json';
import ratF from './prototypes/12r/12R-F.json';
import ratG from './prototypes/12r/12R-G.json';
import ratH from './prototypes/12r/12R-H.json';
import ratI from './prototypes/12r/12R-I.json';
import ratJ from './prototypes/12r/12R-J.json';

/** Подготовка: собственный материал платформы, в покрытие банка не входит.
    Сначала наборы линейной подтемы, потом квадратичной, потом гиперболы: порядок в этом
    списке задаёт порядок записей в answers.json, и линейные записи от
    появления новой подтемы не сдвигаются. */
export const prep = [
  block1, block2, block3, block4, block5, block6,
  quad1, quad2, quad3, quad4, quad5, quad6, quad7, quad8, quad9,
  rat1, rat2, rat3, rat4, rat5, rat6, rat7, rat8, rat9, rat10, rat11,
];

/** Прототипы: у линейной — банк ФИПИ, у квадратичной — свой материал.
    Покрытием банка считаются только линейные наборы: у квадратичных
    в поле note так и сказано. Порядок тот же, что у подготовки:
    сначала линейная подтема, потом квадратичная. */
export const prototypes = [
  protoA, protoB, protoC, protoD,
  quadA, quadB, quadC, quadD, quadE, quadF, quadG, quadH, quadI,
  ratA, ratB, ratC, ratD, ratE, ratF, ratG, ratH, ratI, ratJ,
];

