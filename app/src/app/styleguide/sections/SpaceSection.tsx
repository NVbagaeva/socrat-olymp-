import { Card } from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

const STEPS: { size: number; scale: 1 | 2 | 3 | 4 }[] = [
  { size: 4, scale: 1 },
  { size: 8, scale: 1 },
  { size: 12, scale: 1 },
  { size: 16, scale: 2 },
  { size: 20, scale: 2 },
  { size: 24, scale: 2 },
  { size: 32, scale: 3 },
  { size: 48, scale: 3 },
  { size: 64, scale: 4 },
];

const RADII = ['sm', 'md', 'lg', 'xl'] as const;
const DEPTHS = ['xs', 'sm', 'md', 'lg'] as const;

export function SpaceSection() {
  return (
    <section id="space">
      <SectionHeader
        title="Пространство и форма"
        index="03"
        description="Шаг 4px. Промежуточных значений не существует: если понадобилось 18 — ошибка в композиции выше."
      />
      <div className="g2 grid">
        <Card title="Отступы">
          <div className="ruler">
            {STEPS.map((step) => (
              <div key={step.size}>
                <span className="t-label dim">{step.size}</span>
                <b data-scale={step.scale} style={{ width: step.size }} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Радиусы и глубина">
          <div className="row radii">
            {RADII.map((radius) => (
              <b key={radius} data-r={radius} />
            ))}
          </div>
          <p className="spec spec--gap">6 мелкие · 8 кнопки и поля · 12 карточки · 16 модалки</p>
          <div className="row depths">
            {DEPTHS.map((depth) => (
              <b key={depth} data-d={depth} />
            ))}
          </div>
          <p className="spec">Глубину даёт граница, а не тень. lg — только модалки.</p>
        </Card>
      </div>
    </section>
  );
}
