import type { Ton } from '../steklo';

/** Тип задач в выборе тем: прототип с человеческим названием. */
export interface TipVybora {
  id: string;
  /** Название, HTML (может содержать формулу). */
  nazvanieHtml: string;
}

/** Группа в выборе тем. */
export interface GruppaVybora {
  id: string;
  nazvanie: string;
  znakHtml: string;
  ton: Ton;
  tipy: TipVybora[];
}

/** Строка прогресса или итогов по группе. */
export interface StrokaGruppy {
  id: string;
  nazvanie: string;
  znakHtml: string;
  ton: Ton;
  verno: number;
  vsego: number;
  /** Пометить строку: «Стоит повторить» в прогрессе, «Просел» в итогах. */
  metka?: string;
}
