import { Metric, MetricRow, Sidebar, Topbar, type NavItem } from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

const MAIN: NavItem[] = [
  { id: 'home', label: 'Главная', href: '#shell', active: true },
  { id: 'tasks', label: 'Задания', href: '#shell' },
  { id: 'homework', label: 'Домашние работы', href: '#shell' },
  { id: 'progress', label: 'Прогресс', href: '#shell' },
  { id: 'stats', label: 'Статистика', href: '#shell' },
  { id: 'materials', label: 'Материалы', href: '#shell' },
  { id: 'teacher', label: 'Учитель', href: '#shell' },
];

const SECONDARY: NavItem[] = [
  { id: 'notifications', label: 'Уведомления', href: '#shell' },
  { id: 'settings', label: 'Настройки', href: '#shell' },
];

const USER = { initials: 'АС', name: 'Алексей С.' };

export function ShellSection() {
  return (
    <section id="shell">
      <SectionHeader
        title="Оболочка приложения"
        index="09"
        description="Одна оболочка на три роли. Меняется только состав пунктов меню, не структура."
      />
      <div className="shell shell--responsive">
        <Sidebar brand="Будет на ЕГЭ" items={MAIN} secondaryItems={SECONDARY} user={USER} />
        <div>
          <Topbar user={USER} />
          <div className="shell-body">
            <p className="t-caption muted">Добрый день, Алексей</p>
            <h3 className="t-h4">До цели осталось 6 баллов</h3>
            <MetricRow columns={3}>
              <Metric value="87%" label="Мой прогресс" size="compact" />
              <Metric value="84" label="Средний результат" size="compact" />
              <Metric value="327" label="Решено заданий" size="compact" />
            </MetricRow>
          </div>
        </div>
      </div>
      <p className="spec">
        Сайдбар 240px → 72px на планшете → нижняя навигация на мобильном. Верхняя панель 64px.
      </p>
    </section>
  );
}
