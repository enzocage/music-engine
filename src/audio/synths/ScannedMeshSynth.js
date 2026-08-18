/**
 * Synthesizer 14: Scanned Synthesis & Mass-Spring Mesh
 * Physical mass-spring-damper lattice scanned at audio frequency along orbital trajectories.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class ScannedMeshSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Scanned Synthesis & Mass Mesh';
    this.type = 'scannedmesh';

    this.numMasses = 16;
    this.positions = new Float32Array(this.numMasses);
    this.velocities = new Float32Array(this.numMasses);
    this.forces = new Float32Array(this.numMasses);

    // Parameters (15 parameters)
    this.springTension = 0.35; // Coupling tension between masses
    this.massDamping = 0.015; // Energy loss per step
    this.scanRadius = 0.8; // Orbit radius
    this.scanSpeedMult = 1.0; // Harmonic multiplier
    this.pluckForce = 1.2; // Initial excitation strength
    this.pluckPosition = 0.25; // 0.0 to 1.0 along the chain
    this.nonLinearity = 0.4; // Cubic spring hardening
    this.boundaryMode = 'clamped'; // 'clamped' | 'free' | 'circular'
    this.curvature = 0.5; // Spatial curvature bias
    this.centripetalForce = 0.2;
    this.filterCutoff = 5000;
    this.filterRes = 1.2;
    this.drive = 0.25;

    this.scanPhase = 0.0;
    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.005, 0.4, 0.5, 0.4);

    this.initMesh();
  }

  initMesh() {
    for (let i = 0; i < this.numMasses; i++) {
      const x = (i / (this.numMasses - 1)) * Math.PI;
      this.positions[i] = Math.sin(x) * 0.5;
      this.velocities[i] = 0.0;
    }
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

    // Excite mesh with shaped bell/pluck profile
    const pluckCenter = this.pluckPosition * (this.numMasses - 1);
    for (let i = 0; i < this.numMasses; i++) {
      const dist = Math.abs(i - pluckCenter);
      const impulse = Math.exp(-dist * dist * 0.8) * this.pluckForce * velocity;
      this.velocities[i] += impulse;
      this.positions[i] += impulse * 0.2;
    }

    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  // Physical mass-spring update step
  updatePhysics() {
    const k = this.springTension * 0.4;
    const d = 1.0 - this.massDamping;
    const n = this.numMasses;

    for (let i = 0; i < n; i++) {
      let left = (i > 0) ? this.positions[i - 1] : (this.boundaryMode === 'circular' ? this.positions[n - 1] : 0.0);
      let right = (i < n - 1) ? this.positions[i + 1] : (this.boundaryMode === 'circular' ? this.positions[0] : 0.0);
      
      const disp = this.positions[i];
      let force = k * (left + right - 2.0 * disp);

      // Nonlinear cubic spring hardening: F_nl = -c * x^3
      if (this.nonLinearity > 0.01) {
        force -= this.nonLinearity * (disp * disp * disp) * 0.5;
      }

      this.forces[i] = force;
    }

    for (let i = 0; i < n; i++) {
      this.velocities[i] = (this.velocities[i] + this.forces[i]) * d;
      this.positions[i] += this.velocities[i];
      // Anti-explosion clamp
      if (Math.abs(this.positions[i]) > 5.0) this.positions[i] *= 0.5;
    }
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    // Run physical dynamics sub-stepping
    this.updatePhysics();

    // Audio-rate scanning: The scan head travels across the vibrating masses at pitch frequency
    const scanDt = (this.freq * this.scanSpeedMult) / this.sampleRate;
    this.scanPhase = (this.scanPhase + scanDt) % 1.0;

    // Continuous interpolation across masses
    const massPos = this.scanPhase * (this.numMasses - 1);
    const idx0 = Math.floor(massPos);
    const idx1 = Math.min(this.numMasses - 1, idx0 + 1);
    const frac = massPos - idx0;

    // Hermite-style smooth interpolation
    const val0 = this.positions[idx0];
    const val1 = this.positions[idx1];
    const scannedVal = val0 + frac * (val1 - val0);

    // Orbital modulation
    const orbitMod = fastSin(this.scanPhase * TWO_PI) * this.scanRadius * 0.3;
    let raw = (scannedVal + orbitMod) * (1.0 + this.drive * 2.5);

    raw = fastTanh(raw);

    // ZDF Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    const filtered = this.filter.process(raw).lp;

    const env = this.ampEnv.process();
    return filtered * env * (this.velocity || 1.0) * 0.6;
  }

  getMathTelemetry() {
    return {
      type: 'scannedmesh',
      positions: Array.from(this.positions),
      velocities: Array.from(this.velocities),
      scanPhase: this.scanPhase,
      scanPos: this.scanPhase * (this.numMasses - 1),
      springTension: this.springTension,
      damping: this.massDamping,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
