export class Renderer {
  constructor(canvas, simulation, onEdit, onMessage = () => {}) {
    this.canvas = canvas;
    this.simulation = simulation;
    this.context = canvas.getContext('2d');
    this.onEdit = onEdit;
    this.onMessage = onMessage;
    this.editable = true;
    this.pattern = null;
    this.hover = null;
    this.pointer = null;
    this.keyboardCell = null;
    this.canvas.tabIndex = 0;
    canvas.addEventListener('pointerdown', event => this.start(event));
    canvas.addEventListener('pointermove', event => this.move(event));
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(name, () => { this.pointer = null; });
    }
    canvas.addEventListener('pointerleave', () => { if (!this.pointer) { this.hover = null; this.draw(); } });
    canvas.addEventListener('keydown', event => this.key(event));
    canvas.addEventListener('blur', () => { this.keyboardCell = null; this.draw(); });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }

  resize() {
    const width = this.canvas.getBoundingClientRect().width;
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = this.canvas.width;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.width = width;
    this.draw();
  }

  cellAt(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * this.simulation.size);
    const y = Math.floor((event.clientY - rect.top) / rect.height * this.simulation.size);
    return this.simulation.contains(x, y) ? { x, y } : null;
  }

  start(event) {
    if (!this.editable || this.pointer || event.button !== 0) return;
    const cell = this.cellAt(event);
    if (!cell) return;
    event.preventDefault();
    this.canvas.focus({ preventScroll: true });
    this.canvas.setPointerCapture(event.pointerId);
    this.hover = cell;
    if (this.pattern) { this.place(cell); return; }
    this.pointer = { id: event.pointerId, alive: !this.simulation.get(cell.x, cell.y), last: cell };
    this.simulation.set(cell.x, cell.y, this.pointer.alive);
    this.onEdit();
    this.draw();
  }

  move(event) {
    const cell = this.cellAt(event);
    this.hover = cell;
    if (this.editable && cell && this.pointer?.id === event.pointerId) {
      const { last, alive } = this.pointer;
      // Interpolate fast drags so skipped pointer events do not leave gaps.
      const steps = Math.max(Math.abs(cell.x - last.x), Math.abs(cell.y - last.y));
      for (let i = 0; i <= steps; i++) {
        const fraction = steps ? i / steps : 0;
        this.simulation.set(Math.round(last.x + (cell.x - last.x) * fraction), Math.round(last.y + (cell.y - last.y) * fraction), alive);
      }
      this.pointer.last = cell;
      this.onEdit();
    }
    this.draw();
  }

  place(cell) {
    if (!this.simulation.place(this.pattern, cell.x, cell.y)) {
      this.onMessage('This pattern will not fit here. Move it away from the edge.');
      return;
    }
    this.onMessage(this.pattern.name + ' placed. Keep placing, or choose Draw cells.');
    this.onEdit();
    this.draw();
  }

  key(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(event.key)) {
      event.preventDefault();
      const cell = this.keyboardCell || { x: Math.floor(this.simulation.size / 2), y: Math.floor(this.simulation.size / 2) };
      if (event.key === 'ArrowUp') cell.y--;
      if (event.key === 'ArrowDown') cell.y++;
      if (event.key === 'ArrowLeft') cell.x--;
      if (event.key === 'ArrowRight') cell.x++;
      cell.x = Math.max(0, Math.min(this.simulation.size - 1, cell.x));
      cell.y = Math.max(0, Math.min(this.simulation.size - 1, cell.y));
      this.keyboardCell = cell;
      this.hover = cell;
      if (event.key === 'Enter' && this.editable) {
        if (this.pattern) this.place(cell);
        else { this.simulation.set(cell.x, cell.y, !this.simulation.get(cell.x, cell.y)); this.onEdit(); }
      }
      this.draw();
    }
  }

  draw() {
    const ctx = this.context;
    const size = this.simulation.size;
    const cellSize = this.width / size;
    ctx.clearRect(0, 0, this.width, this.width);
    ctx.fillStyle = '#10151b';
    ctx.fillRect(0, 0, this.width, this.width);
    ctx.fillStyle = '#b4f272';
    const gap = Math.max(0.7, cellSize * 0.13);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (this.simulation.get(x, y)) ctx.fillRect(x * cellSize + gap, y * cellSize + gap, cellSize - 2 * gap, cellSize - 2 * gap);
    }
    ctx.strokeStyle = '#ffffff0b';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= size; i++) {
      const position = i * cellSize;
      ctx.moveTo(position, 0); ctx.lineTo(position, this.width);
      ctx.moveTo(0, position); ctx.lineTo(this.width, position);
    }
    ctx.stroke();
    if (this.editable && this.hover) {
      const { x, y } = this.hover;
      const fits = !this.pattern || this.simulation.fits(this.pattern, x, y);
      ctx.fillStyle = fits ? '#b4f27260' : '#ff897b70';
      const cells = this.pattern?.cells || [[0, 0]];
      for (const [dx, dy] of cells) if (this.simulation.contains(x + dx, y + dy)) {
        ctx.fillRect((x + dx) * cellSize + gap, (y + dy) * cellSize + gap, cellSize - 2 * gap, cellSize - 2 * gap);
      }
      ctx.strokeStyle = fits ? '#d3ff9b' : '#ff897b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * cellSize + 0.5, y * cellSize + 0.5, Math.min(this.pattern?.width || 1, size - x) * cellSize - 1, Math.min(this.pattern?.height || 1, size - y) * cellSize - 1);
    }
  }
}
