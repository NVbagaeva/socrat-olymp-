import type { Metadata } from 'next';
import { glavnayaJsonLd } from '@/lib/jsonLd';
import { ogStranicy } from '@/lib/og';
import { GlavnayaSumerki } from '@/components/landing/sumerki/GlavnayaSumerki';
import { StereoChast } from '@/components/landing/sumerki/StereoChast';
import { landing } from '@/content/landing';
import './landing.css';

export const metadata: Metadata = {
  title: landing.meta.title,
  description: landing.meta.description,
  openGraph: ogStranicy(landing.meta.title, landing.meta.description),
  /* Канонический адрес — от metadataBase корневого макета:
     https://budetege.ru/ без ?utm и прочих хвостов. */
  alternates: { canonical: '/' },
};

/* Главная профиля — синяя сцена-витрина и витрина возможностей
   (components/landing/sumerki); третья часть витрины — живая
   стереометрия (StereoChast). База (/baza/) — прежняя разметка
   Glavnaya: тексты витрины написаны под профиль. */
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: glavnayaJsonLd(landing.meta.description) }}
      />
      <GlavnayaSumerki vid="vitrina" level="profile" vitrinaPosle={<StereoChast />} />
    </>
  );
}
