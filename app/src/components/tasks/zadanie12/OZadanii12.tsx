import { EmptyState } from '@/components/ui';
import { SubtopicCard } from '@/components/tasks/SubtopicCard';
import { TitleText } from '@/components/tasks/TitleText';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import { bentoAll, bentoAttrs } from '@/lib/bento';

export interface TipFunkciiView {
  slug: string;
  name: string;
  /** Название графика: «График — парабола». */
  caption?: string;
  icon?: IkonkaRazdela;
  /** Формула, уже свёрстанная KaTeX на сборке. */
  formulaHtml: string;
  status: 'active' | 'soon';
  /** Адрес подтемы. Нет ни у закрытой, ни у той, чьи страницы не собраны. */
  href: string | null;
}

export interface PrototypeView {
  id: string;
  title: string;
  subtitle: string;
  /** Название и подзаголовок, набранные KaTeX на сборке. */
  titleHtml?: string;
  subtitleHtml?: string;
  count: number;
}

export interface OZadanii12Props {
  tipy: TipFunkciiView[];
  prototypes: PrototypeView[];
}

/**
 * Вкладка «О задании» №12: выбор типа функции — плитками, как карта
 * разделов на «О задании» №11, — и список прототипов задания.
 * Тренажёр, генератор и зачётная работа по всем типам — соседние
 * вкладки ленты.
 */
export function OZadanii12({ tipy, prototypes }: OZadanii12Props) {
  const sizes = bentoAll(tipy.length);
  return (
    <div className="z12-about">
      <section aria-labelledby="z12-tipy">
        <h2 className="t-h4 z12-about__title" id="z12-tipy">
          Выберите тип функции
        </h2>
        {/* Bento: карточки разного размера, ряды без дыр (lib/bento.ts). */}
        <ul className="subtopics-grid subtopics-grid--bento">
          {tipy.map((item, i) => (
            <li key={item.slug} {...bentoAttrs(sizes, i)}>
              <SubtopicCard
                name={item.name}
                {...(item.caption === undefined ? {} : { caption: item.caption })}
                icon={item.icon}
                href={item.href}
                soon={item.status === 'soon'}
                formulaHtml={item.formulaHtml}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="z12-prototipy">
        <h2 className="t-h4 z12-about__title" id="z12-prototipy">
          Прототипы
        </h2>
        {prototypes.length === 0 ? (
          <EmptyState
            title="Материал готовится"
            description="Прототипов для этого задания в данных пока нет."
          />
        ) : (
          <ul className="proto-list">
            {prototypes.map((proto) => (
              <li className="proto" key={proto.id}>
                <span className="proto__id">{proto.id}</span>
                <span className="proto__text">
                  <span className="proto__title">
                    <TitleText title={proto.title} html={proto.titleHtml} />
                  </span>
                  <span className="proto__subtitle">
                    <TitleText title={proto.subtitle} html={proto.subtitleHtml} />
                  </span>
                </span>
                {/* Число берётся из состава набора движка, а не задаётся. */}
                <span className="proto__count">{proto.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
