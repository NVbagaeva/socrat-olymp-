import Link from 'next/link';
import { TaskGrid } from '@/components/tasks';
import { PovEntry } from '@/components/povyshennye/PovEntry';
import { VariantEntry } from '@/components/variant/VariantEntry';
import { LevelTabs } from '@/components/level/LevelTabs';
import { landingOf } from '@/content/landing';
import { shortTasksOf } from '@/content/tasks';
import { levelInfo, type Level } from '@/lib/level';


/**
 * Банк заданий на главной.
 *
 * Те же карточки и тот же конфиг, что на странице банка: второго списка
 * заданий в проекте нет. Отличий от страницы два — здесь нет поиска,
 * а под сеткой стоит переход в сам раздел.
 */
export function BankSection({ level = 'profile' }: { level?: Level }) {
  const { bank } = landingOf(level);
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
        {level === 'profile' ? (
          <>
            <VariantEntry className="bank-variant" />
            <PovEntry className="bank-variant" />
          </>
        ) : null}
        {/* Вариант базы — на главной обоих уровней. */}
        <VariantEntry className="bank-variant" level="base" />
        {/* Над списком заданий — вкладки уровня с номерами. */}
        <LevelTabs level={level} to="home-bank" range />
        <TaskGrid tasks={shortTasksOf(level)} />

        <p className="bank-note">{bank.note}</p>

        <Link className="btn btn--primary bank-more" href={levelInfo(level).bank}>
          Открыть банк заданий
        </Link>
      </div>
    </section>
  );
}
