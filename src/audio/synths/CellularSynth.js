/**
 * Synthesizer 13: Cellular Automata Synth (Wolfram 1D & Conway 2D)
 * Audio-rate and clock-rate cellular state evolution producing organic, evolving harmonic pulses.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class CellularSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Cellular Automata (Wolfram & Life)';
    this.type = 'cellular';

    this.gridSize = 32;
    this.cells = new Uint8Array(this.gridSize);
    this.nextCells = new Uint8Array(this.gridSize);
    this.rule = 110; // Wolfram Rule 110 (Turing complete / chaotic order)
    this.mode = 'wolfram'; // 'wolfram' | 'life'
    
    // 2D grid for life mode (8x8 = 64)
    this.grid2D = new Uint8Array(64);
    this.nextGrid2D = new Uint8Array(64);

    // Parameters (14 distinct parameters)
    this.clockRate = 80.0; // Clock rate in Hz (or multiplier)
    this.mutationProb = 0.02; // Random mutation chance
    this.bitShift = 2; // Output bit selection
    this.pulseWidth = 0.5; // Pulse duty cycle
    this.chaosBias = 0.3; // Random seed bias
    this.feedbackRes = 0.4; // Harmonic feedback
    this.scaleQuantize = 1.0; // Harmonic alignment
    this.stereoSpread = 0.6;
    this.drive = 0.2;
    this.filterCutoff = 4500;
    this.filterRes = 1.5;

    this.phase = 0.0;
    this.clockPhase = 0.0;
    this.lastOut = 0.0;
    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.25, 0.7, 0.35);

    this.seedGrid();
  }

  seedGrid() {
    for (let i = 0; i < this.gridSize; i++) {
      this.cells[i] = Math.random() < this.chaosBias ? 1 : 0;
    }
    this.cells[Math.floor(this.gridSize / 2)] = 1;

    for (let i = 0; i < 64; i++) {
      this.grid2D[i] = Math.random() < this.chaosBias ? 1 : 0;
    }
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.filter.setSampleRate(sr);
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.seedGrid();
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  stepWolfram() {
    const r = this.rule;
    const n = this.gridSize;
    for (let i = 0; i < n; i++) {
      const left = this.cells[(i - 1 + n) % n];
      const self = this.cells[i];
      const right = this.cells[(i + 1) % n];
      const neighborhood = (left << 2) | (self << 1) | right;
      
      let nextState = (r >> neighborhood) & 1;
      if (Math.random() < this.mutationProb) {
        nextState ^= 1;
      }
      this.nextCells[i] = nextState;
    }
    this.cells.set(this.nextCells);
  }

  stepLife() {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + 8) % 8;
            const ny = (y + dy + 8) % 8;
            neighbors += this.grid2D[ny * 8 + nx];
          }
        }
        const idx = y * 8 + x;
        const current = this.grid2D[idx];
        let next = 0;
        if (current === 1 && (neighbors === 2 || neighbors === 3)) next = 1;
        else if (current === 0 && neighbors === 3) next = 1;

        if (Math.random() < this.mutationProb) next ^= 1;
        this.nextGrid2D[idx] = next;
      }
    }
    this.grid2D.set(this.nextGrid2D);
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    // Clock step for automaton evolution
    const effectiveClockRate = (this.freq * 0.5) + this.clockRate;
    const clockDt = effectiveClockRate / this.sampleRate;
    this.clockPhase += clockDt;
    if (this.clockPhase >= 1.0) {
      this.clockPhase -= 1.0;
      if (this.mode === 'life') {
        this.stepLife();
      } else {
        this.stepWolfram();
      }
    }

    // Audio-rate phase accumulation & cell scanning
    const dt = this.freq / this.sampleRate;
    this.phase = (this.phase + dt) % 1.0;

    // Scan through active cells
    const cellIdx = Math.floor(this.phase * this.gridSize) % this.gridSize;
    const cellVal = this.cells[cellIdx];

    // Multi-tap bit extraction
    let rawSample = cellVal ? 1.0 : -1.0;
    if (this.pulseWidth !== 0.5) {
      const subPhase = (this.phase * this.gridSize) % 1.0;
      rawSample *= (subPhase < this.pulseWidth ? 1.0 : -0.6);
    }

    // Cellular superposition
    let sumWeight = 0;
    for (let k = 1; k <= 4; k++) {
      const neighborIdx = (cellIdx + k * this.bitShift) % this.gridSize;
      if (this.cells[neighborIdx]) {
        sumWeight += 0.25 / k;
      }
    }
    rawSample += sumWeight * fastSin(this.phase * TWO_PI * this.scaleQuantize);

    // Feedback & Wavefold
    rawSample += this.lastOut * this.feedbackRes;
    let signal = fastTanh(rawSample * (1.0 + this.drive * 4.0));
    this.lastOut = signal * 0.5;

    // Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    signal = this.filter.process(signal).lp;

    const env = this.ampEnv.process();
    return signal * env * (this.velocity || 1.0) * 0.55;
  }

  getMathTelemetry() {
    let activeCount = 0;
    for (let i = 0; i < this.gridSize; i++) {
      if (this.cells[i]) activeCount++;
    }

    return {
      type: 'cellular',
      rule: this.rule,
      mode: this.mode,
      gridSize: this.gridSize,
      cells: Array.from(this.cells),
      activeCount: activeCount,
      activeRatio: activeCount / this.gridSize,
      clockRate: this.clockRate,
      mutationProb: this.mutationProb,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
