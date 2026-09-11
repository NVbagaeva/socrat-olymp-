import { clsx } from 'clsx';
import { CheckIcon } from './StateIcons';
import type { StateProps } from './EmptyState';

export function SuccessState({ title, description, action, icon, className }: StateProps) {
  return (
    <div className={clsx('state', className)} role="status">
      <div className="state__ico state__ico--ok">{icon ?? <CheckIcon />}</div>
      <h4>{title}</h4>
      <p>{description}</p>
      {action}
    </div>
  );
}
