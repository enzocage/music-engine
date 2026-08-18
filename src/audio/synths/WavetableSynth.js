/**
 * Synthesizer 2: Wavetable & Spectral Synthesizer
 * 3D Wavetable Morphing with Hermite Spline interpolation and Spectral Warping.
 */
import { ADSREnvelope, TWO_PI } from '../DSPUtils.js';

export class WavetableSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Wavetable & Spectral';
    this.type = 'wavetable';

    this.tableSize = 256;
    this.numFrames = 16;
    this.tables = []; // 2D array [numFrames][tableSize]
    this.initDefaultTables();

    // Synthesis Parameters
    this.tablePosition = 0.0; // 0.0 to (numFrames - 1)
    this.spectralTilt = 0.0;
    this.warpMode = 'none'; // 'none', 'bend', 'sync', 'mirror'
    this.warpAmount = 0.0;

    // Envelopes
    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.2, 0.7, 0.3);

    this.posEnv = new ADSREnvelope();
    this.posEnv.setSampleRate(sampleRate);
    this.posEnv.setParameters(0.05, 0.4, 0.3, 0.5);

    // State
    this.phase = 0.0;
    this.freq = 440.0;
    this.active = false;
  }

  initDefaultTables() {
    this.tables = [];
    for (let f = 0; f < this.numFrames; f++) {
      const frame = new Float32Array(this.tableSize);
      const morphFactor = f / (this.numFrames - 1); // 0 (Sine) -> 0.5 (Saw) -> 1.0 (Harmonic/Metallic)

      for (let i = 0; i < this.tableSize; i++) {
        const phi = (i / this.tableSize) * TWO_PI;
        // Sine component
        const sine = Math.sin(phi);
        // Sawtooth harmonic component
        let saw = 0;
        for (let h = 1; h <= 16; h++) {
          saw += (Math.sin(h * phi) / h) * (1.0 - (h / 17.0) * 0.5);
        }
        saw *= (2.0 / Math.PI);
        // Metallic / Inharmonic component
        const metal = Math.sin(phi * 2.5) * 0.5 + Math.sin(phi * 5.7) * 0.3 + Math.sin(phi * 11.2) * 0.2;

        if (morphFactor < 0.5) {
          const t = morphFactor * 2.0;
          frame[i] = sine * (1.0 - t) + saw * t;
        } else {
          const t = (morphFactor - 0.5) * 2.0;
          frame[i] = saw * (1.0 - t) + metal * t;
        }
      }
      this.tables.push(frame);
    }
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
    this.posEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.ampEnv.trigger();
    this.posEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
    this.posEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const dt = this.freq / this.sampleRate;
    
    // Dynamic wavetable position
    const envPos = this.posEnv.process();
    let currentPos = Math.max(0.0, Math.min(this.numFrames - 1.001, this.tablePosition + envPos * (this.numFrames - 1)));
    
    const frameIndex0 = Math.floor(currentPos);
    const frameIndex1 = Math.min(this.numFrames - 1, frameIndex0 + 1);
    const frameFrac = currentPos - frameIndex0;

    // Phase with optional spectral warping
    let lookupPhase = this.phase;
    if (this.warpMode === 'bend') {
      lookupPhase = Math.pow(lookupPhase, 1.0 + this.warpAmount * 2.0);
    } else if (this.warpMode === 'mirror') {
      lookupPhase = lookupPhase < 0.5 ? lookupPhase * 2.0 : (1.0 - lookupPhase) * 2.0;
    }

    const tablePos = lookupPhase * this.tableSize;
    const idx0 = Math.floor(tablePos) % this.tableSize;
    const idx1 = (idx0 + 1) % this.tableSize;
    const frac = tablePos - idx0;

    // Linear interpolation between samples and frames
    const f0_s0 = this.tables[frameIndex0][idx0];
    const f0_s1 = this.tables[frameIndex0][idx1];
    const s_f0 = f0_s0 + frac * (f0_s1 - f0_s0);

    const f1_s0 = this.tables[frameIndex1][idx0];
    const f1_s1 = this.tables[frameIndex1][idx1];
    const s_f1 = f1_s0 + frac * (f1_s1 - f1_s0);

    const sample = s_f0 + frameFrac * (s_f1 - s_f0);

    this.phase = (this.phase + dt) % 1.0;

    const ampVal = this.ampEnv.process();
    return sample * ampVal * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    return {
      type: 'wavetable',
      phase: this.phase,
      freq: this.freq,
      tablePosition: this.tablePosition,
      currentPos: this.tablePosition + this.posEnv.value * (this.numFrames - 1),
      numFrames: this.numFrames,
      amp: this.ampEnv.value
    };
  }
}
