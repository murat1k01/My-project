// Лабораторные №9 и №10: проверка формы и SQL-запросов таблицы favorites.
// Запросы берутся из того же файла, что использует приложение, и выполняются в настоящей базе SQLite.
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { CREATE_FAVORITES_TABLE, DELETE_FAVORITE, INSERT_FAVORITE, SELECT_FAVORITES, TOGGLE_READ } from '../../src/database/favoritesSql.ts';
import { isRealDate, validateEventForm } from '../../src/utils/eventValidation.ts';
import { validateCard } from '../../src/utils/card.ts';

const valid = {
  fullName: 'Айдана Серікова',
  group: 'ИС-21',
  eventType: 'hackathon',
  date: '01.12.2026',
  description: 'Хочу участвовать с командой',
  agreed: true,
};
const now = new Date(2026, 10, 7);

test('№9: правильная форма проходит проверку', () => {
  assert.deepEqual(validateEventForm(valid, now), {});
});

test('№9: каждое правило проверяется отдельно', () => {
  const check = (patch) => validateEventForm({ ...valid, ...patch }, now);
  assert.equal(check({ fullName: '  Ай  ' }).fullName, 'evErrName');
  assert.equal(check({ group: '   ' }).group, 'evErrGroup');
  assert.equal(check({ eventType: null }).eventType, 'evErrType');
  assert.equal(check({ date: '2026-12-01' }).date, 'evErrDateFormat');
  assert.equal(check({ date: '31.02.2026' }).date, 'evErrDateInvalid');
  assert.equal(check({ date: '06.11.2026' }).date, 'evErrDatePast');
  assert.equal(check({ date: '07.11.2026' }).date, undefined, 'сегодня можно');
  assert.equal(check({ description: '   короткий   ' }).description, 'evErrDescription');
  assert.equal(check({ description: 'а'.repeat(201) }).description, 'evErrDescriptionLong');
  assert.equal(check({ agreed: false }).agreed, 'evErrAgree');
  assert.ok(isRealDate('29.02.2028') && !isRealDate('29.02.2027'));
});

test('№10: сохранение без повторов, порядок, смена статуса и удаление', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(CREATE_FAVORITES_TABLE);
  const insert = db.prepare(INSERT_FAVORITE);
  assert.equal(insert.run('a', 'Первое', 'Текст А', '2026-11-07T10:00:00Z').changes, 1);
  assert.equal(insert.run('b', 'Второе', 'Текст Б', '2026-11-07T11:00:00Z').changes, 1);
  assert.equal(insert.run('c', "Кавычка ' внутри", 'Текст В', '2026-11-07T12:00:00Z').changes, 1, 'параметры, а не склейка строк');
  assert.equal(insert.run('a', 'Первое', 'Текст А', '2026-11-07T13:00:00Z').changes, 0, 'повтор не добавляется');

  db.prepare(TOGGLE_READ).run('c');
  const rows = db.prepare(SELECT_FAVORITES).all();
  assert.deepEqual(rows.map((r) => r.id), ['b', 'a', 'c'], 'непрочитанные сначала');
  assert.equal(rows.find((r) => r.id === 'c').isRead, 1);
  db.prepare(TOGGLE_READ).run('c');
  assert.equal(db.prepare(SELECT_FAVORITES).all().find((r) => r.id === 'c').isRead, 0);

  db.prepare(DELETE_FAVORITE).run('b');
  assert.deepEqual(db.prepare(SELECT_FAVORITES).all().map((r) => r.id).sort(), ['a', 'c']);
});

test('оплата: тестовая карта — любые 16 цифр', () => {
  const now = new Date(2026, 10, 9);
  const card = { number: '1234 5678 1234 5678', month: '12', year: '2028', holder: 'Айдана Серикова', cvv: '123' };
  assert.deepEqual(validateCard(card, now), {});
  assert.equal(validateCard({ ...card, number: '1234 5678 1234 567' }, now).number, 'payErrNumber', '15 цифр');
  assert.equal(validateCard({ ...card, month: '13' }, now).month, 'payErrMonth');
  assert.equal(validateCard({ ...card, month: '10', year: '2026' }, now).year, 'payErrExpired');
  assert.equal(validateCard({ ...card, month: '11', year: '2026' }, now).year, undefined, 'действует до конца месяца');
  assert.equal(validateCard({ ...card, holder: 'А' }, now).holder, 'payErrHolder');
  assert.equal(validateCard({ ...card, cvv: '12' }, now).cvv, 'payErrCvv');
});
