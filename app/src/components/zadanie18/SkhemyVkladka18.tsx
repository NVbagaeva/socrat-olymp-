import { Kartochki18 } from './Kartochki18';
import { SpisokSkhem18 } from './SpisokSkhem18';
import { Vvodnaya18 } from './Vvodnaya18';

/**
 * Вкладка «Ключевые схемы»: вводная плашка с прогрессом, список схем
 * с фильтрами и карточки на запоминание.
 */
export function SkhemyVkladka18() {
  return (
    <div className="z18-vkladka">
      <Vvodnaya18 />
      <SpisokSkhem18 />
      <Kartochki18 />
    </div>
  );
}
