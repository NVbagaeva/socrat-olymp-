import type { ReactNode } from 'react';
import type { TutorMaterial } from '@/content/sections';
import { REPETITORY_SLOVA } from '@/content/veroyatnost-o-zadanii';

export interface Repetitory45Props {
  /** Материалы раздела: заголовок, строка под ним и карточки файлов. */
  tutors: { title: string; lead: string; items: readonly TutorMaterial[] };
}

/** Лист с текстом и лист с подписью PDF: две иконки материалов. */
function sheet(kind: TutorMaterial['icon']): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      {kind === 'pdf' ? (
        <text x="12" y="17">
          PDF
        </text>
      ) : (
        <path d="M9 13h6M9 16h4" />
      )}
    </svg>
  );
}

/**
 * Вкладка «Для репетиторов» заданий №4 и №5 — страница в стиле
 * остальных вкладок: заголовок, строка под ним и карточки материалов
 * для скачивания. Раньше те же карточки лежали в выпадающем меню
 * ленты; карточки и их оформление (.tutor-card, topic.css) те же.
 *
 * Здесь только файлы для ученика: страница открыта всем, кто зашёл на
 * раздел, и ответы из неё скачивались бы заодно. Файлы с ответами
 * собираются отдельно (workflow «PDF 4», «PDF 5»).
 */
export function Repetitory45({ tutors }: Repetitory45Props) {
  return (
    <section className="vrep">
      <header className="vrep__head">
        <h2 className="t-h2 vtab__title">{tutors.title}</h2>
        <p className="vrep__lead">{tutors.lead}</p>
      </header>

      <h3 className="vrep__title">{REPETITORY_SLOVA.materialy}</h3>
      <ul className="vrep__list">
        {tutors.items.map((item) => {
          const inside = (
            <>
              <span className="tutor-card__icon" aria-hidden="true">
                {sheet(item.icon)}
              </span>
              <span className="tutor-card__text">
                <span className="tutor-card__title">{item.title}</span>
                <span className="tutor-card__lead">{item.lead}</span>
              </span>
              <span className="tutor-card__go" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 4v10m0 0l-4-4m4 4l4-4" />
                  <path d="M5 19h14" />
                </svg>
              </span>
            </>
          );
          return (
            <li key={item.id}>
              {item.file === undefined ? (
                <div className="tutor-card tutor-card--soon" aria-disabled="true">
                  {inside}
                </div>
              ) : (
                <a className="tutor-card" href={item.file} download>
                  {inside}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p className="vrep__note">{REPETITORY_SLOVA.otvety}</p>
    </section>
  );
}
