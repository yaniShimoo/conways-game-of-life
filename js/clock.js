/** One animation-frame chain, with no work scheduled while paused. */
export class SimulationClock {
  constructor(tick, onStateChange = () => {}) {
    this.tick = tick;
    this.onStateChange = onStateChange;
    this.running = false;
    this.speed = 8;
    this.frame = null;
    this.last = 0;
  }
  play() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.onStateChange();
    this.frame = requestAnimationFrame(time => this.loop(time));
  }
  loop(time) {
    if (!this.running) return;
    const interval = 1000 / this.speed;
    const elapsed = time - this.last;
    if (elapsed >= interval) {
      // Bound catch-up after slow frames; never replay a long background-tab backlog.
      const steps = Math.min(4, Math.floor(elapsed / interval));
      for (let i = 0; i < steps; i++) this.tick();
      this.last = time - elapsed % interval;
    }
    this.frame = requestAnimationFrame(next => this.loop(next));
  }
  pause() {
    this.running = false;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.onStateChange();
  }
  setSpeed(value) {
    this.speed = Math.max(1, Math.min(20, Number(value)));
    this.last = performance.now();
  }
}
