import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackgroundQueue } from '../shared/backgroundQueue.ts';

test('all players start in background without scrolling, with bounded concurrent starts', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const queue = createBackgroundQueue(3);
  const started: number[] = [];
  const tickets = Array.from({ length: 20 }, (_, i) => queue.enqueue(() => started.push(i)));
  assert.deepEqual(started, []);
  t.mock.timers.tick(100);
  assert.deepEqual(started, [0, 1, 2]);
  for (let i = 0; i < tickets.length; i++) {
    tickets[i].complete();
    t.mock.timers.tick(100);
    assert.ok(started.length <= i + 4);
  }
  assert.deepEqual(started, Array.from({ length: 20 }, (_, i) => i));
});

test('nearby players get the next slot ahead of offscreen players', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const queue = createBackgroundQueue(1);
  const started: string[] = [];
  const first = queue.enqueue(() => started.push('first'));
  queue.enqueue(() => started.push('distant'));
  const nearby = queue.enqueue(() => started.push('nearby'));
  t.mock.timers.tick(100);
  nearby.prioritize();
  first.complete();
  t.mock.timers.tick(100);
  assert.deepEqual(started, ['first', 'nearby']);
});

test('unmounted and stalled embeds do not block the queue or release a slot twice', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const queue = createBackgroundQueue(1, 1000);
  const started: string[] = [];
  const stalled = queue.enqueue(() => started.push('stalled'));
  const removed = queue.enqueue(() => started.push('removed'));
  queue.enqueue(() => started.push('next'));
  queue.enqueue(() => started.push('last'));
  removed.cancel();
  t.mock.timers.tick(100);
  t.mock.timers.tick(1000);
  t.mock.timers.tick(100);
  assert.deepEqual(started, ['stalled', 'next']);
  stalled.complete();
  stalled.cancel();
  t.mock.timers.tick(100);
  assert.deepEqual(started, ['stalled', 'next']);
  t.mock.timers.tick(900);
  t.mock.timers.tick(100);
  assert.deepEqual(started, ['stalled', 'next', 'last']);
});
