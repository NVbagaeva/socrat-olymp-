'use client';

/**
 * Входные компоненты страниц кабинета: страница (серверная) рисует
 * оболочку, а это — содержимое за входом и проверкой роли.
 */

import { AdminHome } from './AdminHome';
import { ClassPage } from './ClassPage';
import { HomeworkPage } from './HomeworkPage';
import { IssueHomework } from './IssueHomework';
import { KabinetGate } from './KabinetGate';
import { StudentHome } from './StudentHome';
import { TutorHome } from './TutorHome';

export function KabinetHomeScreen() {
  return (
    <KabinetGate>
      {(me) =>
        me.role === 'student' ? (
          <StudentHome me={me} />
        ) : me.role === 'tutor' ? (
          <TutorHome me={me} />
        ) : (
          <AdminHome me={me} />
        )
      }
    </KabinetGate>
  );
}

export function IssueHomeworkScreen() {
  return <KabinetGate roles={['tutor']}>{() => <IssueHomework />}</KabinetGate>;
}

export function ClassScreen() {
  return <KabinetGate roles={['tutor']}>{() => <ClassPage />}</KabinetGate>;
}

export function HomeworkScreen() {
  return <KabinetGate>{(me) => <HomeworkPage me={me} />}</KabinetGate>;
}
