/**
 * Synthesizer 21: Pulsar & Formant Train Particle Synth
 * Curtis Roads Pulsar Synthesis: Micro-acoustic pulsaret trains with formant masking & stochastic bursts.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class PulsarTrainSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Pulsar & Formant Train';
    this.type = 'pulsartrain';

    // Parameters (16 parameters)
    this.pulsaretShape = 'hann'; // 'hann' | 'gauss' | 'sinc' | 'rect'
    this.formantRatio = 3.5; // Pulsaret internal formant frequency multiplier
    this.dutyCycle = 0.45; // Pulsaret width relative to period (0.05 to 1.0)
    this.formantMask = 1.0; // Masking overtone envelope
    this.subMultiply = 1; // Sub-pulsar repetition rate
    this.burstJitter = 0.05; // Stochastic burst timing jitter
    this.formantChirp = 0.2; // Frequency sweep across single pulsaret
    this.interPulsarSilence = 0.2;
    this.stereoPanSpread = 0.5;
    this.drive = 0.3;
    this.filterCutoff = 7000;
    this.filterRes = 1.6;

    this.pulsarPhase = 0.0;
    this.pulsaretPhase = 0.0;
    this.activePulsaret = false;

    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.008, 0.25, 0.6, 0.35);
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
    this.pulsarPhase = 0.0;
    this.pulsaretPhase = 0.0;
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  // Pulsaret Envelope window
  evaluateWindow(p) {
    switch (this.pulsaretShape) {
      case 'gauss': {
        const x = (p - 0.5) * 4.0;
        return Math.exp(-x * x);
      }
      case 'sinc': {
        const x = (p - 0.5) * Math.PI * 4.0 + 1e-5;
        return Math.sin(x) / x;
      }
      case 'rect':
        return 1.0;
      case 'hann':
      default:
        return 0.5 * (1.0 - Math.cos(p * TWO_PI));
    }
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    // Fundamental pulsar train period
    const dtFundamental = this.freq / this.sampleRate;
    this.pulsarPhase += dtFundamental;

    if (this.pulsarPhase >= 1.0) {
      const jitterOffset = (Math.random() - 0.5) * this.burstJitter * 0.2;
      this.pulsarPhase = Math.max(0.0, this.pulsarPhase - 1.0 + jitterOffset);
      this.activePulsaret = true;
      this.pulsaretPhase = 0.0;
    }

    let output = 0.0;

    // Check if within active pulsaret duty cycle
    if (this.pulsarPhase < this.dutyCycle) {
      const normPulsaretPos = this.pulsarPhase / this.dutyCycle; // [0, 1]
      
      // Formant frequency within pulsaret
      const chirpMod = 1.0 + normPulsaretPos * this.formantChirp;
      const formantFreq = this.freq * this.formantRatio * chirpMod;
      const fDt = formantFreq / this.sampleRate;
      this.pulsaretPhase = (this.pulsaretPhase + fDt) % 1.0;

      // Window envelope
      const win = this.evaluateWindow(normPulsaretPos);
      const waveform = fastSin(this.pulsaretPhase * TWO_PI);

      output = waveform * win * this.formantMask;
    }

    output = fastTanh(output * (1.0 + this.drive * 3.0));

    // ZDF Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    output = this.filter.process(output).lp;

    const env = this.ampEnv.process();
    return output * env * (this.velocity || 1.0) * 0.65;
  }

  getMathTelemetry() {
    return {
      type: 'pulsartrain',
      pulsarPhase: this.pulsarPhase,
      dutyCycle: this.dutyCycle,
      formantRatio: this.formantRatio,
      pulsaretShape: this.pulsaretShape,
      formantChirp: this.formantChirp,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
