/**
 * Synthesizer 6: Modal & Chladni Resonator Synthesis
 * High stability, anti-denormal protected parallel Biquad filter bank.
 */
import { ADSREnvelope, TWO_PI, antiDenormal } from '../DSPUtils.js';

export class ModalSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Modal & Chladni Plates';
    this.type = 'modal';

    this.modelType = 'plate';
    this.numModes = 12;

    this.w1 = new Float32Array(this.numModes);
    this.w2 = new Float32Array(this.numModes);
    
    this.modeRatios = [1.0, 1.59, 2.14, 2.30, 2.65, 2.92, 3.16, 3.50, 4.06, 4.15, 4.88, 5.22];
    this.modeGains = [1.0, 0.8, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.08];
    this.modeDecays = [1.0, 0.85, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25];

    this.material = 'metal';
    this.structure = 0.5;
    this.decayTime = 2.5;

    this.impulse = 0.0;
    this.freq = 330.0;
    this.active = false;

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.001, 2.5, 0.0, 0.5);
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
  }

  setModel(type) {
    this.modelType = type;
    if (type === 'bell') {
      this.modeRatios = [0.5, 1.0, 1.19, 1.5, 2.0, 2.74, 3.0, 3.76, 4.07, 5.12, 6.2, 7.8];
      this.decayTime = 3.5;
    } else if (type === 'bar') {
      this.modeRatios = [1.0, 2.756, 5.404, 8.933, 13.34, 18.64, 24.8, 31.8, 39.7, 48.5, 58.2, 68.8];
      this.decayTime = 1.8;
    } else if (type === 'membrane') {
      this.modeRatios = [1.0, 1.593, 2.135, 2.295, 2.653, 2.917, 3.155, 3.500, 3.600, 4.059, 4.154, 4.600];
      this.decayTime = 1.2;
    } else {
      this.modeRatios = [1.0, 1.59, 2.14, 2.30, 2.65, 2.92, 3.16, 3.50, 4.06, 4.15, 4.88, 5.22];
      this.decayTime = 2.5;
    }
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.impulse = velocity;
    this.w1.fill(0);
    this.w2.fill(0);
    this.ampEnv.setParameters(0.001, this.decayTime, 0.0, 0.3);
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    let output = 0.0;
    const exc = this.impulse;
    this.impulse = 0.0;

    for (let m = 0; m < this.numModes; m++) {
      const modeFreq = Math.min(this.sampleRate * 0.48, this.freq * this.modeRatios[m] * (1.0 + (this.structure - 0.5) * 0.4));
      const q = Math.max(10.0, (modeFreq * this.decayTime * this.modeDecays[m]) / 3.0);
      
      const w0 = TWO_PI * (modeFreq / this.sampleRate);
      const alpha = Math.sin(w0) / (2.0 * q);
      const cos_w0 = Math.cos(w0);

      const b0 = alpha;
      const b1 = 0.0;
      const b2 = -alpha;
      const a0 = 1.0 + alpha;
      const a1 = -2.0 * cos_w0;
      const a2 = 1.0 - alpha;

      const x = exc * this.modeGains[m];
      const y = (b0 * x + this.w1[m]) / a0;
      this.w1[m] = antiDenormal(b1 * x - a1 * y + this.w2[m]);
      this.w2[m] = antiDenormal(b2 * x - a2 * y);

      output += y;
    }

    const env = this.ampEnv.process();
    return output * env;
  }

  getMathTelemetry() {
    const modeEnergies = [];
    for (let m = 0; m < this.numModes; m++) {
      modeEnergies.push(Math.abs(this.w1[m]));
    }

    return {
      type: 'modal',
      modelType: this.modelType,
      freq: this.freq,
      modeRatios: this.modeRatios,
      modeEnergies: modeEnergies,
      decayTime: this.decayTime,
      amp: this.ampEnv.value
    };
  }
}
