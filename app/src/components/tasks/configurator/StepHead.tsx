import type { ReactNode } from 'react';

export interface StepHeadProps {
  id: string;
  no: string;
  title: ReactNode;
  lead: ReactNode;
}

/** Шапка шага: номер в кружке, заголовок, подзаголовок. */
export function StepHead({ id, no, title, lead }: StepHeadProps) {
  return (
    <header className="cfg-step__head">
      <span className="cfg-step__no" aria-hidden="true">
        {no}
      </span>
      <div className="cfg-step__text">
        <h3 className="cfg-step__title" id={id}>
          {title}
        </h3>
        <p className="cfg-step__lead">{lead}</p>
      </div>
    </header>
  );
}
