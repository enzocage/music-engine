/**
 * Synthesizer 12: Bytebeat & Algorithmic Bitwise Synthesis
 * One-line bitwise mathematical expressions evaluated continuously with 32-bit phase accumulators.
 */
import { ADSREnvelope } from '../DSPUtils.js';

export class BytebeatSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Bytebeat & Algorithmic Math';
    this.type = 'bytebeat';

    this.formulaId = 0; // 0 to 4 classic equations
    this.t = 0; // Discrete time accumulator
    this.tStep = 1;
    this.sampleRateDiv = 44100 / 8000; // Bytebeat usually native at 8kHz or 16kHz

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.2, 0.7, 0.25);

    this.freq = 440.0;
    this.active = false;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.sampleRateDiv = sr / 8000;
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    // Step size tuned to input pitch
    this.tStep = Math.max(1, Math.round(freq / 55.0));
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  evaluateFormula(t) {
    switch (this.formulaId) {
      case 0:
        // Classic Crowell melodic equation: (t*(t>>12|t>>8)&63&t>>4)
        return (t * ((t >> 12 | t >> 8) & 63 & t >> 4)) & 255;
      case 1:
        // Rhythmic Chiptune: (t*5&(t>>7))|(t*3&(t*4>>10))
        return ((t * 5 & (t >> 7)) | (t * 3 & (t * 4 >> 10))) & 255;
      case 2:
        // Harmonic Arpeggio: (t>>6|t|t>>(t>>16))*10+((t>>11)&7)
        return ((t >> 6 | t | t >> (t >> 16)) * 10 + ((t >> 11) & 7)) & 255;
      case 3:
        // Sierpinski Harmony: (t*(t>>9|t>>13)&16)
        return ((t * (t >> 9 | t >> 13) & 16) * 15) & 255;
      case 4:
      default:
        // Polyrhythmic bitwave: (t&t>>8)+(t|t>>10)
        return ((t & (t >> 8)) + (t | (t >> 10))) & 255;
    }
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const rawByte = this.evaluateFormula(Math.floor(this.t));
    this.t += this.tStep / this.sampleRateDiv;

    // Normalize from [0, 255] to [-1.0, 1.0]
    const normalized = (rawByte / 127.5) - 1.0;

    const amp = this.ampEnv.process();
    return normalized * amp * 0.5 * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    return {
      type: 'bytebeat',
      formulaId: this.formulaId,
      t: Math.floor(this.t),
      rawByte: this.evaluateFormula(Math.floor(this.t)),
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
