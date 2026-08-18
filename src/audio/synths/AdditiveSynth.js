/**
 * Synthesizer 7: Additive & Spectral Resynthesis
 * Optimized with fast table lookups and early sleep exit.
 */
import { ADSREnvelope, fastSin, TWO_PI } from '../DSPUtils.js';

export class AdditiveSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Additive & Harmonic Partial Bank';
    this.type = 'additive';

    this.numPartials = 32;
    this.phases = new Float32Array(this.numPartials);
    this.partialGains = new Float32Array(this.numPartials);
    this.initHarmonics();

    this.spectralSlope = -1.2;
    this.inharmonicity = 0.0;
    this.oddEvenBalance = 0.5;
    this.phaseSpread = 0.0;

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.02, 0.3, 0.6, 0.4);

    this.freq = 220.0;
    this.active = false;
  }

  initHarmonics() {
    for (let k = 0; k < this.numPartials; k++) {
      const harmonicNum = k + 1;
      this.partialGains[k] = Math.pow(harmonicNum, this.spectralSlope || -1.0);
    }
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;

    for (let k = 0; k < this.numPartials; k++) {
      this.phases[k] = this.phaseSpread * Math.random();
    }
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    let output = 0.0;
    const b = this.inharmonicity * 0.005;
    const nyquist = this.sampleRate * 0.48;

    for (let k = 0; k < this.numPartials; k++) {
      const h = k + 1;
      const partialFreq = this.freq * h * Math.sqrt(1.0 + b * h * h);
      if (partialFreq >= nyquist) continue;

      const dt = partialFreq / this.sampleRate;
      this.phases[k] = (this.phases[k] + dt) % 1.0;

      const isEven = (h % 2 === 0);
      const parityWeight = isEven ? (1.0 - this.oddEvenBalance) * 2.0 : this.oddEvenBalance * 2.0;

      const gain = Math.pow(h, this.spectralSlope) * parityWeight;
      output += fastSin(this.phases[k]) * gain;
    }

    const amp = this.ampEnv.process();
    return output * amp * 0.35 * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    const partialsData = [];
    const b = this.inharmonicity * 0.005;
    for (let k = 0; k < Math.min(16, this.numPartials); k++) {
      const h = k + 1;
      const f = this.freq * h * Math.sqrt(1.0 + b * h * h);
      const isEven = (h % 2 === 0);
      const parityWeight = isEven ? (1.0 - this.oddEvenBalance) * 2.0 : this.oddEvenBalance * 2.0;
      const a = Math.pow(h, this.spectralSlope) * parityWeight * this.ampEnv.value;
      partialsData.push({
        harmonic: h,
        freq: f,
        amp: a,
        phase: this.phases[k] * TWO_PI
      });
    }

    return {
      type: 'additive',
      freq: this.freq,
      spectralSlope: this.spectralSlope,
      inharmonicity: this.inharmonicity,
      partials: partialsData,
      amp: this.ampEnv.value
    };
  }
}
