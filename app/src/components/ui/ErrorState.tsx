import { clsx } from 'clsx';
import { AlertIcon } from './StateIcons';
import type { StateProps } from './EmptyState';

/** Ошибка объясняет, что делать, и не извиняется. */
export function ErrorState({ title, description, action, icon, className }: StateProps) {
  return (
    <div className={clsx('state', className)} role="alert">
      <div className="state__ico state__ico--err">{icon ?? <AlertIcon />}</div>
      <h4>{title}</h4>
      <p>{description}</p>
      {action}
    </div>
  );
}
