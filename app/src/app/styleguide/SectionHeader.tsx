import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: string;
  /** Порядковый номер раздела: 01, 02, … */
  index: string;
  description: ReactNode;
}

export function SectionHeader({ title, index, description }: SectionHeaderProps) {
  return (
    <>
      <div className="sec-h">
        <h2 className="t-h3">{title}</h2>
        <span>{index}</span>
      </div>
      <p className="sec-d">{description}</p>
    </>
  );
}
