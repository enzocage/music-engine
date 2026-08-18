/**
 * Synthesizer 5: Physical Modeling (Karplus-Strong & Digital Waveguide)
 * Real-time 1D wave equation simulation on a damped plucked string with fractional allpass tuning.
 */
import { ADSREnvelope } from '../DSPUtils.js';

export class PhysicalStringSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Physical String (Karplus-Strong)';
    this.type = 'waveguide';

    this.maxDelay = 2048;
    this.ringBuffer = new Float32Array(this.maxDelay);
    this.writeIndex = 0;
    this.delayLength = 100;
    this.fractionalDelay = 0.0;

    // Physical Parameters
    this.damping = 0.988; // String tension/decay (0.9 to 0.999)
    this.brightness = 0.5; // Filter blend in feedback loop
    this.pickPosition = 0.2; // 0.0 to 1.0 (comb filter excitation)
    this.stringTension = 0.0; // Non-linear pitch-glide

    // Allpass Fractional Delay Filter State
    this.allpassZ = 0.0;
    this.filterZ = 0.0;

    // Envelope
    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.001, 1.0, 0.9, 0.4);

    this.freq = 220.0;
    this.active = false;
    this.exciteLength = 0;
    this.exciteCount = 0;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;

    // Exact Delay Length calculation: L = (fs / f0) - 0.5 (for 1-pole averaging filter delay)
    const exactLength = Math.max(2.0, (this.sampleRate / this.freq) - 0.5);
    this.delayLength = Math.min(this.maxDelay - 2, Math.floor(exactLength));
    this.fractionalDelay = exactLength - this.delayLength;

    // Excitation Burst (Filtered noise simulating pluck / pick position)
    this.ringBuffer.fill(0);
    this.writeIndex = 0;
    this.allpassZ = 0.0;
    this.filterZ = 0.0;

    const combOffset = Math.floor(this.delayLength * this.pickPosition);
    for (let i = 0; i < this.delayLength; i++) {
      let noise = (Math.random() * 2.0 - 1.0) * velocity;
      // Comb filter for pick position
      if (i >= combOffset) {
        noise -= this.ringBuffer[i - combOffset] * 0.8;
      }
      this.ringBuffer[i] = noise;
    }
    this.writeIndex = this.delayLength;

    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    // Read head with circular buffer indexing
    let readIndexInt = (this.writeIndex - this.delayLength + this.maxDelay) % this.maxDelay;
    let readIndexNext = (readIndexInt + 1) % this.maxDelay;

    const sample0 = this.ringBuffer[readIndexInt];
    const sample1 = this.ringBuffer[readIndexNext];

    // Lowpass Damping Filter in feedback loop (Two-point weighted average)
    const lowpassed = sample0 * (1.0 - this.brightness * 0.5) + sample1 * (this.brightness * 0.5);

    // Fractional Allpass Filter for precise micro-tuning
    const d = this.fractionalDelay;
    const eta = (1.0 - d) / (1.0 + d + 0.0001);
    const delayed = eta * lowpassed + this.allpassZ - eta * this.filterZ;
    this.allpassZ = lowpassed;
    this.filterZ = delayed;

    // Damped feedback sample written back into string waveguide
    const feedbackSample = delayed * this.damping;
    this.ringBuffer[this.writeIndex] = feedbackSample;
    this.writeIndex = (this.writeIndex + 1) % this.maxDelay;

    const amp = this.ampEnv.process();
    return delayed * amp;
  }

  getMathTelemetry() {
    // Extract recent wave profile from string buffer for 3D displacement mesh
    const stringProfile = [];
    const step = Math.max(1, Math.floor(this.delayLength / 32));
    for (let i = 0; i < this.delayLength; i += step) {
      let idx = (this.writeIndex - i + this.maxDelay) % this.maxDelay;
      stringProfile.push(this.ringBuffer[idx]);
    }

    return {
      type: 'waveguide',
      freq: this.freq,
      delayLength: this.delayLength,
      damping: this.damping,
      pickPosition: this.pickPosition,
      stringProfile: stringProfile,
      amp: this.ampEnv.value
    };
  }
}
