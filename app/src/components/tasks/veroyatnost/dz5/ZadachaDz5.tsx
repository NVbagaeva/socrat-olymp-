import { Tex } from '@/components/ui/Tex';
import { tipOpisanie, type Zadacha5 } from '@/lib/veroyatnost/dz5/tipy';

export interface ZadachaDz5Props {
  /** Сквозной номер в ДЗ. */
  nomer: number;
  zadacha: Zadacha5;
}

/**
 * Задача ДЗ на экране учителя: номер, пометка типа, условие по
 * абзацам и диаграмма, если есть. Пометка типа — только для учителя:
 * при печати экрана она прячется (dz5.css), на листы не попадает.
 */
export function ZadachaDz5({ nomer, zadacha }: ZadachaDz5Props) {
  return (
    <li className="dz5-zadacha" data-zadacha={zadacha.id}>
      <span className="dz5-zadacha__no" aria-hidden="true">
        {nomer}
      </span>
      <div className="dz5-zadacha__body">
        <p className="dz5-zadacha__tip">
          <span className="sr-only">Задача {nomer}. </span>
          <span className="dz5-tip" title="Видно только учителю">
            {tipOpisanie(zadacha.tip).metka}
          </span>
          <span className="dz5-zadacha__kod">{zadacha.id}</span>
        </p>
        {zadacha.uslovie.split('\n\n').map((abzats, i) => (
          <p className="dz5-zadacha__text" key={i}>
            <Tex text={abzats} />
          </p>
        ))}
        {zadacha.risunok === null ? null : (
          <div
            className="dz5-zadacha__risunok"
            dangerouslySetInnerHTML={{ __html: zadacha.risunok }}
          />
        )}
      </div>
    </li>
  );
}
