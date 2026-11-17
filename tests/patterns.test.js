import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../js/simulation.js';
import { patterns } from '../js/patterns.js';

for (const [name, period] of [['blinker', 2], ['toad', 2], ['pulsar', 3]]) {
  test(`${name} returns after its documented period`, () => {
    const simulation = new Simulation(50);
    simulation.place(patterns.find(pattern => pattern.id === name), 15, 15);
    const original = simulation.cells.slice();
    simulation.step();
    assert.notDeepEqual(simulation.cells, original);
    for (let i = 1; i < period; i++) simulation.step();
    assert.deepEqual(simulation.cells, original);
  });
}
test('lightweight spaceship translates two cells left in four generations', () => {
  const simulation = new Simulation(50);
  const spaceship = patterns.find(pattern => pattern.id === 'lwss');
  simulation.place(spaceship, 15, 15);
  for (let i = 0; i < 4; i++) simulation.step();
  const expected = new Simulation(50);
  expected.place(spaceship, 13, 15);
  assert.deepEqual(simulation.cells, expected.cells);
});
test('all presets fit at their last valid position; invalid placement is atomic', () => {
  for (const pattern of patterns) {
    const simulation = new Simulation(50);
    assert.equal(simulation.place(pattern, 50 - pattern.width, 50 - pattern.height), true);
    assert.equal(simulation.population, pattern.cells.length);
    const before = simulation.cells.slice();
    assert.equal(simulation.place(pattern, 51 - pattern.width, 50 - pattern.height), false);
    assert.deepEqual(simulation.cells, before);
  }
});
test('placement replaces its footprint and preserves cells outside it', () => {
  const simulation = new Simulation(50);
  simulation.set(0, 0, true);
  simulation.set(10, 10, true);
  simulation.place(patterns[0], 10, 10);
  assert.equal(simulation.get(0, 0), 1);
  assert.equal(simulation.get(10, 10), 0);
  assert.equal(simulation.population, 6);
  assert.equal(simulation.generation, 0);
});
