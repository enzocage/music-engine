/**
 * Synthesizer 20: Spectral Freeze & Phase Diffuser
 * Parallel spectral resonator bank with continuous spectral freezing, blurring, and shimmer feedback.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class SpectralFreezeSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Spectral Freeze & Phase Diffuser';
    this.type = 'spectralfreeze';

    this.numBins = 24;
    this.binFreqs = new Float32Array(this.numBins);
    this.binPhases = new Float32Array(this.numBins);
    this.binGains = new Float32Array(this.numBins);
    this.frozenGains = new Float32Array(this.numBins);

    // Parameters (16 parameters)
    this.freezeHold = 0.0; // 0.0 = live dynamic, 1.0 = 100% frozen spectrum
    this.spectralBlur = 0.4; // Smear energy across adjacent bins
    this.binTilt = -1.2; // Spectral slope
    this.phaseScramble = 0.6; // Random phase decorrelation
    this.shimmerShift = 12; // Shimmer semitone offset (+12st = octave up)
    this.shimmerFeedback = 0.35; // Shimmer loop gain
    this.dampingHighs = 0.3; // High frequency roll-off
    this.transientPass = 0.2; // Dry transient punch
    this.stereoSpread = 0.7;
    this.drive = 0.2;
    this.filterCutoff = 8000;
    this.filterRes = 1.0;
    this.wetDry = 0.85;

    this.shimmerPhase = 0.0;
    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.04, 0.4, 0.7, 0.6);

    this.initBins();
  }

  initBins() {
    for (let k = 0; k < this.numBins; k++) {
      const harmonic = k + 1;
      this.binFreqs[k] = this.freq * harmonic;
      this.binPhases[k] = Math.random();
      this.binGains[k] = Math.pow(harmonic, this.binTilt);
      this.frozenGains[k] = this.binGains[k];
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

    for (let k = 0; k < this.numBins; k++) {
      const harmonic = k + 1;
      this.binFreqs[k] = this.freq * harmonic;
      this.binPhases[k] = Math.random();
      const initialGain = Math.pow(harmonic, this.binTilt);
      this.binGains[k] = initialGain;
      this.frozenGains[k] = initialGain * (0.8 + Math.random() * 0.4);
    }

    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    let spectralSum = 0.0;
    const nyquist = this.sampleRate * 0.48;

    // Continuous spectral blur & freeze interpolation
    for (let k = 0; k < this.numBins; k++) {
      const f = this.binFreqs[k];
      if (f >= nyquist) continue;

      const dt = f / this.sampleRate;
      // Phase advance with optional random diffusion
      const jitter = (Math.random() - 0.5) * this.phaseScramble * 0.005;
      this.binPhases[k] = (this.binPhases[k] + dt + jitter) % 1.0;

      // Blur with neighbors
      const leftGain = (k > 0) ? this.binGains[k - 1] : this.binGains[k];
      const rightGain = (k < this.numBins - 1) ? this.binGains[k + 1] : this.binGains[k];
      const blurred = this.binGains[k] * (1.0 - this.spectralBlur) + (leftGain + rightGain) * 0.5 * this.spectralBlur;

      // Freeze blending
      const targetGain = blurred * (1.0 - this.freezeHold) + this.frozenGains[k] * this.freezeHold;
      this.binGains[k] = targetGain;

      // High damping
      const highDamp = Math.exp(-k * this.dampingHighs * 0.1);
      spectralSum += fastSin(this.binPhases[k] * TWO_PI) * targetGain * highDamp;
    }

    // Shimmer Pitch-Shifted feedback (+12 or +7 semitones)
    const shimmerRatio = Math.pow(2.0, this.shimmerShift / 12.0);
    const sDt = (this.freq * shimmerRatio) / this.sampleRate;
    this.shimmerPhase = (this.shimmerPhase + sDt) % 1.0;
    const shimmerOsc = fastSin(this.shimmerPhase * TWO_PI) * spectralSum * this.shimmerFeedback;

    let output = spectralSum * this.wetDry + shimmerOsc;
    output = fastTanh(output * (1.0 + this.drive * 2.5));

    // ZDF Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    output = this.filter.process(output).lp;

    const env = this.ampEnv.process();
    return output * env * (this.velocity || 1.0) * 0.5;
  }

  getMathTelemetry() {
    return {
      type: 'spectralfreeze',
      numBins: this.numBins,
      freezeHold: this.freezeHold,
      binGains: Array.from(this.binGains),
      binFreqs: Array.from(this.binFreqs),
      shimmerShift: this.shimmerShift,
      shimmerFeedback: this.shimmerFeedback,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
