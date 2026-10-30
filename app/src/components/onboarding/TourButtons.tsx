'use client';

import { Fragment } from 'react';
import { HELP, TOUR_ORDER, TOURS, type TourId } from '@/content/onboarding';
import { startTour, useOnboarding } from '@/lib/onboarding';

/**
 * Кнопки туров для меню помощи: тур не начат или пройден — «Тур для …»;
 * остановлен на середине — «продолжить с шага» и «сначала». Общие для
 * кнопки «?» (HelpFab) и шторки «i» вариантов повышенной сложности.
 */
export function TourButtons({
  className,
  menuitem = false,
  onRun,
}: {
  className?: string;
  /** Кнопки — пункты меню (role="menuitem"). */
  menuitem?: boolean;
  /** Перед запуском тура: закрыть меню или шторку. */
  onRun: () => void;
}) {
  const state = useOnboarding();
  const run = (id: TourId, step: number) => {
    onRun();
    startTour(id, step);
  };
  const role = menuitem ? 'menuitem' : undefined;
  return TOUR_ORDER.map((id) => {
    const tour = TOURS[id];
    const progress = state.tours[id];
    if (progress === undefined || progress.done || progress.step === 0) {
      return (
        <button key={id} type="button" role={role} className={className} onClick={() => run(id, 0)}>
          {tour.label}
        </button>
      );
    }
    return (
      <Fragment key={id}>
        <button
          type="button"
          role={role}
          className={className}
          onClick={() => run(id, progress.step)}
        >
          {HELP.continueTour(tour.label, progress.step + 1, tour.steps.length + 1)}
        </button>
        <button type="button" role={role} className={className} onClick={() => run(id, 0)}>
          {HELP.restartTour(tour.label)}
        </button>
      </Fragment>
    );
  });
}
