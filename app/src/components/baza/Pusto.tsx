import Link from 'next/link';
import { BAZA_TEXT } from '@/content/baza/razdely';
import { bankPageOf } from '@/content/tasks';

/**
 * Вкладка без наполнения: честное «Материал готовится», а не пустой
 * экран. Разметка — карточка заглушки раздела (.task-stub).
 */
export function Pusto({ vkladka }: { vkladka: string }) {
  const { pusto } = BAZA_TEXT;
  return (
    <section className="task-stub task-stub--text" aria-label={vkladka}>
      <div className="task-stub__text">
        <h2 className="t-h4">
          {vkladka}: {pusto.title.toLowerCase()}
        </h2>
        <p className="task-stub__lead">{pusto.text}</p>
        <Link className="btn btn--primary task-stub__cta" href={bankPageOf('base').href}>
          {pusto.action}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
