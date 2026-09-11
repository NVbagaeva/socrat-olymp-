import { Button, Card } from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

export function ButtonsSection() {
  return (
    <section id="buttons">
      <SectionHeader
        title="Кнопки"
        index="04"
        description="На экране одна primary. Текст — глагол действия, и он не меняется между экраном и результатом."
      />
      <Card className="block">
        <div className="row mb-5">
          <Button variant="primary">Начать бесплатно</Button>
          <Button variant="secondary">Узнать больше</Button>
          <Button variant="ghost">Пропустить</Button>
          <Button variant="danger">Удалить класс</Button>
        </div>
        <div className="row mb-5">
          <Button size="lg">Проверить ответ</Button>
          <Button>Назначить</Button>
          <Button size="sm">Перейти</Button>
        </div>
        <div className="row">
          <Button loading>Проверяем</Button>
          <Button variant="secondary" loading>
            Загрузка
          </Button>
          <Button disabled>Недоступно</Button>
        </div>
        <p className="spec">
          default · hover · focus-visible · active · disabled · loading. Высоты 36 / 44 / 52.
        </p>
      </Card>
    </section>
  );
}
