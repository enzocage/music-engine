/**
 * Synthesizer 1: Virtual Analog (Subtractive)
 * Mathematically accurate bandlimited PolyBLEP oscillators with Zero-Delay-Feedback filter.
 */
import { polyBLEP, polyBLAMP, ZDFFilter, ADSREnvelope, TWO_PI } from '../DSPUtils.js';

export class SubtractiveSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Virtual Analog (VA)';
    this.type = 'subtractive';
    
    // Synthesis Parameters
    this.waveform = 'saw'; // 'saw', 'square', 'triangle', 'pulse', 'supersaw'
    this.pw = 0.5; // Pulse Width
    this.detune = 0.0;
    this.subLevel = 0.2;
    this.noiseLevel = 0.0;
    
    // Filter
    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);
    this.filterCutoff = 2500;
    this.filterRes = 2.0;
    this.filterType = 'lp'; // 'lp', 'bp', 'hp'
    this.filterEnvAmount = 3000;
    
    // Envelopes
    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.15, 0.6, 0.3);
    
    this.filterEnv = new ADSREnvelope();
    this.filterEnv.setSampleRate(sampleRate);
    this.filterEnv.setParameters(0.02, 0.2, 0.2, 0.4);
    
    // State
    this.phase = 0.0;
    this.subPhase = 0.0;
    this.supersawPhases = [0.1, 0.3, 0.5, 0.7, 0.9];
    this.freq = 440.0;
    this.active = false;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.filter.setSampleRate(sr);
    this.ampEnv.setSampleRate(sr);
    this.filterEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.ampEnv.trigger();
    this.filterEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
    this.filterEnv.releaseNote();
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) {
      return 0.0;
    }

    const dt = this.freq / this.sampleRate;
    let oscOut = 0.0;

    switch (this.waveform) {
      case 'saw': {
        let saw = 2.0 * this.phase - 1.0;
        saw -= polyBLEP(this.phase, dt);
        oscOut = saw;
        break;
      }
      case 'square':
      case 'pulse': {
        let sq = this.phase < this.pw ? 1.0 : -1.0;
        sq += polyBLEP(this.phase, dt);
        sq -= polyBLEP((this.phase + 1.0 - this.pw) % 1.0, dt);
        oscOut = sq;
        break;
      }
      case 'triangle': {
        let tri = 2.0 * Math.abs(2.0 * this.phase - 1.0) - 1.0;
        tri += polyBLAMP(this.phase, dt);
        oscOut = tri;
        break;
      }
      case 'supersaw': {
        let sum = 0.0;
        const detunes = [-0.015, -0.007, 0.0, 0.007, 0.015];
        for (let i = 0; i < 5; i++) {
          const sDt = (this.freq * (1.0 + detunes[i])) / this.sampleRate;
          this.supersawPhases[i] = (this.supersawPhases[i] + sDt) % 1.0;
          let s = 2.0 * this.supersawPhases[i] - 1.0;
          s -= polyBLEP(this.supersawPhases[i], sDt);
          sum += s;
        }
        oscOut = sum * 0.25;
        break;
      }
      default:
        oscOut = Math.sin(TWO_PI * this.phase);
    }

    // Sub-Oscillator (Square wave 1 octave down)
    const subDt = (this.freq * 0.5) / this.sampleRate;
    this.subPhase = (this.subPhase + subDt) % 1.0;
    let sub = this.subPhase < 0.5 ? 1.0 : -1.0;
    sub += polyBLEP(this.subPhase, subDt);
    sub -= polyBLEP((this.subPhase + 0.5) % 1.0, subDt);

    // Noise Generator
    const noise = (Math.random() * 2.0 - 1.0) * this.noiseLevel;

    // Mixed Raw Signal
    const rawSignal = oscOut + sub * this.subLevel + noise;

    // Phase Advancement
    this.phase = (this.phase + dt) % 1.0;

    // Filter Processing
    const envVal = this.filterEnv.process();
    const dynamicCutoff = Math.max(20.0, Math.min(this.filterCutoff + envVal * this.filterEnvAmount, this.sampleRate * 0.48));
    this.filter.setParameters(dynamicCutoff, this.filterRes, 0.2);
    const filterOut = this.filter.process(rawSignal);

    const filteredSignal = this.filterType === 'hp' ? filterOut.hp :
                           this.filterType === 'bp' ? filterOut.bp : filterOut.lp;

    // VCA & Envelope
    const ampVal = this.ampEnv.process();
    const finalSample = filteredSignal * ampVal * (this.velocity || 1.0);

    return finalSample;
  }

  getMathTelemetry() {
    return {
      type: 'subtractive',
      phase: this.phase,
      freq: this.freq,
      waveform: this.waveform,
      cutoff: this.filterCutoff,
      resonance: this.filterRes,
      amp: this.ampEnv.value,
      filterEnv: this.filterEnv.value
    };
  }
}
