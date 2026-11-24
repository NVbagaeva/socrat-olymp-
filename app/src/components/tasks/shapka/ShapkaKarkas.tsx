import type { ReactNode } from 'react';

export interface ShapkaKarkasProps {
  /** Заголовок страницы (h1). */
  title: ReactNode;
  /** Короткий заголовок для телефона; null — тот же, что полный. */
  korotko?: ReactNode | null;
  /** Под заголовком: чипы, описание, кнопки. */
  children: ReactNode;
  /** Справа (на телефоне — по месту, заданному модификатором): картинка или сцена. */
  media: ReactNode;
  /** Код раздела банка — для data-razdel (стили и проверки). */
  razdel?: string;
  /** Свой модификатор вёрстки: «shapka--ustnyy». */
  className?: string;
}

/**
 * Каркас шапки — одна вёрстка на разделы банка (SectionHeader) и
 * раздел «Устный счёт»: стеклянная карточка, слева заголовок и текст,
 * справа стеклянная картинка. Что внутри — решает страница; размеры,
 * отступы и стекло — общие (shapka.css).
 */
export function ShapkaKarkas({
  title,
  korotko = null,
  children,
  media,
  razdel,
  className,
}: ShapkaKarkasProps) {
  return (
    <header
      className={className === undefined ? 'shapka' : `shapka ${className}`}
      data-razdel={razdel}
    >
      {/* На телефоне — короткое название, как в меню: полное в узкой
          колонке ломается на четыре строки. */}
      <h1
        className={
          korotko === null ? 't-h1 shapka__title' : 't-h1 shapka__title shapka__title--est-korotko'
        }
      >
        <span className="shapka__title-polno">{title}</span>
        {korotko === null ? null : <span className="shapka__title-korotko">{korotko}</span>}
      </h1>
      <div className="shapka__text">{children}</div>
      <div className="shapka__media" data-ill="header">
        {media}
      </div>
    </header>
  );
}
