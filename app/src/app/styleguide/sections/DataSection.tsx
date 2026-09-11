import {
  Avatar,
  BarChart,
  Badge,
  Card,
  Heatmap,
  ProgressRing,
  Table,
  TopicList,
  TrajectoryChart,
  type HeatLevel,
  type TableColumn,
} from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

const TOPICS = [
  { id: 'derivative', name: 'Производная', value: 94 },
  { id: 'stereo', name: 'Стереометрия', value: 91 },
  { id: 'plani', name: 'Планиметрия', value: 72 },
  { id: 'params', name: 'Параметры', value: 64 },
  { id: 'text', name: 'Текстовые задачи', value: 58 },
];

const BARS = [
  { label: '0–39', value: 22 },
  { label: '40–59', value: 38 },
  { label: '60–79', value: 74, highlight: true },
  { label: '80–89', value: 58 },
  { label: '90+', value: 30 },
];

const HEAT_TOPICS = [
  'Алгебра',
  'Параметры',
  'Планиметрия',
  'Стереометрия',
  'Производная',
  'Вероятность',
  'Текстовые',
];

const HEAT_LEVELS: HeatLevel[][] = [
  [5, 4, 4, 3, 2, 2, 1, 1, 2, 1],
  [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
  [3, 3, 4, 4, 4, 3, 3, 2, 2, 2],
  [4, 5, 5, 4, 4, 3, 3, 3, 2, 2],
  [5, 5, 4, 4, 3, 3, 2, 2, 1, 1],
  [2, 2, 3, 3, 3, 4, 4, 4, 5, 4],
  [1, 2, 2, 3, 3, 3, 4, 4, 4, 5],
];

const MONTHS = [
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
];

interface Student {
  id: string;
  initials: string;
  name: string;
  score: number;
  trend: number;
  status: { label: string; tone: 'success' | 'info' | 'warning' | 'error' };
}

const STUDENTS: Student[] = [
  {
    id: 'ab',
    initials: 'АБ',
    name: 'Анна Б.',
    score: 92,
    trend: 3,
    status: { label: 'Отлично', tone: 'success' },
  },
  {
    id: 'pk',
    initials: 'ПК',
    name: 'Пётр К.',
    score: 71,
    trend: 4,
    status: { label: 'Хорошо', tone: 'info' },
  },
  {
    id: 'im',
    initials: 'ИМ',
    name: 'Илья М.',
    score: 65,
    trend: 0,
    status: { label: 'Требует внимания', tone: 'warning' },
  },
  {
    id: 'gt',
    initials: 'ГТ',
    name: 'Глеб Т.',
    score: 55,
    trend: -2,
    status: { label: 'Риск', tone: 'error' },
  },
];

const COLUMNS: TableColumn<Student>[] = [
  {
    key: 'name',
    header: 'Ученик',
    render: (row) => (
      <span className="table__person">
        <Avatar initials={row.initials} size="xs" />
        {row.name}
      </span>
    ),
  },
  { key: 'score', header: 'Результат', align: 'right', render: (row) => row.score },
  {
    key: 'trend',
    header: 'Динамика',
    align: 'right',
    trend: (row) => (row.trend > 0 ? 'up' : row.trend < 0 ? 'down' : 'flat'),
    render: (row) =>
      row.trend > 0 ? `+${row.trend}` : row.trend < 0 ? `−${Math.abs(row.trend)}` : '0',
  },
  {
    key: 'status',
    header: 'Статус',
    render: (row) => <Badge tone={row.status.tone}>{row.status.label}</Badge>,
  },
];

export function DataSection() {
  return (
    <section id="data">
      <SectionHeader
        title="Визуализация данных"
        index="08"
        description="Траектория — фирменный компонент. Прогресс всегда в синей шкале, даже когда показатель низкий: красный прогресс-бар превращает обучение в наказание."
      />

      <div className="block">
        <h3>TrajectoryChart</h3>
        <Card title="Твой путь к 90+" action={<Badge tone="info">По плану</Badge>}>
          <TrajectoryChart />
          <p className="spec">
            Состояния: построена · строится (прочерчивание 900 мс, один раз) · нет данных.
          </p>
        </Card>
      </div>

      <div className="g3 block grid">
        <Card title="ProgressRing">
          <div className="ring-box">
            <ProgressRing value={87} label="Мой прогресс" srLabel="Мой прогресс: 87 процентов" />
          </div>
          <p className="spec">Один показатель на экран.</p>
        </Card>

        <Card title="TopicList">
          <TopicList items={TOPICS} />
          <p className="spec">Сильные и слабые различаются сортировкой, не цветом.</p>
        </Card>

        <Card title="BarChart">
          <BarChart bars={BARS} caption="Распределение баллов класса по интервалам" />
          <p className="spec">Распределение баллов класса. Выделен только модальный интервал.</p>
        </Card>
      </div>

      <div className="g2 block grid">
        <Card title="Heatmap · темы × месяцы">
          <Heatmap
            rows={HEAT_TOPICS.map((label, index) => ({
              label,
              levels: HEAT_LEVELS[index] ?? [],
            }))}
            columnLabels={MONTHS}
            caption="Активность по темам и месяцам, пять ступеней"
          />
        </Card>

        <Card title="Table · ученики">
          <Table
            columns={COLUMNS}
            rows={STUDENTS}
            getRowKey={(row) => row.id}
            caption="Результаты учеников класса"
          />
          <p className="spec">
            Только горизонтальные разделители, числа вправо, заголовки обычным регистром.
          </p>
        </Card>
      </div>
    </section>
  );
}
