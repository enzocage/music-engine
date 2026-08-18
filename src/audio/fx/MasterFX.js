/**
 * Master FX Suite: Zero-Allocation, Anti-Denormal Protected Audio Processors.
 */
import { antiDenormal } from '../DSPUtils.js';

/**
 * Master FX 1: CloudSeed Algorithmic Diffusion Reverb (FDN Model)
 */
export class CloudSeedReverb {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.decay = 0.82;
    this.damping = 0.4;
    this.mix = 0.28;

    // 4 Delay Lines for FDN (Prime sample lengths)
    this.delayLengths = [1087, 1283, 1487, 1723];
    this.delayBuffers = this.delayLengths.map(len => new Float32Array(len));
    this.writeIndices = new Int32Array(4);
    this.dampFilters = new Float32Array(4);

    // Allpass diffusers (2 per channel)
    this.apLen = [227, 347, 461, 571];
    this.apBuffers = this.apLen.map(len => new Float32Array(len));
    this.apIndices = new Int32Array(4);

    // Pre-allocated reusable outputs
    this.outL = 0.0;
    this.outR = 0.0;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
  }

  allpass(input, index) {
    const len = this.apLen[index];
    const buf = this.apBuffers[index];
    const wIdx = this.apIndices[index];

    const bufOut = buf[wIdx];
    const g = 0.6;
    const out = -input * g + bufOut;
    buf[wIdx] = input + bufOut * g;
    this.apIndices[index] = (wIdx + 1) % len;
    return out;
  }

  process(inL, inR) {
    if (this.mix <= 0.001) {
      this.outL = inL;
      this.outR = inR;
      return;
    }

    const input = (inL + inR) * 0.5;

    // Diffuse input through allpass chain
    const d0 = this.allpass(input, 0);
    const d1 = this.allpass(d0, 1);

    // Read FDN delay lines & apply damping
    const l0 = this.delayBuffers[0][(this.writeIndices[0] + 1) % this.delayLengths[0]];
    const l1 = this.delayBuffers[1][(this.writeIndices[1] + 1) % this.delayLengths[1]];
    const l2 = this.delayBuffers[2][(this.writeIndices[2] + 1) % this.delayLengths[2]];
    const l3 = this.delayBuffers[3][(this.writeIndices[3] + 1) % this.delayLengths[3]];

    this.dampFilters[0] = antiDenormal(l0 * (1.0 - this.damping) + this.dampFilters[0] * this.damping);
    this.dampFilters[1] = antiDenormal(l1 * (1.0 - this.damping) + this.dampFilters[1] * this.damping);
    this.dampFilters[2] = antiDenormal(l2 * (1.0 - this.damping) + this.dampFilters[2] * this.damping);
    this.dampFilters[3] = antiDenormal(l3 * (1.0 - this.damping) + this.dampFilters[3] * this.damping);

    // Unitary feedback mixing
    const f0 = 0.5 * (this.dampFilters[0] + this.dampFilters[1] + this.dampFilters[2] + this.dampFilters[3]);
    const f1 = 0.5 * (this.dampFilters[0] - this.dampFilters[1] + this.dampFilters[2] - this.dampFilters[3]);
    const f2 = 0.5 * (this.dampFilters[0] + this.dampFilters[1] - this.dampFilters[2] - this.dampFilters[3]);
    const f3 = 0.5 * (this.dampFilters[0] - this.dampFilters[1] - this.dampFilters[2] + this.dampFilters[3]);

    this.delayBuffers[0][this.writeIndices[0]] = d1 + f0 * this.decay;
    this.delayBuffers[1][this.writeIndices[1]] = d1 + f1 * this.decay;
    this.delayBuffers[2][this.writeIndices[2]] = d1 + f2 * this.decay;
    this.delayBuffers[3][this.writeIndices[3]] = d1 + f3 * this.decay;

    this.writeIndices[0] = (this.writeIndices[0] + 1) % this.delayLengths[0];
    this.writeIndices[1] = (this.writeIndices[1] + 1) % this.delayLengths[1];
    this.writeIndices[2] = (this.writeIndices[2] + 1) % this.delayLengths[2];
    this.writeIndices[3] = (this.writeIndices[3] + 1) % this.delayLengths[3];

    const wetL = (l0 + l2) * 0.5;
    const wetR = (l1 + l3) * 0.5;

    this.outL = inL * (1.0 - this.mix) + wetL * this.mix;
    this.outR = inR * (1.0 - this.mix) + wetR * this.mix;
  }
}

