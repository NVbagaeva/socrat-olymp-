import { clsx } from 'clsx';
import {
  SHKALA_ISTOCHNIK,
  SHKALA_TEXT as T,
  TESTOVYJ_RABOTY,
} from '@/content/variantOnline/shkala';
import './shkala-testovaya.css';

/**
 * Шкала перевода первичных баллов профиля в тестовые — как таблица
 * «балл → отметка» в варианте базы. Числа — из content/variantOnline/shkala.ts
 * (вся работа, обе части), там же источник и пометка о предварительности.
 */
export function ShkalaTestovaya({ className, id }: { className?: string; id: string }) {
  return (
    <section className={clsx('shkala-t', className)} aria-labelledby={id}>
      <h2 id={id} className="shkala-t__title">
        {T.title}
      </h2>
      <p className="shkala-t__legenda" aria-hidden="true">
        <span className="shkala-t__p">{T.pervichnyy}</span>
        <span>→</span>
        <span className="shkala-t__t">{T.testovyj}</span>
      </p>
      <table className="shkala-t__tablitsa">
        <thead className="shkala-t__skryto">
          <tr>
            <th scope="col">{T.pervichnyy}</th>
            <th scope="col">{T.testovyj}</th>
          </tr>
        </thead>
        <tbody>
          {TESTOVYJ_RABOTY.map((test, ball) => (
            <tr key={ball}>
              <td>{ball}</td>
              <td>{test}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="shkala-t__note">{T.note(SHKALA_ISTOCHNIK)}</p>
    </section>
  );
}
