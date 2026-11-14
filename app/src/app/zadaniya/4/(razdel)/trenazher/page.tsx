import type { Metadata } from 'next';
import { Trenazher45Tab } from '@/components/tasks/veroyatnost/trening/Trenazher45Tab';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'trenazher')),
};

/**
 * Вкладка «Тренажёр» задания №4 в «Стеклянной сцене»: четыре режима
 * карточками (вперемешку, выбрать методы, работа над ошибками, «Узнай
 * метод»), выбор тем строками методов, экран задачи, итоги.
 *
 * Банк собирается на сборке: условия, отпечатки ответов и картинки
 * уезжают со страницей, закрытые разборы и подсказки лежат файлами по
 * прототипам (dannye/razbory/) и грузятся только для задач тренировки.
 */
export default function Trenazher4Tab() {
  return <Trenazher45Tab zadanie={4} />;
}