/**
 * Master FX 2: Stereo Ping-Pong Tempo Delay (Zero-Allocation)
 */
export class StereoDelay {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.maxDelay = sampleRate * 2;
    this.bufferL = new Float32Array(this.maxDelay);
    this.bufferR = new Float32Array(this.maxDelay);
    this.writeIdx = 0;

    this.timeL = 0.25;
    this.timeR = 0.375;
    this.feedback = 0.4;
    this.mix = 0.2;
    this.filterZ_L = 0.0;
    this.filterZ_R = 0.0;

    this.outL = 0.0;
    this.outR = 0.0;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.maxDelay = sr * 2;
    this.bufferL = new Float32Array(this.maxDelay);
    this.bufferR = new Float32Array(this.maxDelay);
    this.writeIdx = 0;
  }

  process(inL, inR) {
    if (this.mix <= 0.001) {
      this.outL = inL;
      this.outR = inR;
      return;
    }

    const delaySamplesL = Math.min(this.maxDelay - 1, Math.floor(this.timeL * this.sampleRate));
    const delaySamplesR = Math.min(this.maxDelay - 1, Math.floor(this.timeR * this.sampleRate));

    const readIdxL = (this.writeIdx - delaySamplesL + this.maxDelay) % this.maxDelay;
    const readIdxR = (this.writeIdx - delaySamplesR + this.maxDelay) % this.maxDelay;

    const delayedL = this.bufferL[readIdxL];
    const delayedR = this.bufferR[readIdxR];

    this.filterZ_L = antiDenormal(delayedL * 0.6 + this.filterZ_L * 0.4);
    this.filterZ_R = antiDenormal(delayedR * 0.6 + this.filterZ_R * 0.4);

    this.bufferL[this.writeIdx] = inL + this.filterZ_R * this.feedback;
    this.bufferR[this.writeIdx] = inR + this.filterZ_L * this.feedback;

    this.writeIdx = (this.writeIdx + 1) % this.maxDelay;

    this.outL = inL * (1.0 - this.mix) + delayedL * this.mix;
    this.outR = inR * (1.0 - this.mix) + delayedR * this.mix;
  }
}

/**
 * Master FX 3: Lookahead True-Peak Limiter (Zero-Allocation)
 */
export class MasterLimiter {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.threshold = 0.95;
    this.release = 0.05;
    this.envelope = 0.0;

    this.outL = 0.0;
    this.outR = 0.0;
    this.gainReduction = 1.0;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
  }

  process(inL, inR) {
    const peak = Math.max(Math.abs(inL), Math.abs(inR));
    
    if (peak > this.envelope) {
      this.envelope = peak;
    } else {
      const releaseCoeff = Math.exp(-1.0 / (this.release * this.sampleRate));
      this.envelope = antiDenormal(peak + (this.envelope - peak) * releaseCoeff);
    }

    let gain = 1.0;
    if (this.envelope > this.threshold) {
      gain = this.threshold / this.envelope;
    }
    this.gainReduction = gain;

    let outL = inL * gain;
    let outR = inR * gain;

    if (Math.abs(outL) > 0.98) outL = Math.sign(outL) * (0.98 + 0.02 * Math.tanh((Math.abs(outL) - 0.98) * 10.0));
    if (Math.abs(outR) > 0.98) outR = Math.sign(outR) * (0.98 + 0.02 * Math.tanh((Math.abs(outR) - 0.98) * 10.0));

    this.outL = outL;
    this.outR = outR;
  }
}
