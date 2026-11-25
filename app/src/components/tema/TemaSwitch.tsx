import clsx from 'clsx';
import './tema-switch.css';

/**
 * Переключатель «светлая / тёмная» в шапке: солнце и луна в стеклянной
 * таблетке. Клиентского кода у него нет: щелчок, aria-checked и
 * подсказку обслуживает скрипт темы в <head> (lib/tema.ts) — так
 * переключатель не утяжеляет первую загрузку страниц заданий. Здесь —
 * разметка для светлой темы; в тёмной скрипт поправляет атрибуты до
 * того, как кнопку увидят (suppressHydrationWarning — React о них не
 * знает).
 */
export function TemaSwitch({ className }: { className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked="false"
      aria-label="Тёмная тема"
      title="Включить тёмную тему"
      className={clsx('tema-switch', className)}
      suppressHydrationWarning
    >
      <span className="tema-switch__plate" aria-hidden="true">
        <svg className="tema-switch__sun" viewBox="0 0 24 24" width="18" height="18">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
        <svg className="tema-switch__moon" viewBox="0 0 24 24" width="18" height="18">
          <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" />
        </svg>
      </span>
    </button>
  );
}
