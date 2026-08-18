/**
 * Synthesizer 9: Formant & Vocal Tract Synthesizer (FOF Model)
 * Simulates human vowel acoustics and vocal tract resonances via 5 parallel resonant filters.
 */
import { ADSREnvelope, TWO_PI, polyBLEP } from '../DSPUtils.js';

export class FormantSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Formant & Vocal Tract';
    this.type = 'formant';

    this.vowel = 'A'; // 'A', 'E', 'I', 'O', 'U'
    this.vowelMorph = 0.0; // 0.0 to 4.0 continuous interpolation between A-E-I-O-U

    // Formant Frequencies (Hz) for standard male/female vowels (F1, F2, F3, F4, F5)
    this.vowelTable = {
      'A': { f: [800, 1200, 2500, 3500, 4500], bw: [80, 90, 120, 150, 200], g: [1.0, 0.5, 0.25, 0.1, 0.05] },
      'E': { f: [400, 2200, 2800, 3600, 4500], bw: [70, 100, 120, 150, 200], g: [1.0, 0.4, 0.2, 0.1, 0.05] },
      'I': { f: [280, 2300, 3000, 3700, 4500], bw: [60, 90, 100, 150, 200], g: [1.0, 0.35, 0.15, 0.08, 0.05] },
      'O': { f: [500, 850, 2400, 3400, 4500], bw: [70, 80, 100, 140, 200], g: [1.0, 0.6, 0.2, 0.08, 0.05] },
      'U': { f: [350, 650, 2300, 3300, 4500], bw: [60, 70, 90, 130, 200], g: [1.0, 0.4, 0.15, 0.05, 0.03] }
    };

    // Filter memory for 5 Biquad Bandpasses
    this.w1 = new Float32Array(5);
    this.w2 = new Float32Array(5);

    // Glottal Pulse Generator (Rosenberg Glottal Waveform)
    this.glottalPhase = 0.0;
    this.openQuotient = 0.6; // Glottal opening ratio

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.03, 0.2, 0.8, 0.35);

    this.freq = 130.81; // C3
    this.active = false;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  /**
   * Generates a Rosenberg glottal pulse (natural vocal cord airflow)
   */
  getGlottalSample(dt) {
    let pulse = 0.0;
    if (this.glottalPhase < this.openQuotient) {
      const p = this.glottalPhase / this.openQuotient;
      pulse = 0.5 * (1.0 - Math.cos(Math.PI * p)) - Math.sin(Math.PI * p * 0.5) * 0.3;
    } else {
      // Glottal closing abrupt cutoff
      const p = (this.glottalPhase - this.openQuotient) / (1.0 - this.openQuotient);
      pulse = Math.exp(-p * 8.0) * 0.2;
    }
    // Anti-alias glottal edge
    pulse += polyBLEP(this.glottalPhase, dt);
    this.glottalPhase = (this.glottalPhase + dt) % 1.0;
    return pulse;
  }

  getCurrentFormants() {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const idx0 = Math.floor(this.vowelMorph) % 5;
    const idx1 = (idx0 + 1) % 5;
    const frac = this.vowelMorph - Math.floor(this.vowelMorph);

    const v0 = this.vowelTable[vowels[idx0]];
    const v1 = this.vowelTable[vowels[idx1]];

    const formants = { f: [], bw: [], g: [] };
    for (let i = 0; i < 5; i++) {
      formants.f.push(v0.f[i] * (1.0 - frac) + v1.f[i] * frac);
      formants.bw.push(v0.bw[i] * (1.0 - frac) + v1.bw[i] * frac);
      formants.g.push(v0.g[i] * (1.0 - frac) + v1.g[i] * frac);
    }
    return formants;
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const dt = this.freq / this.sampleRate;
    const excitation = this.getGlottalSample(dt);
    const formants = this.getCurrentFormants();

    let output = 0.0;

    for (let i = 0; i < 5; i++) {
      const f0 = Math.min(this.sampleRate * 0.48, formants.f[i]);
      const q = Math.max(2.0, f0 / formants.bw[i]);

      const w0 = TWO_PI * (f0 / this.sampleRate);
      const alpha = Math.sin(w0) / (2.0 * q);
      const cos_w0 = Math.cos(w0);

      const b0 = alpha;
      const b1 = 0.0;
      const b2 = -alpha;
      const a0 = 1.0 + alpha;
      const a1 = -2.0 * cos_w0;
      const a2 = 1.0 - alpha;

      const x = excitation * formants.g[i];
      const y = (b0 * x + this.w1[i]) / a0;
      this.w1[i] = b1 * x - a1 * y + this.w2[i];
      this.w2[i] = b2 * x - a2 * y;

      output += y;
    }

    const amp = this.ampEnv.process();
    return output * amp * 0.7 * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    const formants = this.getCurrentFormants();
    return {
      type: 'formant',
      freq: this.freq,
      vowelMorph: this.vowelMorph,
      f1: formants.f[0],
      f2: formants.f[1],
      f3: formants.f[2],
      f4: formants.f[3],
      amp: this.ampEnv.value
    };
  }
}
