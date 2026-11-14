import { AppShell } from '@/components/layout/AppShell';

/**
 * Заготовки страниц вида функции №12 «Интерактивная тетрадь» и «Работа
 * над ошибками» — как они стояли на /zadaniya/12/<вид>/tetrad/ и
 * …/oshibki/ (страница с одним заголовком). Содержания у них ещё нет,
 * поэтому с этих адресов теперь переадресация на тренажёр вида
 * (решение владельца, docs/redesign-plan.md, п. 7); сам код оставлен,
 * чтобы вернуть страницы, когда материал появится.
 */
export function TetradVida() {
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <h1 className="t-h1">Интерактивная тетрадь</h1>
      </main>
    </AppShell>
  );
}

export function OshibkiVida() {
  return (
    <AppShell active="tasks">
      <main className="app-main">
        <h1 className="t-h1">Работа над ошибками</h1>
      </main>
    </AppShell>
  );
}
