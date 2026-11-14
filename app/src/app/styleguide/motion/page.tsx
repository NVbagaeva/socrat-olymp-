import type { Metadata } from 'next';
import { MotionDemo } from './MotionDemo';
import './motion.css';

/* Служебная витрина motion-системы (docs/motion-system.md): токены
   длительностей и кривых и прототипы ключевых анимаций. Стили и токены
   действуют только под корневым классом .mo — сайт они не меняют.
   Страница в меню не входит и не индексируется. */

export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — прототипы движения',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MotionDemo />;
}
