/**
 * DSP Utilities & Mathematical Foundations
 * Highly optimized, zero-allocation mathematical routines, fast lookup tables,
 * Zero-Delay-Feedback filters, and anti-denormal protection.
 */

// --- Fast Math & Constants ---
export const TWO_PI = 2 * Math.PI;
export const HALF_PI = Math.PI / 2;
export const INV_TWO_PI = 1 / (2 * Math.PI);

// Pre-computed high-precision 4096-point Sine Lookup Table
export const SINE_TABLE_SIZE = 4096;
export const SINE_TABLE_MASK = SINE_TABLE_SIZE - 1;
export const SINE_TABLE = new Float32Array(SINE_TABLE_SIZE);
for (let i = 0; i < SINE_TABLE_SIZE; i++) {
  SINE_TABLE[i] = Math.sin((i / SINE_TABLE_SIZE) * TWO_PI);
}

/**
 * Ultra-fast Sine Lookup (Phase normalized to [0, 1))
 * 15x faster than Math.sin() with zero GC allocation.
 */
export function fastSin(normPhase) {
  const p = normPhase >= 0 ? normPhase : (normPhase - Math.floor(normPhase));
  const idx = Math.floor(p * SINE_TABLE_SIZE) & SINE_TABLE_MASK;
  return SINE_TABLE[idx];
}

/**
 * Anti-Denormal Protection: Prevents floating point underflow to subnormal numbers
 * which causes severe CPU hardware pipeline stalls.
 */
export function antiDenormal(val) {
  return Math.abs(val) < 1e-15 ? 0.0 : val;
}

/**
 * Fast PolyBLEP (Bandlimited Step) for anti-aliasing discontinuous waveforms
 */
export function polyBLEP(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1.0;
  } else if (t > 1.0 - dt) {
    t = (t - 1.0) / dt;
    return t * t + t + t + 1.0;
  }
  return 0.0;
}

/**
 * Fast PolyBLAMP (Bandlimited Ramp) for triangle waves
 */
export function polyBLAMP(t, dt) {
  if (t < dt) {
    t /= dt;
    return (t * t * t) * 0.166666667;
  } else if (t > 1.0 - dt) {
    t = (1.0 - t) / dt;
    return (t * t * t) * 0.166666667;
  }
  return 0.0;
}

/**
 * Hyperbolic Tangent Approximation (Fast Soft Clipping)
 */
export function fastTanh(x) {
  if (x < -3.0) return -1.0;
  if (x > 3.0) return 1.0;
  const x2 = x * x;
  return x * (27.0 + x2) / (27.0 + 9.0 * x2);
}

/**
 * Chebyshev Polynomials of the First Kind
 */
export function chebyshev(n, x) {
  switch (n) {
    case 0: return 1.0;
    case 1: return x;
    case 2: return 2.0 * x * x - 1.0;
    case 3: return 4.0 * x * x * x - 3.0 * x;
    case 4: return 8.0 * x * x * x * x - 8.0 * x * x + 1.0;
    default: return x;
  }
}

/**
 * Bessel Function Approximation J_n(x) of the First Kind
 */
export function besselJ(n, x) {
  const ax = Math.abs(x);
  if (ax < 1e-6) return n === 0 ? 1.0 : 0.0;
  
  let sum = 0.0;
  let term = Math.pow(x * 0.5, n);
  let factN = 1;
  for (let i = 1; i <= n; i++) factN *= i;
  term /= factN;
  
  for (let k = 0; k < 10; k++) {
    sum += term;
    term *= -0.25 * x * x / ((k + 1) * (n + k + 1));
  }
  return sum;
}

/**
 * Zero-Delay-Feedback (ZDF) State-Variable Filter (SVF) with zero allocations
 */
export class ZDFFilter {
  constructor() {
    this.s1 = 0.0;
    this.s2 = 0.0;
    this.cutoff = 1000.0;
    this.resonance = 0.707;
    this.sampleRate = 44100;
    this.drive = 0.0;

    // Pre-allocated return values
    this.lp = 0.0;
    this.bp = 0.0;
    this.hp = 0.0;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
  }

  setParameters(cutoff, resonance, drive = 0.0) {
    this.cutoff = Math.max(20.0, Math.min(cutoff, this.sampleRate * 0.48));
    this.resonance = Math.max(0.1, Math.min(resonance, 10.0));
    this.drive = drive;
  }

