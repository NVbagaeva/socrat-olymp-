import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { RazdelTabs } from '@/components/tasks/RazdelTabs';
import { ProgressGlavy } from '@/components/sbornik/Progress';
import { GLAVA_TABS, TIPY, glavaPoNomeru } from '@/content/sbornik';
import { href, SBORNIK } from '@/lib/paths';
import { zadachiGlavy } from '@/lib/sbornik/bank';
import { nomerGlavy, staticGlavy } from '@/lib/sbornik/marshrut';
import 'katex/dist/katex.min.css';
import '@/app/zadaniya/zadaniya.css';
import '@/app/zadaniya/[task]/section.css';
import '@/app/zadaniya/[task]/[type]/topic.css';
import '@/components/sbornik/sbornik.css';

export const dynamicParams = false;

export function generateStaticParams(): { glava: string }[] {
  return staticGlavy();
}

/**
 * Оболочка главы: шапка «Стеклянная сцена», вкладки
 * Теория · Задачи по типам · Тренажёр · Генератор.
 */
export default async function GlavaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ glava: string }>;
}) {
  const { glava: slug } = await params;
  const n = nomerGlavy(slug);
  const g = glavaPoNomeru(n)!;
  const vsego = zadachiGlavy(n).length;
  const tipov = (TIPY[n] ?? []).length;
  return (
    <AppShell active="sbornik">
      <main className="app-main">
        <StsenaShapka
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Сборник для вузов', href: href(SBORNIK) },
            { label: `Глава ${n}` },
          ]}
          title={`Глава ${n}. ${g.nazvanie}`}
          lead="Задачи трёх уровней: автопроверка, подсказки-вопросы и решение по шагам."
          tabletki={tabletkiRazdela({
            fakty: [
              { znachenie: String(vsego), podpis: 'задач' },
              { znachenie: String(tipov), podpis: 'типов' },
              { znachenie: '★–★★★', podpis: 'уровни' },
            ],
          })}
          progress={<ProgressGlavy glava={n} iz={vsego} />}
          media={<RisunokRazdela label={`Глава ${n}: ${g.nazvanie}`} />}
        />
        <RazdelTabs
          base={`${SBORNIK}/${slug}`}
          tabs={GLAVA_TABS}
          className="topic-tabs-row--stsena"
        />
        <div className="section-panel">{children}</div>
      </main>
    </AppShell>
  );
}
