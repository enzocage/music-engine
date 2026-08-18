/**
 * Synthesizer 22: Polytopic 4D Hypercube Vector Synth
 * 4D Tesseract geometry with 16 vertex oscillators and 4D isometric rotation matrix interpolation.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class PolytopicVectorSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Polytopic 4D Hypercube Vector';
    this.type = 'polytopicvector';

    this.numVertices = 16;
    // 16 4D Tesseract vertices (±1, ±1, ±1, ±1)
    this.baseVertices = [];
    for (let i = 0; i < 16; i++) {
      this.baseVertices.push([
        (i & 1) ? 1.0 : -1.0,
        (i & 2) ? 1.0 : -1.0,
        (i & 4) ? 1.0 : -1.0,
        (i & 8) ? 1.0 : -1.0
      ]);
    }

    this.rotatedVertices = this.baseVertices.map(v => [...v]);
    this.vertexWeights = new Float32Array(this.numVertices);
    this.vertexPhases = new Float32Array(this.numVertices);

    // 4D Rotation angles
    this.angleXW = 0.0;
    this.angleYZ = 0.0;
    this.angleZW = 0.0;

    // Parameters (16 parameters)
    this.speedXW = 0.6; // 4D rotation rate X-W plane
    this.speedYZ = 0.4; // 4D rotation rate Y-Z plane
    this.speedZW = 0.3; // 4D rotation rate Z-W plane
    this.morphX = 0.0; // Dynamic 4D listener position
    this.morphY = 0.0;
    this.hyperRadius = 1.4;
    this.vertexSymmetry = 0.8;
    this.inharmonicity = 0.02;
    this.harmonicsCount = 4;
    this.detuneSpread = 0.003;
    this.drive = 0.25;
    this.filterCutoff = 6500;
    this.filterRes = 1.3;

    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.03, 0.4, 0.75, 0.5);
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
    for (let i = 0; i < this.numVertices; i++) {
      this.vertexPhases[i] = Math.random();
    }
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  // 4D Isometric Rotation Matrix
  update4DRotation() {
    const dt = 1.0 / this.sampleRate;
    this.angleXW += this.speedXW * dt * 2.0;
    this.angleYZ += this.speedYZ * dt * 2.0;
    this.angleZW += this.speedZW * dt * 2.0;

    const cosXW = Math.cos(this.angleXW), sinXW = Math.sin(this.angleXW);
    const cosYZ = Math.cos(this.angleYZ), sinYZ = Math.sin(this.angleYZ);
    const cosZW = Math.cos(this.angleZW), sinZW = Math.sin(this.angleZW);

    // Apply 4D rotations to all 16 vertices & calculate proximity weights to listener
    let totalWeight = 0.0;
    const px = this.morphX, py = this.morphY, pz = 0.0, pw = 0.0;

    for (let i = 0; i < 16; i++) {
      let [x, y, z, w] = this.baseVertices[i];

      // Rotate in X-W plane
      const x1 = x * cosXW - w * sinXW;
      const w1 = x * sinXW + w * cosXW;

      // Rotate in Y-Z plane
      const y1 = y * cosYZ - z * sinYZ;
      const z1 = y * sinYZ + z * cosYZ;

      // Rotate in Z-W plane
      const z2 = z1 * cosZW - w1 * sinZW;
      const w2 = z1 * sinZW + w1 * cosZW;

      this.rotatedVertices[i][0] = x1;
      this.rotatedVertices[i][1] = y1;
      this.rotatedVertices[i][2] = z2;
      this.rotatedVertices[i][3] = w2;

      // 4D Euclidean distance to listener point (px, py, pz, pw)
      const dx = x1 - px;
      const dy = y1 - py;
      const dz = z2 - pz;
      const dw = w2 - pw;
      const dist4D = Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw) + 0.1;

      // Inverse distance weighting
      const weight = 1.0 / Math.pow(dist4D, 2.5);
      this.vertexWeights[i] = weight;
      totalWeight += weight;
    }

    // Normalize weights
    if (totalWeight > 1e-6) {
      const invTotal = 1.0 / totalWeight;
      for (let i = 0; i < 16; i++) {
        this.vertexWeights[i] *= invTotal;
      }
    }
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    this.update4DRotation();

    let output = 0.0;
    const nyquist = this.sampleRate * 0.48;

    for (let i = 0; i < 16; i++) {
      const weight = this.vertexWeights[i];
      if (weight < 0.005) continue;

      // Harmonic & inharmonic detune per vertex
      const harmonicRatio = 1.0 + (i % this.harmonicsCount) * 0.5;
      const detune = 1.0 + ((i - 7.5) * this.detuneSpread);
      const vFreq = this.freq * harmonicRatio * detune;

      if (vFreq >= nyquist) continue;

      const dt = vFreq / this.sampleRate;
      this.vertexPhases[i] = (this.vertexPhases[i] + dt) % 1.0;

      const oscVal = fastSin(this.vertexPhases[i] * TWO_PI);
      output += oscVal * weight;
    }

    output = fastTanh(output * (1.0 + this.drive * 3.0));

    // ZDF Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    output = this.filter.process(output).lp;

    const env = this.ampEnv.process();
    return output * env * (this.velocity || 1.0) * 0.7;
  }

  getMathTelemetry() {
    return {
      type: 'polytopicvector',
      numVertices: this.numVertices,
      vertexWeights: Array.from(this.vertexWeights),
      rotatedVertices: this.rotatedVertices.map(v => [...v]),
      angleXW: this.angleXW,
      angleYZ: this.angleYZ,
      angleZW: this.angleZW,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
