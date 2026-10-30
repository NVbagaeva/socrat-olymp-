import Link from 'next/link';
import { TaskGrid } from '@/components/tasks';
import { PovEntry } from '@/components/povyshennye/PovEntry';
import { VariantEntry } from '@/components/variant/VariantEntry';
import { landing } from '@/content/landing';
import { tasksOfPart, tasksPage } from '@/content/tasks';

const { bank } = landing;

/**
 * Банк заданий на главной.
 *
 * Те же карточки и тот же конфиг, что на странице банка: второго списка
 * заданий в проекте нет. Отличий от страницы два — здесь нет поиска,
 * а под сеткой стоит переход в сам раздел.
 */
export function BankSection() {
  return (
    <section className="band" id="bank">
      {/* Свечения позади стеклянных карточек: без цвета за стеклом
          размывать нечего. */}
      <div className="aura" aria-hidden="true">
        <span className="aura__spot aura__spot--blue" />
        <span className="aura__spot aura__spot--orange" />
      </div>
      <div className="wrap">
        <div className="band__head">
          <h2>{bank.title}</h2>
          <p>{bank.lead}</p>
        </div>

        {/* На главной — первая часть, как и раньше; вторая часть
            и переключатель живут на странице банка. */}
        <VariantEntry className="bank-variant" />
        <PovEntry className="bank-variant" />
        <TaskGrid tasks={tasksOfPart(1)} />

        <p className="bank-note">{bank.note}</p>

        <Link className="btn btn--primary bank-more" href={tasksPage.href}>
          Открыть банк заданий
        </Link>
      </div>
    </section>
  );
}
