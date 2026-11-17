import test from 'node:test';
import assert from 'node:assert/strict';
import { SimulationClock } from '../js/clock.js';

test('rapid Play calls keep one loop; pause cancels it; speed changes apply without adding loops', () => {
  const oldRequest = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  const callbacks = new Map();
  let id = 0;
  globalThis.requestAnimationFrame = callback => { callbacks.set(++id, callback); return id; };
  globalThis.cancelAnimationFrame = frame => callbacks.delete(frame);
  try {
    let ticks = 0;
    const clock = new SimulationClock(() => ticks++);
    for (let i = 0; i < 20; i++) clock.play();
    assert.equal(callbacks.size, 1);
    clock.setSpeed(20);
    assert.equal(callbacks.size, 1);
    const callback = callbacks.get(id);
    callbacks.delete(id);
    callback(clock.last + 51);
    assert.equal(ticks, 1);
    assert.equal(callbacks.size, 1);
    clock.pause();
    assert.equal(callbacks.size, 0);
    callback(clock.last + 5000);
    assert.equal(ticks, 1);
    clock.play();
    assert.equal(callbacks.size, 1);
    clock.pause();
  } finally {
    globalThis.requestAnimationFrame = oldRequest;
    globalThis.cancelAnimationFrame = oldCancel;
  }
});
