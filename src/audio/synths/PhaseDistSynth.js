/**
 * Synthesizer 4: Phase Distortion (PD) & Wavefolding
 * Casio CZ style non-linear phase warping and Buchla/Serge 4-stage wavefolding.
 */
import { ADSREnvelope, TWO_PI } from '../DSPUtils.js';

export class PhaseDistSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Phase Distortion & Wavefolder';
    this.type = 'phasedist';

    this.pdMode = 'saw'; // 'saw', 'square', 'reso_saw', 'reso_tri', 'trapezoid'
    this.pdAmount = 0.7; // 0.0 to 1.0
    this.wavefoldAmount = 0.5; // 0.0 to 4.0 folds
    this.symmetry = 0.5;

    // Envelopes
    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.2, 0.6, 0.25);

    this.pdEnv = new ADSREnvelope();
    this.pdEnv.setSampleRate(sampleRate);
    this.pdEnv.setParameters(0.02, 0.3, 0.3, 0.4);

    // State
    this.phase = 0.0;
    this.freq = 440.0;
    this.active = false;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
    this.pdEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.ampEnv.trigger();
    this.pdEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
    this.pdEnv.releaseNote();
  }

  /**
   * Buchla-style Multi-Stage Wavefolding
   */
  foldWave(x, amount) {
    if (amount <= 0.001) return x;
    let drive = 1.0 + amount * 3.0;
    let s = x * drive;
    // 4-stage folding
    for (let stage = 0; stage < 3; stage++) {
      if (s > 1.0) {
        s = 2.0 - s;
      } else if (s < -1.0) {
        s = -2.0 - s;
      }
    }
    return Math.max(-1.0, Math.min(1.0, s));
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const dt = this.freq / this.sampleRate;
    const dynamicPd = Math.min(0.999, this.pdAmount * (0.2 + 0.8 * this.pdEnv.process()));

    let warpedPhase = this.phase;

    // Casio CZ Phase Distortion Transfer Functions
    switch (this.pdMode) {
      case 'saw': {
        // Bend linear ramp to accelerated ramp
        if (warpedPhase < dynamicPd) {
          warpedPhase = (warpedPhase / dynamicPd) * 0.5;
        } else {
          warpedPhase = 0.5 + ((warpedPhase - dynamicPd) / (1.0 - dynamicPd)) * 0.5;
        }
        break;
      }
      case 'reso_saw': {
        // Resonant Saw: rapid oscillations within single cycle
        const resonanceMultiplier = 1.0 + dynamicPd * 7.0;
        const window = 1.0 - this.phase; // Saw window
        const carrier = Math.sin(TWO_PI * (this.phase * resonanceMultiplier));
        let sample = carrier * window;
        this.phase = (this.phase + dt) % 1.0;
        const folded = this.foldWave(sample, this.wavefoldAmount);
        return folded * this.ampEnv.process() * (this.velocity || 1.0);
      }
      case 'square':
      default: {
        if (warpedPhase < 0.5) {
          warpedPhase = Math.pow(warpedPhase * 2.0, 1.0 + dynamicPd * 3.0) * 0.5;
        } else {
          warpedPhase = 0.5 + (1.0 - Math.pow((1.0 - warpedPhase) * 2.0, 1.0 + dynamicPd * 3.0)) * 0.5;
        }
        break;
      }
    }

    const raw = Math.sin(TWO_PI * warpedPhase);
    this.phase = (this.phase + dt) % 1.0;

    // Apply Wavefolder
    const folded = this.foldWave(raw, this.wavefoldAmount);
    return folded * this.ampEnv.process() * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    return {
      type: 'phasedist',
      phase: this.phase,
      freq: this.freq,
      pdAmount: this.pdAmount,
      wavefoldAmount: this.wavefoldAmount,
      pdMode: this.pdMode,
      amp: this.ampEnv.value
    };
  }
}
