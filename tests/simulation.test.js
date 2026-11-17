import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../js/simulation.js';

function world(points, size = 12) {
  const simulation = new Simulation(size);
  for (const [x, y] of points) simulation.set(x, y, true);
  return simulation;
}
function live(simulation) {
  const points = [];
  for (let y = 0; y < simulation.size; y++) for (let x = 0; x < simulation.size; x++) {
    if (simulation.get(x, y)) points.push([x, y]);
  }
  return points;
}

test('empty world remains empty', () => {
  const simulation = world([]);
  simulation.step();
  assert.equal(simulation.population, 0);
  assert.equal(simulation.generation, 1);
});
test('block remains unchanged over ten generations', () => {
  const points = [[4, 4], [5, 4], [4, 5], [5, 5]];
  const simulation = world(points);
  for (let i = 0; i < 10; i++) simulation.step();
  assert.deepEqual(live(simulation), points);
});
test('blinker alternates and returns after two generations', () => {
  const points = [[4, 5], [5, 5], [6, 5]];
  const simulation = world(points);
  simulation.step();
  assert.deepEqual(live(simulation), [[5, 4], [5, 5], [5, 6]]);
  simulation.step();
  assert.deepEqual(live(simulation), points);
});
test('glider translates one cell diagonally after four generations', () => {
  const points = [[3, 2], [4, 3], [2, 4], [3, 4], [4, 4]];
  const simulation = world(points);
  for (let i = 0; i < 4; i++) simulation.step();
  assert.deepEqual(live(simulation), points.map(([x, y]) => [x + 1, y + 1]));
});
test('edges are finite and never wrap', () => {
  const simulation = world([[0, 0], [4, 0], [0, 4]], 5);
  simulation.step();
  assert.equal(simulation.population, 0);
  assert.equal(simulation.get(-1, 0), 0);
  assert.equal(simulation.get(5, 0), 0);
});
test('generation calculation preserves its input buffer', () => {
  const simulation = world([[4, 5], [5, 5], [6, 5]]);
  const original = simulation.cells;
  const snapshot = original.slice();
  simulation.step();
  assert.notEqual(simulation.cells, original);
  assert.deepEqual(original, snapshot);
});
test('underpopulation, survival, overpopulation, and birth follow B3/S23', () => {
  for (let neighbors = 0; neighbors <= 8; neighbors++) {
    const ring = [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [1, 3], [2, 3], [3, 3]];
    for (const alive of [false, true]) {
      const simulation = world(ring.slice(0, neighbors), 5);
      simulation.set(2, 2, alive);
      simulation.step();
      assert.equal(simulation.get(2, 2), Number(neighbors === 3 || (alive && neighbors === 2)));
    }
  }
});
test('clear and randomize reset generation with accurate populations', () => {
  const simulation = world([[2, 2]]);
  simulation.step();
  simulation.randomize(0.25, () => 0.1);
  assert.equal(simulation.population, 144);
  assert.equal(simulation.generation, 0);
  simulation.clear();
  assert.equal(simulation.population, 0);
});
