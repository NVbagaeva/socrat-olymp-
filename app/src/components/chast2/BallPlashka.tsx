import { ballText } from '@/content/variantOnline/bally';
import './chast2.css';

/** Плашка «2 балла» у номера задания: экран, онлайн и лист — одна и та же. */
export function BallPlashka({ n }: { n: number }) {
  return (
    <span className="ball-plashka" data-testid="ball-plashka">
      {ballText(n)}
    </span>
  );
}
