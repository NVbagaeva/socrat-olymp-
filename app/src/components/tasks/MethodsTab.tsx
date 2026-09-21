import { EmptyState } from '@/components/ui';
import { METODY } from '@/content/metody';

/**
 * Вкладка «Ключевые методы решения» подтемы задания №12.
 *
 * Появляется у подтемы с признаком methods в конфиге. Заголовок —
 * H2, как у соседних вкладок «Опорные задачи» и «Тренажёр». Карточек
 * методов у подтемы пока нет, поэтому под заголовком стоит честное
 * пустое состояние; карточки по образцу заданий №4 и №5 встанут
 * сюда отдельным этапом.
 */
export function MethodsTab() {
  return (
    <section className="methods">
      <header className="methods__head">
        <h2 className="t-h2 methods__title">{METODY.title}</h2>
      </header>
      <EmptyState title={METODY.gotovitsya.title} description={METODY.gotovitsya.description} />
    </section>
  );
}
