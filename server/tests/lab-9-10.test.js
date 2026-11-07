// Лабораторные №9 и №10: проверка формы и SQL-запросов таблицы favorites.
// Запросы берутся из того же файла, что использует приложение, и выполняются в настоящей базе SQLite.
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { CREATE_FAVORITES_TABLE, DELETE_FAVORITE, INSERT_FAVORITE, SELECT_FAVORITES, TOGGLE_READ } from '../../src/database/favoritesSql.ts';
import { isRealDate, validateEventForm } from '../../src/utils/eventValidation.ts';

const valid = {
  fullName: 'Айдана Серікова',
  group: 'ИС-21',
  eventType: 'hackathon',
  date: '2026-12-01',
  participants: '3',
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
  assert.equal(check({ date: '01.12.2026' }).date, 'evErrDateFormat');
  assert.equal(check({ date: '2026-02-31' }).date, 'evErrDateInvalid');
  assert.equal(check({ date: '2026-11-06' }).date, 'evErrDatePast');
  assert.equal(check({ date: '2026-11-07' }).date, undefined, 'сегодня можно');
  for (const bad of ['0', '6', '2.5', 'два', '']) assert.equal(check({ participants: bad }).participants, 'evErrParticipants', bad);
  assert.equal(check({ participants: '5' }).participants, undefined);
  assert.equal(check({ description: '   короткий   ' }).description, 'evErrDescription');
  assert.equal(check({ description: 'а'.repeat(201) }).description, 'evErrDescriptionLong');
  assert.equal(check({ agreed: false }).agreed, 'evErrAgree');
  assert.ok(isRealDate('2028-02-29') && !isRealDate('2027-02-29'));
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
