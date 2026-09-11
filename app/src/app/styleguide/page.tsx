import type { Metadata } from 'next';
import { ButtonsSection } from './sections/ButtonsSection';
import { CardsSection } from './sections/CardsSection';
import { ColorSection } from './sections/ColorSection';
import { DataSection } from './sections/DataSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { FormsSection } from './sections/FormsSection';
import { MobileSection } from './sections/MobileSection';
import { NavSection } from './sections/NavSection';
import { ShellSection } from './sections/ShellSection';
import { SpaceSection } from './sections/SpaceSection';
import { TypeSection } from './sections/TypeSection';
import './styleguide.css';

export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — Design System',
  description: 'Токены и компоненты дизайн-системы.',
};

const LINKS: { href: string; label: string }[] = [
  { href: '#color', label: 'Цвет' },
  { href: '#type', label: 'Типографика' },
  { href: '#space', label: 'Пространство' },
  { href: '#buttons', label: 'Кнопки' },
  { href: '#forms', label: 'Формы' },
  { href: '#nav', label: 'Навигация' },
  { href: '#cards', label: 'Карточки' },
  { href: '#data', label: 'Данные' },
  { href: '#shell', label: 'Оболочка' },
  { href: '#feedback', label: 'Состояния' },
  { href: '#mobile', label: 'Мобильный' },
];

export default function StyleguidePage() {
  return (
    <div className="sg-root">
      <div className="page hero">
        <p className="t-label muted hero__kicker">Будет на ЕГЭ · Design System v0.1</p>
        <h1 className="t-h1">Light premium blue technology</h1>
        <p className="t-lg muted hero__lead">
          Токены и компоненты. Всё, что здесь показано, собирается из семантических переменных —
          палитра меняется одним файлом, структура при этом не трогается.
        </p>
      </div>

      <nav className="guide-nav" aria-label="Разделы гайда">
        <div>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="page">
        <ColorSection />
        <TypeSection />
        <SpaceSection />
        <ButtonsSection />
        <FormsSection />
        <NavSection />
        <CardsSection />
        <DataSection />
        <ShellSection />
        <FeedbackSection />
        <MobileSection />

        <footer className="sg-foot">
          Будет на ЕГЭ · Design System v0.1 · этапы 4–5. Следующий шаг — лендинг и дашборд ученика
          на этих компонентах.
        </footer>
      </main>
    </div>
  );
}
