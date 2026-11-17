import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { SimulationClock } from './clock.js';

const simulation = new Simulation();
const $ = selector => document.querySelector(selector);
const renderer = new Renderer($('#grid'), simulation, update, message);
const clock = new SimulationClock(() => { simulation.step(); update(); }, update);

function message(text) { $('#feedback').textContent = text; }

function update() {
  $('#generation').textContent = simulation.generation.toLocaleString();
  $('#population').textContent = simulation.population.toLocaleString();
  $('#status').textContent = clock.running ? 'Running' : 'Paused';
  $('#status').classList.toggle('running', clock.running);
  $('#status-hint').textContent = clock.running ? 'Life in motion' : 'Ready when you are';
  $('#play').disabled = clock.running;
  $('#pause').disabled = !clock.running;
  $('#step').disabled = clock.running;
  $('#empty-hint').hidden = simulation.population > 0 || simulation.generation > 0 || clock.running;
  renderer.editable = !clock.running;
  if (clock.running) renderer.pointer = null;
  renderer.canvas.classList.toggle('is-running', clock.running);
  renderer.draw();
}

function reset() { clock.pause(); simulation.clear(); message('A fresh start. Draw something new.'); update(); }
function randomize() { clock.pause(); simulation.randomize(); message('A little chaos, at 25% starting density.'); update(); }
function step() { if (!clock.running) { simulation.step(); update(); } }
$('#play').addEventListener('click', () => { clock.play(); message('Running. Pause to edit your world.'); });
$('#pause').addEventListener('click', () => { clock.pause(); message('Paused. Your canvas is ready to edit.'); });
$('#step').addEventListener('click', step);
$('#reset').addEventListener('click', reset);
$('#randomize').addEventListener('click', randomize);
$('#speed').addEventListener('input', event => {
  clock.setSpeed(event.target.value);
  $('#speed-stat').textContent = clock.speed;
  $('#speed-value').innerHTML = `${clock.speed} <span>gen / sec</span>`;
  event.target.style.setProperty('--progress', `${(clock.speed - 1) / 19 * 100}%`);
});
$('#grid-size').addEventListener('change', event => {
  clock.pause();
  const fresh = new Simulation(Number(event.target.value));
  simulation.size = fresh.size;
  simulation.cells = fresh.cells;
  simulation.generation = 0;
  renderer.hover = null;
  renderer.keyboardCell = null;
  message(`New ${simulation.size} × ${simulation.size} world. Changing size clears the board.`);
  update();
});
$('#save').addEventListener('click', () => {
  try {
    localStorage.setItem('life-lab-board', JSON.stringify({ version: 1, size: simulation.size, generation: simulation.generation, cells: Array.from(simulation.cells) }));
    message('Board saved in this browser. Load it whenever you like.');
  } catch { message('Could not save. Browser storage may be unavailable or full.'); }
});
$('#load').addEventListener('click', () => {
  try {
    const saved = JSON.parse(localStorage.getItem('life-lab-board'));
    if (!saved) { message('No saved board yet. Save an experiment first.'); return; }
    if (saved.version !== 1 || ![30, 50, 70].includes(saved.size) || !Array.isArray(saved.cells) || saved.cells.length !== saved.size ** 2 || !saved.cells.every(cell => cell === 0 || cell === 1) || !Number.isSafeInteger(saved.generation) || saved.generation < 0) throw new Error('Invalid board');
    clock.pause();
    simulation.size = saved.size;
    simulation.cells = Uint8Array.from(saved.cells);
    simulation.generation = saved.generation;
    $('#grid-size').value = saved.size;
    renderer.hover = null;
    renderer.keyboardCell = null;
    update();
    message('Saved board restored. Pick up where you left off.');
  } catch { message('Could not load this board. Saved data may be invalid or storage unavailable.'); }
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.target.closest('input, select, textarea, button, a, [contenteditable="true"]')) return;
  if (event.code === 'Space') { event.preventDefault(); clock.running ? clock.pause() : clock.play(); }
  if (event.key.toLowerCase() === 'r') reset();
  if (event.key.toLowerCase() === 'n') step();
  if (event.key.toLowerCase() === 'g') randomize();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && clock.running) { clock.pause(); message('Paused while the tab is hidden. Press Play to resume.'); } });
update();
