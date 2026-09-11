import { SectionHeader } from '../SectionHeader';

interface Swatch {
  token: string;
  name: string;
  hex: string;
}

const SURFACES: Swatch[] = [
  { token: 'bg', name: 'background', hex: '#F5F9FF' },
  { token: 'surface', name: 'surface', hex: '#FFFFFF' },
  { token: 'surface-2', name: 'surface-secondary', hex: '#F7F9FC' },
  { token: 'surface-brand', name: 'surface-brand', hex: '#0E2350' },
  { token: 'text', name: 'text', hex: '#101728' },
  { token: 'text-secondary', name: 'text-secondary', hex: '#667389' },
  { token: 'text-tertiary', name: 'text-tertiary', hex: '#97A1B0' },
  { token: 'border', name: 'border', hex: '#E4EBF3' },
];

const BRAND: Swatch[] = [
  { token: 'primary', name: 'primary', hex: '#1F5FD0' },
  { token: 'primary-hover', name: 'primary-hover', hex: '#1A4FB0' },
  { token: 'primary-active', name: 'primary-active', hex: '#163F8C' },
  { token: 'surface-soft', name: 'surface-soft', hex: '#E8F0FC' },
];

const STATUSES: Swatch[] = [
  { token: 'success', name: 'success · «Отлично», рост', hex: '#16A34A' },
  { token: 'warning', name: 'warning · «Требует внимания»', hex: '#D97D0B' },
  { token: 'error', name: 'error · «Риск», типичная ошибка', hex: '#DC2626' },
];

function Swatches({ items, columns }: { items: Swatch[]; columns: 'g3' | 'g4' }) {
  return (
    <div className={`grid ${columns}`}>
      {items.map((swatch) => (
        <div className="swatch" key={swatch.token}>
          <b data-token={swatch.token} />
          <span>
            {swatch.name}
            <br />
            <code>{swatch.hex}</code>
          </span>
        </div>
      ))}
    </div>
  );
}

export function ColorSection() {
  return (
    <section id="color">
      <SectionHeader
        title="Цвет"
        index="01"
        description="Синий означает действие или данные и никогда не используется декоративно. Success, warning и error — только статусы: они не участвуют в градациях прогресса."
      />

      <div className="block">
        <h3>Поверхности и текст</h3>
        <Swatches items={SURFACES} columns="g4" />
      </div>

      <div className="block">
        <h3>Фирменный синий</h3>
        <Swatches items={BRAND} columns="g4" />
      </div>

      <div className="block">
        <h3>Статусы</h3>
        <Swatches items={STATUSES} columns="g3" />
      </div>

      <div className="block">
        <h3>Шкала тепловой карты</h3>
        <div className="row row--tight heat-scale">
          {[1, 2, 3, 4, 5].map((level) => (
            <span key={level} data-heat={level} />
          ))}
        </div>
        <p className="spec">
          Отдельная шкала, не пересекается с семантикой. 5 ступеней — больше глаз не различает.
        </p>
      </div>
    </section>
  );
}
