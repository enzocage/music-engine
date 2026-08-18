/**
 * Synthesizer 17: Stochastic Gendyn Particle Synth
 * Iannis Xenakis Dynamic Stochastic Synthesis (GENDY) with elastic mirror boundaries.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class StochasticGendynSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Stochastic Gendyn (Xenakis)';
    this.type = 'stochasticgendyn';

    this.maxPoints = 16;
    this.numPoints = 8;
    this.xPoints = new Float32Array(this.maxPoints); // Time deltas
    this.yPoints = new Float32Array(this.maxPoints); // Amplitude values

    // Parameters (16 parameters)
    this.stepSizeTime = 0.08;
    this.stepSizeAmp = 0.15;
    this.barrierMin = -0.9;
    this.barrierMax = 0.9;
    this.distType = 'cauchy'; // 'cauchy' | 'gauss' | 'uniform'
    this.memoryInertia = 0.3; // Momentum of random walk
    this.microJitter = 0.1;
    this.syncMode = 'pitch'; // 'pitch' | 'free'
    this.ringModFreq = 0.0;
    this.drive = 0.2;
    this.filterCutoff = 4800;
    this.filterRes = 1.8;

    this.currentSeg = 0;
    this.segPhase = 0.0;
    this.lastDx = new Float32Array(this.maxPoints);
    this.lastDy = new Float32Array(this.maxPoints);

    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.25, 0.65, 0.3);

    this.initBreakpoints();
  }

  initBreakpoints() {
    for (let i = 0; i < this.maxPoints; i++) {
      this.xPoints[i] = 1.0 / this.numPoints;
      this.yPoints[i] = (Math.random() * 2.0 - 1.0) * 0.7;
      this.lastDx[i] = 0.0;
      this.lastDy[i] = 0.0;
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
    this.currentSeg = 0;
    this.segPhase = 0.0;
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  // Stochastic distribution generator
  getRandomStep() {
    if (this.distType === 'cauchy') {
      // Cauchy distribution: x = tan(pi * (u - 0.5))
      const u = Math.random() * 0.96 + 0.02;
      return Math.tan(Math.PI * (u - 0.5)) * 0.3;
    } else if (this.distType === 'gauss') {
      // Box-Muller Gaussian
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(TWO_PI * u2) * 0.5;
    }
    // Uniform
    return Math.random() * 2.0 - 1.0;
  }

  // Random walk with elastic mirror reflection
  updateStochasticWalk() {
    const k = this.currentSeg;
    
    // Time delta walk
    let dx = this.getRandomStep() * this.stepSizeTime;
    dx = dx * (1.0 - this.memoryInertia) + this.lastDx[k] * this.memoryInertia;
    this.lastDx[k] = dx;
    this.xPoints[k] += dx;
    // Elastic barrier on segment duration
    if (this.xPoints[k] < 0.02) this.xPoints[k] = 0.02 + Math.abs(dx);
    if (this.xPoints[k] > 0.4) this.xPoints[k] = 0.4 - Math.abs(dx);

    // Amplitude walk
    let dy = this.getRandomStep() * this.stepSizeAmp;
    dy = dy * (1.0 - this.memoryInertia) + this.lastDy[k] * this.memoryInertia;
    this.lastDy[k] = dy;
    this.yPoints[k] += dy;

    // Elastic mirror reflection at boundaries
    if (this.yPoints[k] > this.barrierMax) {
      this.yPoints[k] = 2.0 * this.barrierMax - this.yPoints[k];
      this.lastDy[k] = -this.lastDy[k];
    } else if (this.yPoints[k] < this.barrierMin) {
      this.yPoints[k] = 2.0 * this.barrierMin - this.yPoints[k];
      this.lastDy[k] = -this.lastDy[k];
    }
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const basePitch = (this.freq / this.sampleRate) * this.numPoints;
    const segDuration = Math.max(0.01, this.xPoints[this.currentSeg]);
    const dt = basePitch / segDuration;

    this.segPhase += dt;

    if (this.segPhase >= 1.0) {
      this.segPhase -= 1.0;
      this.updateStochasticWalk();
      this.currentSeg = (this.currentSeg + 1) % this.numPoints;
    }

    // Linear interpolation between current and next breakpoint
    const nextSeg = (this.currentSeg + 1) % this.numPoints;
    const y0 = this.yPoints[this.currentSeg];
    const y1 = this.yPoints[nextSeg];
    let sample = y0 + this.segPhase * (y1 - y0);

    // Ring modulation if active
    if (this.ringModFreq > 1.0) {
      const rmPhase = (this.currentSeg / this.numPoints + this.segPhase) * TWO_PI * this.ringModFreq * 0.05;
      sample *= fastSin(rmPhase);
    }

    sample = fastTanh(sample * (1.0 + this.drive * 3.0));

    // ZDF Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    const output = this.filter.process(sample).lp;

    const env = this.ampEnv.process();
    return output * env * (this.velocity || 1.0) * 0.6;
  }

  getMathTelemetry() {
    return {
      type: 'stochasticgendyn',
      numPoints: this.numPoints,
      currentSeg: this.currentSeg,
      xPoints: Array.from(this.xPoints.slice(0, this.numPoints)),
      yPoints: Array.from(this.yPoints.slice(0, this.numPoints)),
      barrierMin: this.barrierMin,
      barrierMax: this.barrierMax,
      distType: this.distType,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
