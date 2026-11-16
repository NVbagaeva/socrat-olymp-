import { clsx } from 'clsx';
import type { NavGroup } from '@/content/site';
import { NavIcon } from '@/components/ui/NavIcons';

export interface NavSpisokProps {
  group: NavGroup;
  /** Текущая страница: если она в группе, кнопка отмечена как текущая. */
  currentHref?: string;
}

/**
 * Пункт шапки кабинета со списком ссылок («Варианты») — без JavaScript.
 *
 * Шапка кабинета стоит на каждой странице заданий, и бюджет первой
 * загрузки у них впритык (scripts/check-first-load.mjs): клиентский
 * NavDropdown добавлял к каждой странице свой код. Здесь список
 * открывается средствами CSS (.nav-drop--css, styles/components.css):
 * наведением мыши, касанием или фокусом с клавиатуры (:focus-within) и
 * закрывается, когда указатель или фокус уходят из группы. Ссылки
 * остаются в порядке табуляции сразу за кнопкой. Разметка пунктов —
 * та же, что у NavDropdown, поэтому и оформление общее.
 */
export function NavSpisok({ group, currentHref }: NavSpisokProps) {
  const current = group.items.some((item) => item.href === currentHref);
  return (
    <div className="nav-drop nav-drop--css">
      <button
        type="button"
        className={clsx('nav-drop__button', current && 'is-current')}
        aria-haspopup="true"
      >
        {group.label}
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3 4.5 6 7.5l3-3" />
        </svg>
      </button>
      <ul className="nav-drop__list" aria-label={group.label}>
        {group.items.map((item) => (
          <li key={item.href}>
            <a
              className="nav-drop__item"
              href={item.href}
              aria-current={item.href === currentHref ? 'page' : undefined}
            >
              <span className="nav-drop__ico">
                <NavIcon name={item.icon} />
              </span>
              <span className="nav-drop__text">
                <span className="nav-drop__label">{item.label}</span>
                <span className="nav-drop__hint">{item.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
