'use client';

import Link from 'next/link';
import type { Level } from '@/lib/level';
import { useLevel } from '@/lib/levelStore';
import { NavDrop } from './NavDropdown';

/** Задание в панели: номер, название и адрес (нет адреса — раздел ещё не открыт). */
export interface PunktZadaniya {
  no: string;
  name: string;
  href: string | null;
}

export interface NavZadaniyaProps {
  label: string;
  /** Задания каждого уровня: панель показывает уровень посетителя. */
  zadaniya: Readonly<Record<Level, readonly PunktZadaniya[]>>;
  /** Нижний ряд панели: весь банк и соседние разделы практики. */
  nizhnie: readonly { label: string; hrefs: Readonly<Record<Level, string>> }[];
  skoro: string;
  currentHref?: string;
}

/**
 * Пункт «Задания» широкой шапки: весь каталог в одной панели — плитка
 * заданий экзамена и под ней банк целиком и устный счёт. До любого
 * задания — один щелчок с любой публичной страницы. Поведение — общее
 * со списком «Варианты» (NavDrop).
 */
export function NavZadaniya({ label, zadaniya, nizhnie, skoro, currentHref }: NavZadaniyaProps) {
  const level = useLevel();
  const current = nizhnie.some((link) => Object.values(link.hrefs).includes(currentHref ?? ''));
  return (
    <NavDrop label={label} current={current} panel>
      {(close) => (
        <>
          <ul className="nav-zad__setka">
            {zadaniya[level].map((z) => (
              <li key={z.no}>
                {z.href !== null ? (
                  <Link className="nav-drop__item nav-zad__punkt" href={z.href} onClick={close}>
                    <span className="nav-zad__no">{z.no}</span>
                    <span className="nav-zad__imya">{z.name}</span>
                  </Link>
                ) : (
                  <span className="nav-zad__punkt nav-zad__punkt--skoro">
                    <span className="nav-zad__no">{z.no}</span>
                    <span className="nav-zad__imya">
                      {z.name} <span className="nav-zad__skoro">{skoro}</span>
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="nav-zad__niz">
            {nizhnie.map((link) => (
              <Link
                key={link.label}
                className="nav-drop__item nav-zad__nizhniy"
                href={link.hrefs[level]}
                aria-current={link.hrefs[level] === currentHref ? 'page' : undefined}
                onClick={close}
              >
                {link.label}
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h13M12 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </>
      )}
    </NavDrop>
  );
}
