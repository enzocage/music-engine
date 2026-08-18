/**
 * Synthesizer 3: 6-Operator Phase Modulation (FM/PM)
 * Zero-allocation processing with fast trigonometric lookups.
 */
import { ADSREnvelope, fastSin, besselJ } from '../DSPUtils.js';

export class FMSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = '6-Operator FM/PM';
    this.type = 'fm';

    this.numOps = 6;
    this.algorithm = 1;

    this.ops = [
      { ratio: 1.0, level: 1.0, detune: 0.0, feedback: 0.0, isCarrier: true },
      { ratio: 2.0, level: 0.8, detune: 0.002, feedback: 0.3, isCarrier: false },
      { ratio: 3.0, level: 0.4, detune: -0.003, feedback: 0.0, isCarrier: false },
      { ratio: 1.0, level: 0.0, detune: 0.0, feedback: 0.0, isCarrier: false },
      { ratio: 4.0, level: 0.0, detune: 0.0, feedback: 0.0, isCarrier: false },
      { ratio: 7.0, level: 0.0, detune: 0.0, feedback: 0.0, isCarrier: false }
    ];

    this.opEnvs = [];
    for (let i = 0; i < this.numOps; i++) {
      const env = new ADSREnvelope();
      env.setSampleRate(sampleRate);
      env.setParameters(0.01 + i * 0.02, 0.2 + i * 0.1, Math.max(0.1, 0.8 - i * 0.15), 0.3 + i * 0.1);
      this.opEnvs.push(env);
    }

    this.phases = new Float32Array(this.numOps);
    this.fb0 = new Float32Array(this.numOps);
    this.fb1 = new Float32Array(this.numOps);
    this.opOutputs = new Float32Array(this.numOps);
    this.freq = 440.0;
    this.active = false;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.opEnvs.forEach(env => env.setSampleRate(sr));
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.opEnvs.forEach(env => env.trigger());
  }

  noteOff() {
    this.opEnvs.forEach(env => env.releaseNote());
  }

  process() {
    if (!this.active && !this.opEnvs[0].isActive()) return 0.0;

    // Op 6
    const env6 = this.opEnvs[5].process();
    const dt6 = (this.freq * this.ops[5].ratio + this.ops[5].detune) / this.sampleRate;
    const fb6 = (this.fb0[5] + this.fb1[5]) * 0.25 * this.ops[5].feedback;
    const out6 = fastSin(this.phases[5] + fb6) * this.ops[5].level * env6;
    this.fb1[5] = this.fb0[5];
    this.fb0[5] = out6;
    this.phases[5] = (this.phases[5] + dt6) % 1.0;
    this.opOutputs[5] = out6;

    // Op 5
    const env5 = this.opEnvs[4].process();
    const dt5 = (this.freq * this.ops[4].ratio + this.ops[4].detune) / this.sampleRate;
    const out5 = fastSin(this.phases[4] + out6) * this.ops[4].level * env5;
    this.phases[4] = (this.phases[4] + dt5) % 1.0;
    this.opOutputs[4] = out5;

    // Op 4
    const env4 = this.opEnvs[3].process();
    const dt4 = (this.freq * this.ops[3].ratio + this.ops[3].detune) / this.sampleRate;
    const out4 = fastSin(this.phases[3]) * this.ops[3].level * env4;
    this.phases[3] = (this.phases[3] + dt4) % 1.0;
    this.opOutputs[3] = out4;

    // Op 3
    const env3 = this.opEnvs[2].process();
    const dt3 = (this.freq * this.ops[2].ratio + this.ops[2].detune) / this.sampleRate;
    const out3 = fastSin(this.phases[2] + out4) * this.ops[2].level * env3;
    this.phases[2] = (this.phases[2] + dt3) % 1.0;
    this.opOutputs[2] = out3;

    // Op 2
    const env2 = this.opEnvs[1].process();
    const dt2 = (this.freq * this.ops[1].ratio + this.ops[1].detune) / this.sampleRate;
    const fb2 = (this.fb0[1] + this.fb1[1]) * 0.25 * this.ops[1].feedback;
    const out2 = fastSin(this.phases[1] + out3 + out5 + fb2) * this.ops[1].level * env2;
    this.fb1[1] = this.fb0[1];
    this.fb0[1] = out2;
    this.phases[1] = (this.phases[1] + dt2) % 1.0;
    this.opOutputs[1] = out2;

    // Op 1 (Carrier)
    const env1 = this.opEnvs[0].process();
    const dt1 = (this.freq * this.ops[0].ratio + this.ops[0].detune) / this.sampleRate;
    const out1 = fastSin(this.phases[0] + out2 * 1.25) * this.ops[0].level * env1;
    this.phases[0] = (this.phases[0] + dt1) % 1.0;
    this.opOutputs[0] = out1;

    return out1 * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    const modIndex = this.ops[1].level * this.opEnvs[1].value * 2.5;
    const besselHarmonics = [];
    for (let n = 0; n <= 6; n++) {
      besselHarmonics.push(besselJ(n, modIndex));
    }

    return {
      type: 'fm',
      phases: Array.from(this.phases),
      opOutputs: Array.from(this.opOutputs),
      freq: this.freq,
      carrierFreq: this.freq * this.ops[0].ratio,
      modulatorFreq: this.freq * this.ops[1].ratio,
      modIndex: modIndex,
      besselHarmonics: besselHarmonics,
      amp: this.opEnvs[0].value
    };
  }
}
