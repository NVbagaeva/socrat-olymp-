import { SpisokSkhem18 } from './SpisokSkhem18';
import { Vvodnaya18 } from './Vvodnaya18';

/**
 * Вкладка «Ключевые схемы»: вводная плашка с прогрессом и запуском
 * карточек (общая вкладка «Карточки») и список схем с фильтрами.
 */
export function SkhemyVkladka18() {
  return (
    <div className="z18-vkladka">
      <Vvodnaya18 />
      <SpisokSkhem18 />
    </div>
  );
}
