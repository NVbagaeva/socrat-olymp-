import { Card } from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

const SAMPLES: { className: string; sample: string; spec: string }[] = [
  { className: 't-data-xl', sample: '87%', spec: 'Numbers · 48/56 · 700 · tabular-nums' },
  { className: 't-h1', sample: 'Без границ.', spec: 'H1 · 56/64 · 700 · −0.025em' },
  { className: 't-h2', sample: 'Динамика результатов', spec: 'H2 · 40/48 · 600' },
  { className: 't-h3', sample: 'Слабые темы', spec: 'H3 · 28/36 · 500' },
  { className: 't-h4', sample: 'Что делать дальше', spec: 'H4 · 20/28 · 600' },
  {
    className: 't-lg',
    sample: 'Персональные траектории и аналитика на каждом этапе подготовки.',
    spec: 'Body Large · 18/28 · 400',
  },
  {
    className: 't-body',
    sample: 'Найдите все значения параметра a, при которых уравнение имеет ровно один корень.',
    spec: 'Body · 16/24 · 400 · до 72 знаков в строке',
  },
  { className: 't-caption muted', sample: 'Обновлено 11 сентября', spec: 'Caption · 14/20 · 400' },
  {
    className: 't-label muted',
    sample: 'Целевой балл',
    spec: 'Label · 12/16 · 500 · обычный регистр, не капс',
  },
];

export function TypeSection() {
  return (
    <section id="type">
      <SectionHeader
        title="Типографика"
        index="02"
        description="Inter на весь продукт: полная кириллица, табличные цифры, открытая лицензия. Иерархию держат размер и вес, не цвет."
      />
      <Card>
        <div className="type-sample">
          {SAMPLES.map((item) => (
            <div key={item.spec}>
              <span className={item.className}>{item.sample}</span>
              <p className="spec">{item.spec}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
