/** A finite square world. Each generation is computed into a fresh buffer. */
export class Simulation {
  constructor(size = 50) {
    if (!Number.isInteger(size) || size < 1 || size > 200) throw new RangeError('Grid size must be an integer from 1 to 200.');
    this.size = size;
    this.cells = new Uint8Array(size * size);
    this.generation = 0;
  }

  contains(x, y) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  get(x, y) { return this.contains(x, y) ? this.cells[y * this.size + x] : 0; }

  set(x, y, alive) {
    if (this.contains(x, y)) this.cells[y * this.size + x] = alive ? 1 : 0;
  }

  get population() { return this.cells.reduce((total, alive) => total + alive, 0); }

  step() {
    const next = new Uint8Array(this.cells.length);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx || dy) neighbors += this.get(x + dx, y + dy);
          }
        }
        next[y * this.size + x] = neighbors === 3 || (neighbors === 2 && this.get(x, y)) ? 1 : 0;
      }
    }
    this.cells = next;
    this.generation++;
  }

  clear() {
    this.cells = new Uint8Array(this.size * this.size);
    this.generation = 0;
  }

  randomize(density = 0.25, random = Math.random) {
    if (density < 0 || density > 1) throw new RangeError('Density must be between zero and one.');
    this.cells = Uint8Array.from(this.cells, () => random() < density ? 1 : 0);
    this.generation = 0;
  }

  fits(pattern, x, y) {
    return this.contains(x, y) && x + pattern.width <= this.size && y + pattern.height <= this.size;
  }

  place(pattern, x, y) {
    if (!this.fits(pattern, x, y)) return false;
    // Replace only the pattern's rectangular footprint; preserve everything outside it.
    for (let dy = 0; dy < pattern.height; dy++) {
      for (let dx = 0; dx < pattern.width; dx++) this.set(x + dx, y + dy, false);
    }
    for (const [dx, dy] of pattern.cells) this.set(x + dx, y + dy, true);
    return true;
  }
}
