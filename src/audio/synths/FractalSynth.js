/**
 * Synthesizer 15: Fractal Julia & Mandelbrot Orbit Synth
 * Audio-rate complex plane iteration z_{n+1} = z_n^2 + c with escape-time spectral resynthesis.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class FractalSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Fractal Julia & Mandelbrot Orbit';
    this.type = 'fractal';

    // Complex parameters (15 parameters)
    this.cr = -0.7; // Julia Real Constant
    this.ci = 0.27015; // Julia Imag Constant
    this.zoom = 1.2; // Fractal zoom factor
    this.maxIter = 12; // Maximum iterations per sample
    this.escapeRadius = 4.0;
    this.complexPhase = 0.0;
    this.foldSmoothing = 0.6;
    this.sineBlend = 0.3; // Blend with pure trigonometric base
    this.chaosMod = 0.25; // Dynamic orbit modulation
    this.subHarmonic = 0.4; // Sub-harmonic octave generator
    this.drive = 0.3;
    this.filterCutoff = 6000;
    this.filterRes = 1.4;

    this.phase = 0.0;
    this.subPhase = 0.0;
    this.lastZr = 0.0;
    this.lastZi = 0.0;
    this.lastEscape = 0;

    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.3, 0.6, 0.4);
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
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const dt = this.freq / this.sampleRate;
    this.phase = (this.phase + dt) % 1.0;
    this.subPhase = (this.subPhase + dt * 0.5) % 1.0;

    // Map audio phase to circular path on complex plane z_0
    const angle = this.phase * TWO_PI + this.complexPhase;
    const r = (1.0 / this.zoom);
    let zr = Math.cos(angle) * r;
    let zi = Math.sin(angle) * r;

    // Dynamic Julia parameter with chaos mod
    const c_r = this.cr + Math.sin(this.phase * Math.PI) * this.chaosMod * 0.1;
    const c_i = this.ci + Math.cos(this.phase * Math.PI) * this.chaosMod * 0.1;

    let iter = 0;
    const r2_limit = this.escapeRadius * this.escapeRadius;

    // Julia iteration loop: z = z^2 + c
    while (iter < this.maxIter && (zr * zr + zi * zi) < r2_limit) {
      const new_zr = zr * zr - zi * zi + c_r;
      const new_zi = 2.0 * zr * zi + c_i;
      zr = new_zr;
      zi = new_zi;
      iter++;
    }

    this.lastZr = zr;
    this.lastZi = zi;
    this.lastEscape = iter;

    // Normalize escape potential: continuous smooth coloring formula
    const mag = Math.sqrt(zr * zr + zi * zi) + 1e-6;
    const smoothVal = iter - Math.log2(Math.max(1.0, Math.log2(mag)));
    let normOut = (smoothVal / this.maxIter) * 2.0 - 1.0;

    // Fold & blend with smooth sinusoidal base and sub-harmonic
    normOut = fastTanh(normOut * (1.0 + this.drive * 3.0));
    const subOsc = fastSin(this.subPhase * TWO_PI) * this.subHarmonic;
    const sineBase = fastSin(this.phase * TWO_PI);

    let output = normOut * (1.0 - this.sineBlend) + sineBase * this.sineBlend + subOsc;

    // Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    output = this.filter.process(output).lp;

    const env = this.ampEnv.process();
    return output * env * (this.velocity || 1.0) * 0.5;
  }

  getMathTelemetry() {
    return {
      type: 'fractal',
      cr: this.cr,
      ci: this.ci,
      zoom: this.zoom,
      maxIter: this.maxIter,
      lastZr: this.lastZr,
      lastZi: this.lastZi,
      lastEscape: this.lastEscape,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
