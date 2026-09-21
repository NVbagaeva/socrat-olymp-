import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Badge, Breadcrumbs } from '@/components/ui';
import type { Crumb } from '@/components/ui';

export interface ShapkaRazdelaProps {
  /** Крошки над заголовком. Последняя — без ссылки, это сама страница. */
  crumbs: Crumb[];
  title: ReactNode;
  /** Уровень задания. Не задан — бейджа нет: у страниц фигур №3 его нет. */
  badge?: ReactNode;
  lead?: ReactNode;
  /**
   * Правая колонка: иллюстрация раздела, чертёж фигуры, график.
   * Не задана — шапка одноколоночная и текст занимает всю ширину,
   * а не половину.
   */
  media?: ReactNode;
  /** Под подзаголовком: кнопка «Продолжить подготовку» у №12. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Шапка раздела — одна на все задания.
 *
 * Раньше её разметку повторяли шесть мест: №4 и №5, №8, страницы фигур
 * №3, оглавление №3, общий тренажёр №3 и оглавление №12. Они разъезжались
 * при каждой правке — например, просветы по макету пришлось бы менять
 * в каждом. Теперь разметка одна, а разделы отличаются тем, что кладут
 * в слоты.
 *
 * Крошки входят в шапку: во всех шести местах они стояли прямо над ней
 * и всегда вместе с ней.
 */
export function ShapkaRazdela({
  crumbs,
  title,
  badge,
  lead,
  media,
  actions,
  className,
}: ShapkaRazdelaProps) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <header
        className={clsx('section-head', media === undefined && 'section-head--text', className)}
      >
        <div className="section-head__text">
          <div className="section-head__title">
            <h1 className="t-h1">{title}</h1>
            {badge === undefined ? null : <Badge tone="info">{badge}</Badge>}
          </div>
          {lead === undefined ? null : <p className="section-head__lead">{lead}</p>}
          {actions}
        </div>
        {media === undefined ? null : <div className="section-head__media">{media}</div>}
      </header>
    </>
  );
}
