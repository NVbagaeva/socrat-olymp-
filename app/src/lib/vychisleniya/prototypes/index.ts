/**
 * Реестр прототипов задания №8: 26 прототипов по пяти группам.
 */

import type { Prototype } from '../types';
import { P8W, P8X, P8Y, P8Z } from './bukvennye';
import { P8B, P8E, P8F, P8G } from './korni';
import { P8H, P8I, P8J, P8K, P8L } from './logarifmy';
import { P8A, P8C, P8D } from './stepeni';
import { P8M, P8N, P8O, P8P } from './trig-chetvert';
import { P8Q, P8R, P8S, P8T, P8U, P8V } from './trig-preobr';

export const PROTOTYPES: Prototype[] = [
  P8A, P8B, P8C, P8D, P8E, P8F, P8G,
  P8H, P8I, P8J, P8K, P8L,
  P8M, P8N, P8O, P8P,
  P8Q, P8R, P8S, P8T, P8U, P8V,
  P8W, P8X, P8Y, P8Z,
];

export function prototypeById(id: string): Prototype | undefined {
  return PROTOTYPES.find((p) => p.id === id);
}
