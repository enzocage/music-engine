/**
 * Synthesizer 8: Granular Synthesis (Grain Cloud Scheduler)
 * Asynchronously generates clouds of micro-sound grains with Hann windowing,
 * position jitter, pitch dispersion, and stereo particle spread.
 */
import { ADSREnvelope, TWO_PI } from '../DSPUtils.js';

export class GranularSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Granular Micro-Sound Cloud';
    this.type = 'granular';

    // Source Audio Buffer (Procedurally synthesized warm textured waveform)
    this.bufferSize = sampleRate * 2; // 2 seconds
    this.audioBuffer = new Float32Array(this.bufferSize);
    this.generateSourceBuffer();

    // Grain Parameters
    this.maxGrains = 32;
    this.grains = [];
    for (let i = 0; i < this.maxGrains; i++) {
      this.grains.push({
        active: false,
        pos: 0.0,
        rate: 1.0,
        age: 0,
        duration: 2000, // in samples
        pan: 0.5,
        gain: 1.0
      });
    }

    this.grainSizeMs = 60; // 10 to 200ms
    this.grainDensity = 25; // grains per second
    this.positionJitter = 0.3;
    this.pitchJitter = 0.05;
    this.scanPosition = 0.0; // 0.0 to 1.0

    this.spawnCounter = 0;
    this.spawnInterval = Math.floor(sampleRate / this.grainDensity);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.05, 0.4, 0.7, 0.5);

    this.freq = 440.0;
    this.active = false;
  }

  generateSourceBuffer() {
    for (let i = 0; i < this.bufferSize; i++) {
      const t = i / this.sampleRate;
      // Multi-harmonic textured wave with subtle vibrato
      const s1 = Math.sin(TWO_PI * 110 * t);
      const s2 = Math.sin(TWO_PI * 220 * t + 0.5) * 0.5;
      const s3 = Math.sin(TWO_PI * 330 * t + 1.2) * 0.3;
      const s4 = Math.sin(TWO_PI * 550 * t + 2.1) * 0.2;
      const noise = (Math.random() * 2.0 - 1.0) * 0.05;
      this.audioBuffer[i] = (s1 + s2 + s3 + s4 + noise) * 0.6;
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
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  spawnGrain() {
    const grain = this.grains.find(g => !g.active);
    if (!grain) return;

    const baseRate = this.freq / 110.0;
    const pitchJitt = 1.0 + (Math.random() * 2.0 - 1.0) * this.pitchJitter;
    grain.rate = baseRate * pitchJitt;

    const durSamples = Math.max(128, Math.floor((this.grainSizeMs / 1000.0) * this.sampleRate));
    grain.duration = durSamples;
    grain.age = 0;

    const centerPos = (this.scanPosition * this.bufferSize) % this.bufferSize;
    const jitter = (Math.random() * 2.0 - 1.0) * this.positionJitter * this.sampleRate * 0.5;
    grain.pos = (centerPos + jitter + this.bufferSize) % this.bufferSize;

    grain.pan = Math.random();
    grain.gain = 0.5 + Math.random() * 0.5;
    grain.active = true;
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    // Grain spawning logic
    this.spawnCounter++;
    if (this.spawnCounter >= this.spawnInterval) {
      this.spawnCounter = 0;
      this.spawnGrain();
    }

    // Advance buffer scan position slowly
    this.scanPosition = (this.scanPosition + 0.00005) % 1.0;

    let outL = 0.0;

    for (let i = 0; i < this.maxGrains; i++) {
      const g = this.grains[i];
      if (!g.active) continue;

      // Hann Window for smooth grain edges
      const progress = g.age / g.duration;
      const window = 0.5 * (1.0 - Math.cos(TWO_PI * progress));

      // Read sample with linear interpolation
      const idx0 = Math.floor(g.pos);
      const idx1 = (idx0 + 1) % this.bufferSize;
      const frac = g.pos - idx0;
      const sample = this.audioBuffer[idx0] + frac * (this.audioBuffer[idx1] - this.audioBuffer[idx0]);

      outL += sample * window * g.gain;

      // Advance grain
      g.pos = (g.pos + g.rate + this.bufferSize) % this.bufferSize;
      g.age++;
      if (g.age >= g.duration) {
        g.active = false;
      }
    }

    const amp = this.ampEnv.process();
    return outL * amp * 0.4 * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    // Active grains 3D positions (scan position, pitch, life progress)
    const activeGrainsData = [];
    for (let i = 0; i < this.maxGrains; i++) {
      const g = this.grains[i];
      if (g.active) {
        activeGrainsData.push({
          pos: g.pos / this.bufferSize,
          pitch: g.rate,
          progress: g.age / g.duration,
          pan: g.pan
        });
      }
    }

    return {
      type: 'granular',
      freq: this.freq,
      scanPosition: this.scanPosition,
      activeGrains: activeGrainsData,
      grainDensity: this.grainDensity,
      grainSizeMs: this.grainSizeMs,
      amp: this.ampEnv.value
    };
  }
}
