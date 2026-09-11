'use client';

import { Card, Checkbox, FieldLabel, FieldMessage, Input, Radio, Select } from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

export function FormsSection() {
  return (
    <section id="forms">
      <SectionHeader
        title="Формы"
        index="05"
        description="Метка всегда сверху, плейсхолдер её не заменяет. Сообщение об ошибке объясняет формат, а не констатирует ошибку."
      />
      <div className="g3 block grid">
        <Card>
          <div className="stack stack--lg">
            <div className="field">
              <FieldLabel htmlFor="sg-target">Целевой балл</FieldLabel>
              <Input id="sg-target" placeholder="90" defaultValue="" />
            </div>
            <div className="field">
              <FieldLabel htmlFor="sg-grade">Класс</FieldLabel>
              <Select id="sg-grade" defaultValue="11">
                <option value="11">11 класс</option>
                <option value="10">10 класс</option>
                <option value="grad">Выпускник</option>
              </Select>
            </div>
            <div className="field">
              <FieldLabel htmlFor="sg-locked">Недоступно</FieldLabel>
              <Input id="sg-locked" defaultValue="Задаёт учитель" disabled />
            </div>
          </div>
        </Card>

        <Card>
          <div className="stack stack--lg">
            <div className="field">
              <FieldLabel htmlFor="sg-answer-error">Ответ</FieldLabel>
              <Input
                id="sg-answer-error"
                state="error"
                defaultValue="2,5"
                aria-describedby="sg-answer-error-msg"
              />
              <FieldMessage tone="error" id="sg-answer-error-msg">
                Ответ — целое число или десятичная дробь
              </FieldMessage>
            </div>
            <div className="field">
              <FieldLabel htmlFor="sg-answer-ok">Ответ</FieldLabel>
              <Input
                id="sg-answer-ok"
                state="success"
                defaultValue="±2"
                aria-describedby="sg-answer-ok-msg"
              />
              <FieldMessage tone="success" id="sg-answer-ok-msg">
                Принято
              </FieldMessage>
            </div>
          </div>
        </Card>

        <Card>
          <div className="stack stack--form">
            <Checkbox defaultChecked>С подсказками</Checkbox>
            <Checkbox indeterminate>Выбрать всех учеников</Checkbox>
            <Checkbox disabled>Недоступно на тарифе</Checkbox>
            <hr className="divider" />
            <Radio name="sg-scope" defaultChecked>
              Весь класс
            </Radio>
            <Radio name="sg-scope">Выбранные ученики</Radio>
          </div>
        </Card>
      </div>
    </section>
  );
}
