import {
  Button,
  HomeworkCard,
  Metric,
  MetricRow,
  RecommendationCard,
  TaskCard,
} from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

export function CardsSection() {
  return (
    <section id="cards">
      <SectionHeader
        title="Карточки"
        index="07"
        description="Строка метрик — это один блок с разделителями, а не четыре плитки. Рекомендация без причины запрещена."
      />

      <div className="block">
        <h3>MetricRow</h3>
        <MetricRow>
          <Metric value="87%" label="Мой прогресс" delta="1% за неделю" direction="up" />
          <Metric value="84" label="Средний результат" delta="из 100" />
          <Metric value="327" label="Решено заданий" delta="24 за неделю" direction="up" />
          <Metric value="90+" label="До цели" delta="6 баллов · 173 дня" />
        </MetricRow>
      </div>

      <div className="g2 block grid">
        <div>
          <h3>TaskCard</h3>
          <div className="stack">
            <TaskCard
              number="17"
              title="Параметры"
              difficulty="Сложное"
              difficultyTone="warning"
              status="Не решено"
            />
            <TaskCard
              number="13"
              title="Тригонометрические уравнения"
              difficulty="Среднее"
              difficultyTone="info"
              status="Решено · 4:12"
              statusTone="solved"
            />
            <TaskCard
              number="09"
              title="Производная"
              difficulty="Базовое"
              status="Ошибка · 2 попытки"
              statusTone="failed"
            />
          </div>
        </div>

        <div>
          <h3>HomeworkCard</h3>
          <div className="stack">
            <HomeworkCard
              title="№3 · Параметры"
              due="До 8 сентября, 14:00"
              priority="Срочно"
              priorityTone="error"
              done={2}
              total={6}
            />
            <HomeworkCard
              title="№4 · Текстовая задача"
              due="До 9 сентября, 18:00"
              priority="Высокий"
              done={1}
              total={8}
            />
          </div>
        </div>
      </div>

      <div className="block">
        <h3>RecommendationCard</h3>
        <RecommendationCard
          className="max-w-[560px]"
          action={
            <Button variant="ghost" size="sm">
              Весь план
            </Button>
          }
          items={[
            {
              id: 'params',
              title: 'Решить 5 заданий по параметрам',
              why: '3 ошибки за неделю · тема просела с 71% до 64%',
              primary: true,
              action: <Button size="sm">Задания</Button>,
            },
            {
              id: 'text',
              title: 'Повторить текстовые задачи',
              why: 'Не встречались 24 дня',
              action: (
                <Button variant="secondary" size="sm">
                  Перейти
                </Button>
              ),
            },
            {
              id: 'check',
              title: 'Пройти контрольный срез',
              why: 'Контрольная точка траектории · 8 заданий, 20 минут',
              action: (
                <Button variant="secondary" size="sm">
                  Начать
                </Button>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}
