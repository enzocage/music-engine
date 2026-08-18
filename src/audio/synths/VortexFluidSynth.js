/**
 * Synthesizer 19: Vortex Fluidics & Aeolian Wind Resonator
 * Kármán vortex shedding and hydrodynamic turbulence acoustic model.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class VortexFluidSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Vortex Fluidics & Aeolian Wind';
    this.type = 'vortexfluid';

    // Acoustic Pipe Delay Line
    this.maxPipeLen = Math.floor(sampleRate / 30);
    this.pipeDelay = new Float32Array(this.maxPipeLen);
    this.pipeWriteIdx = 0;

    // Fluid & Aeroacoustic Parameters (16 parameters)
    this.airflowSpeed = 1.2; // Reynolds number flow velocity
    this.strouhalNumber = 0.21; // Strouhal vortex shedding constant
    this.cylinderDiameter = 0.02; // Obstacle diameter in meters
    this.turbulenceNoise = 0.45; // Pink/aerodynamic noise injection
    this.jetOffset = 0.2; // Angle of wind attack
    this.pipeOverblowing = 1.0; // Harmonic register (1=fund, 2=octave, 3=twelfth)
    this.reflectionFactor = 0.985; // Pipe open-end reflection
    this.cavityDamping = 0.02;
    this.swirlModDepth = 0.35; // Vortex swirl frequency modulation
    this.stereoVortexPan = 0.5;
    this.drive = 0.25;
    this.filterCutoff = 5800;
    this.filterRes = 1.5;

    this.vortexPhase1 = 0.0;
    this.vortexPhase2 = 0.5; // Alternating eddy detachment
    this.pinkNoiseState = 0.0;

    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.06, 0.3, 0.7, 0.4);
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
    this.pipeDelay.fill(0);
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  // Pink aerodynamic turbulence generator
  getAerodynamicNoise() {
    const white = Math.random() * 2.0 - 1.0;
    this.pinkNoiseState = this.pinkNoiseState * 0.92 + white * 0.08;
    return this.pinkNoiseState;
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    // Kármán vortex shedding frequency: f_vortex = St * v / d
    const effectiveVortexFreq = this.freq * this.pipeOverblowing;
    const vDt = effectiveVortexFreq / this.sampleRate;

    this.vortexPhase1 = (this.vortexPhase1 + vDt) % 1.0;
    this.vortexPhase2 = (this.vortexPhase2 + vDt) % 1.0;

    // Dual alternating vortex detachment
    const eddy1 = fastSin(this.vortexPhase1 * TWO_PI);
    const eddy2 = fastSin(this.vortexPhase2 * TWO_PI + Math.PI);
    const vortexSignal = (eddy1 - eddy2) * 0.5;

    // Hydrodynamic turbulence noise
    const turbNoise = this.getAerodynamicNoise() * this.turbulenceNoise;

    // Combined jet excitation
    const jetExcitation = vortexSignal * (1.0 + this.swirlModDepth * turbNoise) + turbNoise * 0.6;

    // Resonant acoustic pipe feedback loop
    const tunedPeriod = this.sampleRate / effectiveVortexFreq;
    const delaySamples = Math.max(2.0, Math.min(this.maxPipeLen - 2, tunedPeriod));
    const delayInt = Math.floor(delaySamples);
    const delayFrac = delaySamples - delayInt;

    const readIdx = (this.pipeWriteIdx - delayInt + this.maxPipeLen) % this.maxPipeLen;
    const readIdxNext = (readIdx + 1) % this.maxPipeLen;
    const pipeFeedback = this.pipeDelay[readIdx] * (1.0 - delayFrac) + this.pipeDelay[readIdxNext] * delayFrac;

    // Nonlinear jet-lip interaction
    const jetInteraction = fastTanh((jetExcitation - pipeFeedback * 0.7) * (1.0 + this.jetOffset));
    const pipeIn = (jetInteraction + pipeFeedback) * this.reflectionFactor;

    this.pipeDelay[this.pipeWriteIdx] = pipeIn;
    this.pipeWriteIdx = (this.pipeWriteIdx + 1) % this.maxPipeLen;

    // ZDF Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    let output = this.filter.process(pipeIn).lp;

    output = fastTanh(output * (1.0 + this.drive * 2.5));

    const env = this.ampEnv.process();
    return output * env * (this.velocity || 1.0) * 0.6;
  }

  getMathTelemetry() {
    return {
      type: 'vortexfluid',
      vortexPhase1: this.vortexPhase1,
      vortexPhase2: this.vortexPhase2,
      airflowSpeed: this.airflowSpeed,
      strouhalNumber: this.strouhalNumber,
      turbulenceNoise: this.turbulenceNoise,
      pipeOverblowing: this.pipeOverblowing,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
