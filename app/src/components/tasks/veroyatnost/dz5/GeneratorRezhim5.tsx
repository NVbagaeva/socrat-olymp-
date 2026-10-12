'use client';

import { useState, type ReactNode } from 'react';
import { Option, OptionGroup } from '@/components/tasks/configurator';

export interface GeneratorRezhim5Props {
  /** Генератор по шаблонам: как у графиков №12. */
  shablony: ReactNode;
  /** Прежний генератор: прототипы банка по методам. */
  prototipy: ReactNode;
}

/**
 * Вкладка «Генератор» №5: сначала генератор по шаблонам (числа и
 * сюжеты по seed, ответ точный), рядом — прежний выбор прототипов
 * банка, чтобы старые комплекты и привычный сценарий не пропали.
 */
export function GeneratorRezhim5({ shablony, prototipy }: GeneratorRezhim5Props) {
  const [rezhim, setRezhim] = useState<'shablony' | 'prototipy'>('shablony');
  return (
    <>
      <div className="dz5-gen-rezhim">
        <OptionGroup id="gen5-rezhim" label="Откуда задачи">
          <Option
            checked={rezhim === 'shablony'}
            onSelect={() => setRezhim('shablony')}
            title="Шаблоны задач"
            lead="Полная вероятность, Байес, Бернулли, «хотя бы один», диаграммы Эйлера — новые числа на каждый комплект"
          />
          <Option
            checked={rezhim === 'prototipy'}
            onSelect={() => setRezhim('prototipy')}
            title="Прототипы банка"
            lead="Сюжеты банка заданий по методам решения"
          />
        </OptionGroup>
      </div>
      {rezhim === 'shablony' ? shablony : prototipy}
    </>
  );
}
