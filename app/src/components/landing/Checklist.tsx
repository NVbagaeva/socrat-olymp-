import { CheckMark } from './CheckIcon';

export interface ChecklistProps {
  items: readonly string[];
}

export function Checklist({ items }: ChecklistProps) {
  return (
    <ul className="checklist">
      {items.map((item) => (
        <li key={item}>
          <CheckMark />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
