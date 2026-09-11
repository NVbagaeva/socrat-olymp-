import { clsx } from 'clsx';
import { ProgressBar } from './ProgressBar';

export interface Topic {
  id: string;
  name: string;
  /** Освоенность темы в процентах. */
  value: number;
}

export interface TopicListProps {
  items: Topic[];
  /** Плотный режим для узких карточек. */
  dense?: boolean;
  className?: string;
}

/** Сильные и слабые темы различаются сортировкой, не цветом. */
export function TopicList({ items, dense = false, className }: TopicListProps) {
  return (
    <ul className={className}>
      {items.map((topic) => (
        <li key={topic.id} className={clsx('topic', dense && 'topic--tight')}>
          <div>
            <div className="topic__name">{topic.name}</div>
            <ProgressBar value={topic.value} label={`${topic.name}: освоено`} />
          </div>
          <div className="topic__val">{topic.value}%</div>
        </li>
      ))}
    </ul>
  );
}