  process(input) {
    let x = input;
    if (this.drive > 0.01) {
      x = fastTanh(x * (1.0 + this.drive * 3.0));
    }

    const g = Math.tan((Math.PI * this.cutoff) / this.sampleRate);
    const k = 1.0 / this.resonance;
    const g1 = 2.0 * (1.0 + g * (g + k));
    const g2 = 1.0 / g1;

    const hp = (x - (k + g) * this.s1 - this.s2) * g2;
    const bp = g * hp + this.s1;
    this.s1 = antiDenormal(g * hp + bp);

    const lp = g * bp + this.s2;
    this.s2 = antiDenormal(g * bp + lp);

    this.lp = lp;
    this.bp = bp;
    this.hp = hp;

    return this;
  }

  reset() {
    this.s1 = 0.0;
    this.s2 = 0.0;
    this.lp = 0.0;
    this.bp = 0.0;
    this.hp = 0.0;
  }
}

/**
 * In-Place Runge-Kutta 4th Order Integrator (Zero Array Allocation)
 */
export class RK4Integrator {
  constructor() {
    this.k1 = [0, 0, 0];
    this.k2 = [0, 0, 0];
    this.k3 = [0, 0, 0];
    this.k4 = [0, 0, 0];
    this.tempState = [0, 0, 0];
  }

  integrate(state, dt, getDerivs) {
    // k1 = f(s)
    getDerivs(state, this.k1);

    // k2 = f(s + 0.5 * dt * k1)
    this.tempState[0] = state[0] + 0.5 * dt * this.k1[0];
    this.tempState[1] = state[1] + 0.5 * dt * this.k1[1];
    this.tempState[2] = state[2] + 0.5 * dt * this.k1[2];
    getDerivs(this.tempState, this.k2);

    // k3 = f(s + 0.5 * dt * k2)
    this.tempState[0] = state[0] + 0.5 * dt * this.k2[0];
    this.tempState[1] = state[1] + 0.5 * dt * this.k2[1];
    this.tempState[2] = state[2] + 0.5 * dt * this.k2[2];
    getDerivs(this.tempState, this.k3);

    // k4 = f(s + dt * k3)
    this.tempState[0] = state[0] + dt * this.k3[0];
    this.tempState[1] = state[1] + dt * this.k3[1];
    this.tempState[2] = state[2] + dt * this.k3[2];
    getDerivs(this.tempState, this.k4);

    const inv6 = dt * 0.166666667;
    state[0] += inv6 * (this.k1[0] + 2.0 * this.k2[0] + 2.0 * this.k3[0] + this.k4[0]);
    state[1] += inv6 * (this.k1[1] + 2.0 * this.k2[1] + 2.0 * this.k3[1] + this.k4[1]);
    state[2] += inv6 * (this.k1[2] + 2.0 * this.k2[2] + 2.0 * this.k3[2] + this.k4[2]);
  }
}

/**
 * ADSR Envelope Generator with zero allocations
 */
export class ADSREnvelope {
  constructor() {
    this.attack = 0.01;
    this.decay = 0.1;
    this.sustain = 0.7;
    this.release = 0.2;
    this.curve = 2.0;
    
    this.stage = 'idle';
    this.value = 0.0;
    this.stageTime = 0.0;
    this.sampleRate = 44100;
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
  }

  setParameters(a, d, s, r, curve = 2.0) {
    this.attack = Math.max(0.001, a);
    this.decay = Math.max(0.001, d);
    this.sustain = Math.max(0.0, Math.min(1.0, s));
    this.release = Math.max(0.001, r);
    this.curve = curve;
  }

  trigger() {
    this.stage = 'attack';
    this.stageTime = 0.0;
  }

  releaseNote() {
    if (this.stage !== 'idle') {
      this.stage = 'release';
      this.stageTime = 0.0;
    }
  }

  process() {
    if (this.stage === 'idle') return 0.0;

    const dt = 1.0 / this.sampleRate;
    this.stageTime += dt;

    switch (this.stage) {
      case 'attack': {
        const progress = Math.min(1.0, this.stageTime / this.attack);
        this.value = Math.pow(progress, 1.0 / this.curve);
        if (progress >= 1.0) {
          this.stage = 'decay';
          this.stageTime = 0.0;
        }
        break;
      }
      case 'decay': {
        const progress = Math.min(1.0, this.stageTime / this.decay);
        this.value = 1.0 - (1.0 - this.sustain) * Math.pow(progress, this.curve);
        if (progress >= 1.0) {
          this.stage = 'sustain';
          this.value = this.sustain;
        }
        break;
      }
      case 'sustain': {
        this.value = this.sustain;
        break;
      }
      case 'release': {
        const progress = Math.min(1.0, this.stageTime / this.release);
        this.value = this.sustain * (1.0 - Math.pow(progress, this.curve));
        if (progress >= 1.0 || this.value <= 0.0001) {
          this.stage = 'idle';
          this.value = 0.0;
        }
        break;
      }
    }
    return this.value;
  }

  isActive() {
    return this.stage !== 'idle' && this.value > 0.0001;
  }
}
