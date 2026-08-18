/**
 * Synthesizer 18: Bowed String & Friction Stick-Slip Physics
 * Non-linear Helmholtz stick-slip friction model with body acoustic cavity resonators.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class BowedStringSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Bowed String & Stick-Slip Physics';
    this.type = 'bowedstring';

    // Delay lines for bidirectional string propagation
    this.maxDelay = Math.floor(sampleRate / 40); // Down to 40 Hz
    this.delayLineLeft = new Float32Array(this.maxDelay);
    this.delayLineRight = new Float32Array(this.maxDelay);
    this.writeIdx = 0;

    // Physical Parameters (15 parameters)
    this.bowPressure = 0.65; // Bow force normal to string
    this.bowVelocity = 0.8; // Bow drawing speed
    this.bowPosition = 0.16; // Bowing position (ponticello to tasto)
    this.rosinFriction = 0.85; // Static/dynamic friction ratio
    this.stringDamping = 0.992; // Feedback loss factor
    this.inharmonicity = 0.05;
    this.bodyWoodFreq = 540.0; // Violin top plate mode
    this.bodyAirFreq = 280.0; // Helmholtz air resonance
    this.bodyQ = 4.0;
    this.tremoloRate = 5.0; // Vibrato / Tremolo rate (Hz)
    this.tremoloDepth = 0.08;
    this.drive = 0.3;
    this.filterCutoff = 6500;
    this.filterRes = 1.0;

    this.isSticking = true;
    this.relVelocity = 0.0;
    this.tremoloPhase = 0.0;

    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    // Body Formant Filter
    this.bodyFilterWood = new ZDFFilter();
    this.bodyFilterWood.setSampleRate(sampleRate);
    this.bodyFilterAir = new ZDFFilter();
    this.bodyFilterAir.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.04, 0.2, 0.85, 0.45);
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.bodyFilterWood.setSampleRate(sr);
    this.bodyFilterAir.setSampleRate(sr);
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.delayLineLeft.fill(0);
    this.delayLineRight.fill(0);
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  // Non-linear friction characteristic: mu(v_rel)
  frictionCharacteristic(v_rel) {
    const v_b = Math.abs(v_rel) + 0.001;
    // Hyperbolic / exponential friction drop from static to dynamic
    const mu = this.rosinFriction * Math.exp(-v_b * 3.5) + 0.25;
    return Math.sign(v_rel) * Math.min(1.0, mu * this.bowPressure);
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    // Vibrato / Tremolo LFO
    const tremDt = this.tremoloRate / this.sampleRate;
    this.tremoloPhase = (this.tremoloPhase + tremDt) % 1.0;
    const vibratoMod = 1.0 + fastSin(this.tremoloPhase * TWO_PI) * this.tremoloDepth * 0.03;

    const tunedFreq = Math.min(this.sampleRate * 0.45, this.freq * vibratoMod);
    const delaySamples = Math.max(4.0, this.sampleRate / tunedFreq);
    const delayInt = Math.floor(delaySamples);
    const delayFrac = delaySamples - delayInt;

    // Read head with linear interpolation
    const readIdx = (this.writeIdx - delayInt + this.maxDelay) % this.maxDelay;
    const readIdxPrev = (readIdx - 1 + this.maxDelay) % this.maxDelay;
    const waveIn = this.delayLineLeft[readIdx] * (1.0 - delayFrac) + this.delayLineLeft[readIdxPrev] * delayFrac;

    // Helmholtz stick-slip calculation
    const bowVel = this.bowVelocity * this.velocity * 0.5;
    const stringVel = waveIn;
    const v_rel = bowVel - stringVel;
    this.relVelocity = v_rel;

    const frictionForce = this.frictionCharacteristic(v_rel);
    this.isSticking = Math.abs(v_rel) < 0.15;

    // String excitement & wave reflection
    const waveOut = (waveIn + frictionForce * 0.4) * this.stringDamping;

    // Store into delay line
    this.delayLineLeft[this.writeIdx] = waveOut;
    this.writeIdx = (this.writeIdx + 1) % this.maxDelay;

    // Resonant Violin/Cello Body simulation
    this.bodyFilterWood.setParameters(this.bodyWoodFreq, this.bodyQ);
    this.bodyFilterAir.setParameters(this.bodyAirFreq, this.bodyQ * 0.8);

    const bodyWood = this.bodyFilterWood.process(waveOut).bp;
    const bodyAir = this.bodyFilterAir.process(waveOut).bp;
    let signal = waveOut * 0.4 + bodyWood * 0.4 + bodyAir * 0.3;

    signal = fastTanh(signal * (1.0 + this.drive * 2.0));

    const env = this.ampEnv.process();
    return signal * env * (this.velocity || 1.0) * 0.65;
  }

  getMathTelemetry() {
    return {
      type: 'bowedstring',
      bowPressure: this.bowPressure,
      bowVelocity: this.bowVelocity,
      bowPosition: this.bowPosition,
      isSticking: this.isSticking,
      relVelocity: this.relVelocity,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
