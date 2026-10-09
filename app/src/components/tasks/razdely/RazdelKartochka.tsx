import type { ReactNode } from 'react';
import { RazdelIkonka } from './RazdelIkonka';
import type { RazdelKarta } from './types';

export interface RazdelKartochkaProps {
  razdel: RazdelKarta;
  /** Ширина иконки на экране — для выбора файла из srcset. */
  sizes: string;
  /** Метки под подписью: «Сейчас здесь», «тренировка не завершена». */
  metki?: ReactNode;
  /** Правый край: стрелка, галочка или «Скоро». */
  end: ReactNode;
}

/**
 * Содержимое карточки раздела — одно для меню и для блока «Другие
 * разделы». Обёртку (ссылка, кнопка, приглушённый блок) ставит тот,
 * кто карточку показывает.
 */
export function RazdelKartochka({ razdel, sizes, metki, end }: RazdelKartochkaProps) {
  return (
    <>
      <RazdelIkonka icon={razdel.icon} sizes={sizes} className="razdel-karta__ico" />
      <span className="razdel-karta__text">
        <span className="razdel-karta__title">{razdel.title}</span>
        <span
          className="razdel-karta__caption"
          dangerouslySetInnerHTML={{ __html: razdel.captionHtml }}
        />
        {metki === undefined ? null : <span className="razdel-karta__metki">{metki}</span>}
      </span>
      <span className="razdel-karta__end">{end}</span>
    </>
  );
}

/** Стрелка «перейти» в кружке. */
export function StrelkaVpravo() {
  return (
    <span className="razdel-karta__go" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </span>
  );
}

/** Метка «тренировка не завершена». */
export function MetkaTrenirovki() {
  return <span className="razdel-metka razdel-metka--trenirovka">тренировка не завершена</span>;
}
