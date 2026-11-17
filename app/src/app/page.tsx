import type { Metadata } from 'next';
import { ogStranicy } from '@/lib/og';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import { landing } from '@/content/landing';
import './landing.css';

export const metadata: Metadata = {
  title: landing.meta.title,
  description: landing.meta.description,
  openGraph: ogStranicy(landing.meta.title, landing.meta.description),
};

/* Главная профиля — синяя сцена-витрина и витрина возможностей
   (components/landing/sumerki). База (/baza/) — прежняя разметка
   Glavnaya: тексты витрины написаны под профиль. */
export default function HomePage() {
  return <GlavnayaSumerki vid="vitrina" level="profile" />;
}
