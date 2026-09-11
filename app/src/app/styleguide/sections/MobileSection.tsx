import {
  Badge,
  BottomNavigation,
  Button,
  Card,
  FieldLabel,
  Input,
  Metric,
  MetricRow,
  ProgressBar,
  Sparkline,
  TopicList,
  type NavItem,
} from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

const nav = (activeId: string): NavItem[] =>
  [
    { id: 'home', label: 'Главная', href: '#mobile' },
    { id: 'tasks', label: 'Задания', href: '#mobile' },
    { id: 'progress', label: 'Прогресс', href: '#mobile' },
    { id: 'profile', label: 'Профиль', href: '#mobile' },
  ].map((item) => ({ ...item, active: item.id === activeId }));

export function MobileSection() {
  return (
    <section id="mobile">
      <SectionHeader
        title="Мобильная оболочка"
        index="11"
        description="Не уменьшенный десктоп: метрики 2×2, нижняя навигация из четырёх пунктов, домашние работы карточкой на главной. На экране решения задания нижняя навигация скрывается."
      />
      <div className="row row--wide">
        <div className="phone">
          <div className="phone__head">
            <span className="phone__name">Будет на ЕГЭ</span>
            <span className="bell bell--sm">
              <span className="bell__ico" aria-hidden="true" />
            </span>
          </div>
          <div className="phone__body">
            <p className="t-caption muted">Добрый день, Алексей</p>
            <p className="phone__greeting">До цели 6 баллов</p>
            <MetricRow columns={2}>
              <Metric value="87%" label="Прогресс" size="tight" />
              <Metric value="84" label="Средний" size="tight" />
              <Metric value="327" label="Решено" size="tight" />
              <Metric value="90+" label="Цель" size="tight" />
            </MetricRow>
            <Card className="card--tight">
              <p className="t-label muted mb-1.5">Что делать дальше</p>
              <p className="mb-1 text-[14px] font-medium">5 заданий по параметрам</p>
              <p className="t-caption dim mb-3">3 ошибки за неделю</p>
              <Button size="sm" fullWidth>
                Начать
              </Button>
            </Card>
          </div>
          <BottomNavigation items={nav('home')} label="Навигация: главная" />
        </div>

        <div className="phone">
          <div className="phone__head phone__head--even">
            <span className="phone__name">№17 · Параметры</span>
            <Badge className="h-5 text-[11px]">12:34</Badge>
          </div>
          <div className="phone__body">
            <ProgressBar value={60} label="Пройдено заданий" className="mb-4" />
            <p className="phone__task">
              Найдите все значения параметра <i>a</i>, при которых уравнение <i>x</i>² + 2<i>ax</i>{' '}
              + <i>a</i>² − 4 = 0 имеет ровно один корень.
            </p>
            <div className="field phone__field">
              <FieldLabel htmlFor="sg-phone-answer">Ответ</FieldLabel>
              <Input id="sg-phone-answer" placeholder="Введите ответ" />
            </div>
            <Button fullWidth>Проверить ответ</Button>
            <Button variant="ghost" size="sm" fullWidth className="phone__hint">
              Подсказка
            </Button>
          </div>
        </div>

        <div className="phone">
          <div className="phone__head phone__head--even phone__head--plain">
            <span className="phone__name">Прогресс</span>
          </div>
          <div className="phone__body">
            <Card className="mb-3">
              <p className="t-label muted">Средний результат</p>
              <p className="t-data-lg phone__spark">84</p>
              <Sparkline caption="Средний результат растёт с 72 до 84" />
            </Card>
            <Card>
              <p className="t-label muted mb-2.5">Слабые темы</p>
              <TopicList
                dense
                items={[
                  { id: 'params', name: 'Параметры', value: 64 },
                  { id: 'text', name: 'Текстовые задачи', value: 58 },
                ]}
              />
            </Card>
          </div>
          <BottomNavigation items={nav('progress')} label="Навигация: прогресс" />
        </div>
      </div>
    </section>
  );
}
