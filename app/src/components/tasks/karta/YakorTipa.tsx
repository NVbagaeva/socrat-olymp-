'use client';

import { useEffect } from 'react';

/**
 * Якорь типа на вкладке «О задании»: адрес …/zadaniya/3/#tip-konus
 * (…/zadaniya/7/#tip-P11) раскрывает карточку типа и её группу и
 * подводит к ней страницу. Так открываются прежние страницы разборов
 * (с них стоит переадресация) и ссылки «к типу» из тренажёра и опорных
 * задач. Общий для разделов на карте задания (components/tasks/karta).
 */
export function YakorTipa() {
  useEffect(() => {
    const otkryt = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!/^(tip|gruppa)-[A-Za-z0-9-]+$/.test(id)) {
        return;
      }
      const cel = document.getElementById(id);
      if (!(cel instanceof HTMLDetailsElement)) {
        return;
      }
      cel.open = true;
      const gruppa = cel.parentElement?.closest('details');
      if (gruppa instanceof HTMLDetailsElement) {
        gruppa.open = true;
      }
      /* После раскрытия высота страницы меняется — подводим на следующем кадре. */
      window.requestAnimationFrame(() => cel.scrollIntoView({ block: 'start' }));
    };
    otkryt();
    window.addEventListener('hashchange', otkryt);
    return () => window.removeEventListener('hashchange', otkryt);
  }, []);
  return null;
}
