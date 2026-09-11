import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { TrajectoryIcon } from './StateIcons';

export interface StateProps {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Пустой экран — приглашение к действию, а не констатация пустоты. */
export function EmptyState({ title, description, action, icon, className }: StateProps) {
  return (
    <div className={clsx('state', className)}>
      <div className="state__ico">{icon ?? <TrajectoryIcon />}</div>
      <h4>{title}</h4>
      <p>{description}</p>
      {action}
    </div>
  );
}
