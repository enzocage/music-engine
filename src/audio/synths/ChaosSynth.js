/**
 * Synthesizer 11: Chaotic Attractors & Non-Linear Dynamics
 * High-performance, zero-allocation Runge-Kutta 4th order numerical integrator.
 */
import { ADSREnvelope, RK4Integrator } from '../DSPUtils.js';

export class ChaosSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Chaotic Attractors & DGLs';
    this.type = 'chaos';

    this.attractorType = 'lorenz';
    
    // Lorenz parameters
    this.sigma = 10.0;
    this.rho = 28.0;
    this.beta = 2.666666667;

    // Chua parameters
    this.alpha = 15.6;
    this.gamma = 28.0;
    this.m0 = -1.143;
    this.m1 = -0.714;

    // Integration state [x, y, z]
    this.state = [0.1, 0.0, 0.0];
    this.timeScale = 1.0;
    this.rk4 = new RK4Integrator();

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.3, 0.7, 0.3);

    this.freq = 220.0;
    this.active = false;

    // Pre-bound derivative function for zero allocation
    this.derivsBound = (s, out) => this.computeDerivatives(s, out);
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.ampEnv.setSampleRate(sr);
  }

  noteOn(freq, velocity = 1.0) {
    this.freq = freq;
    this.velocity = velocity;
    this.active = true;
    this.timeScale = (freq / 220.0) * 1.5;
    this.state[0] = 0.1 + Math.random() * 0.05;
    this.state[1] = 0.0;
    this.state[2] = 0.0;
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  computeDerivatives(s, out) {
    const x = s[0];
    const y = s[1];
    const z = s[2];

    if (this.attractorType === 'chua') {
      const f_x = this.m1 * x + 0.5 * (this.m0 - this.m1) * (Math.abs(x + 1.0) - Math.abs(x - 1.0));
      out[0] = this.alpha * (y - x - f_x);
      out[1] = x - y + z;
      out[2] = -this.gamma * y;
    } else if (this.attractorType === 'rossler') {
      out[0] = -y - z;
      out[1] = x + 0.2 * y;
      out[2] = 0.2 + z * (x - 5.7);
    } else {
      // Lorenz
      out[0] = this.sigma * (y - x);
      out[1] = x * (this.rho - z) - y;
      out[2] = x * y - this.beta * z;
    }
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const baseDt = (1.0 / this.sampleRate) * 100.0 * this.timeScale;
    
    // In-place RK4 integration (Zero Garbage Collection)
    this.rk4.integrate(this.state, baseDt, this.derivsBound);

    // Clamp sanity
    if (isNaN(this.state[0]) || Math.abs(this.state[0]) > 100.0) {
      this.state[0] = 0.1;
      this.state[1] = 0.0;
      this.state[2] = 0.0;
    }

    let audioOut = 0.0;
    if (this.attractorType === 'lorenz') {
      audioOut = this.state[0] * 0.05;
    } else if (this.attractorType === 'chua') {
      audioOut = this.state[0] * 0.4;
    } else {
      audioOut = this.state[0] * 0.1;
    }

    const amp = this.ampEnv.process();
    return Math.max(-1.0, Math.min(1.0, audioOut)) * amp * (this.velocity || 1.0);
  }

  getMathTelemetry() {
    return {
      type: 'chaos',
      attractorType: this.attractorType,
      state: [...this.state],
      sigma: this.sigma,
      rho: this.rho,
      beta: this.beta,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
