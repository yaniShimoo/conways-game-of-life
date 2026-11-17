import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';

const simulation = new Simulation();
const renderer = new Renderer(document.querySelector('#grid'), simulation, () => renderer.draw());
