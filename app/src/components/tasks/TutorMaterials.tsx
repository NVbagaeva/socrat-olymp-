import { Badge } from '@/components/ui';
import type { ExamSection } from '@/content/sections';

export interface TutorMaterialsProps {
  section: ExamSection;
}

/**
 * Содержимое вкладки «Для репетиторов».
 *
 * Раньше это была отдельная страница, и вместе с ней исчезали шапка
 * темы и лента вкладок — вернуться было нечем. Теперь это обычная
 * вкладка, как «Теория» и «Подготовительные задачи».
 *
 * Материалы берутся из конфига раздела: сколько там записано, столько
 * и карточек. Своих мы не придумываем.
 */
export function TutorMaterials({ section }: TutorMaterialsProps) {
  const { tutors } = section;

  return (
    <section className="tutors">
      <header className="tutors__head">
        <h2 className="t-h2 tutors__title">{tutors.title}</h2>
        <p className="tutors__lead">{tutors.lead}</p>
      </header>

      <ul className="tutors__grid">
        {tutors.items.map((item) => (
          <li key={item.id}>
            {/* Материала ещё нет: карточка не ссылка и не берёт фокус,
                как закрытая карточка в банке заданий. */}
            <div className="tutors-card" aria-disabled="true">
              <div className="tutors-card__head">
                <h3 className="tutors-card__title">{item.title}</h3>
                <Badge>Готовится</Badge>
              </div>
              <p className="tutors-card__lead">{item.lead}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
