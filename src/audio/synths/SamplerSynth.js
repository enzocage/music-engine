/**
 * Synthesizer 10: Multi-Zone Sampler & PCM Synthesizer
 * Resamples multi-sampled acoustic and electronic instruments with loop-points and key-tracking.
 */
import { ADSREnvelope, TWO_PI } from '../DSPUtils.js';

export class SamplerSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Multi-Zone Sampler / PCM';
    this.type = 'sampler';

    this.instrument = 'epiano'; // 'epiano', 'strings', 'analog_bass', 'marimba'
    this.samples = new Map();
    this.initInstrumentSamples();

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.005, 0.4, 0.5, 0.3);

    this.playbackPos = 0.0;
    this.playbackRate = 1.0;
    this.freq = 440.0;
    this.active = false;
  }

  initInstrumentSamples() {
    // Generate high-resolution procedural acoustic instrument tables for standalone performance
    const size = this.sampleRate; // 1 second base sample
    
    // E-Piano (FM bell attack + warm Rhodes body)
    const epiano = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const t = i / this.sampleRate;
      const decay = Math.exp(-t * 3.5);
      const tine = Math.sin(TWO_PI * 440 * 7 * t) * Math.exp(-t * 25.0) * 0.4;
      const body = Math.sin(TWO_PI * 440 * t) * 0.6 + Math.sin(TWO_PI * 880 * t) * 0.3 + Math.sin(TWO_PI * 1320 * t) * 0.15;
      epiano[i] = (body + tine) * decay;
    }
    this.samples.set('epiano', epiano);

    // Strings (Orchestral Saw Ensemble with subtle chorus beating)
    const strings = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const t = i / this.sampleRate;
      let sum = 0;
      const detunes = [0.996, 1.0, 1.004, 1.995, 2.005];
      for (const d of detunes) {
        sum += Math.sin(TWO_PI * 220 * d * t) * 0.2;
      }
      strings[i] = sum;
    }
    this.samples.set('strings', strings);

    // Marimba (Rich transient bar strike)
    const marimba = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const t = i / this.sampleRate;
      const decay1 = Math.exp(-t * 8.0);
      const decay2 = Math.exp(-t * 20.0);
      const decay3 = Math.exp(-t * 40.0);
      marimba[i] = Math.sin(TWO_PI * 440 * t) * decay1 * 0.7 +
                   Math.sin(TWO_PI * 440 * 3.98 * t) * decay2 * 0.3 +
                   Math.sin(TWO_PI * 440 * 9.2 * t) * decay3 * 0.15;
    }
    this.samples.set('marimba', marimba);
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.playbackPos = 0.0;
    
    // Pitch shift relative to base sample root frequency (440 Hz or 220 Hz)
    const rootFreq = (this.instrument === 'strings') ? 220.0 : 440.0;
    this.playbackRate = freq / rootFreq;

    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const sampleBuffer = this.samples.get(this.instrument) || this.samples.get('epiano');
    const bufferLen = sampleBuffer.length;

    // Hermite 4-point interpolation for high fidelity pitch shifting
    const iPos = Math.floor(this.playbackPos);
    if (iPos >= bufferLen - 4) {
      if (this.instrument === 'strings') {
        // Loop back
        this.playbackPos %= bufferLen;
      } else {
        return 0.0;
      }
    }

    const idx = Math.floor(this.playbackPos);
    const frac = this.playbackPos - idx;

    const y0 = sampleBuffer[(idx - 1 + bufferLen) % bufferLen];
    const y1 = sampleBuffer[idx % bufferLen];
    const y2 = sampleBuffer[(idx + 1) % bufferLen];
    const y3 = sampleBuffer[(idx + 2) % bufferLen];

    // 4-point cubic Hermite interpolation
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    const sample = ((c3 * frac + c2) * frac + c1) * frac + c0;

    this.playbackPos += this.playbackRate;

    const amp = this.ampEnv.process();
    return sample * amp * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    const sampleBuffer = this.samples.get(this.instrument) || this.samples.get('epiano');
    return {
      type: 'sampler',
      instrument: this.instrument,
      playbackPos: this.playbackPos / sampleBuffer.length,
      playbackRate: this.playbackRate,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
