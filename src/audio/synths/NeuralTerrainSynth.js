/**
 * Synthesizer 16: Neural Wave-Terrain Morph Synth
 * Non-linear 3D potential landscapes scanned by multi-axis orbital modulators & wave-terrain folding.
 */
import { ADSREnvelope, ZDFFilter, fastTanh, fastSin, TWO_PI } from '../DSPUtils.js';

export class NeuralTerrainSynth {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.name = 'Neural Wave-Terrain Morph';
    this.type = 'neuralterrain';

    // Parameters (16 parameters)
    this.terrainType = 'saddle'; // 'saddle' | 'ripple' | 'poly' | 'torus'
    this.orbitType = 'lissajous'; // 'lissajous' | 'rose' | 'spiral' | 'epicycloid'
    this.orbitRatioX = 1.0;
    this.orbitRatioY = 2.0;
    this.radiusX = 1.2;
    this.radiusY = 1.0;
    this.centerX = 0.0;
    this.centerY = 0.0;
    this.elevation = 1.4;
    this.wavefoldDrive = 0.5;
    this.smoothing = 0.3;
    this.formantShift = 1.0;
    this.filterCutoff = 5500;
    this.filterRes = 1.6;

    this.phaseX = 0.0;
    this.phaseY = 0.0;
    this.orbitZ = 0.0;
    this.currentX = 0.0;
    this.currentY = 0.0;

    this.freq = 220.0;
    this.velocity = 1.0;
    this.active = false;

    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);

    this.ampEnv = new ADSREnvelope();
    this.ampEnv.setSampleRate(sampleRate);
    this.ampEnv.setParameters(0.01, 0.35, 0.6, 0.3);
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
    this.ampEnv.trigger();
  }

  noteOff() {
    this.ampEnv.releaseNote();
  }

  // 3D Mathematical Terrain Height Function z = f(x, y)
  evaluateTerrain(x, y) {
    switch (this.terrainType) {
      case 'ripple': {
        const r2 = x * x + y * y + 1e-4;
        const r = Math.sqrt(r2);
        return (Math.sin(r * 4.0 * this.formantShift) / (1.0 + r * 0.5)) * this.elevation;
      }
      case 'poly': {
        // High-order polynomial landscape
        const term1 = x * (x * x - 3.0 * y * y); // Monkey saddle: x^3 - 3xy^2
        const term2 = Math.cos(x * 2.0) * Math.sin(y * 2.0);
        return (term1 * 0.3 + term2 * 0.7) * this.elevation;
      }
      case 'torus': {
        // Toroidal potential field
        const R = 1.5;
        const r = Math.sqrt(x * x + y * y);
        return Math.sin((r - R) * 4.0) * Math.cos(Math.atan2(y, x) * 3.0) * this.elevation;
      }
      case 'saddle':
      default: {
        // Hyperbolic paraboloid: z = (x^2 - y^2) + sin(xy)
        return (x * x - y * y + Math.sin(x * y * 3.0)) * 0.5 * this.elevation;
      }
    }
  }

  process() {
    if (!this.active && !this.ampEnv.isActive()) return 0.0;

    const dtX = (this.freq * this.orbitRatioX) / this.sampleRate;
    const dtY = (this.freq * this.orbitRatioY) / this.sampleRate;

    this.phaseX = (this.phaseX + dtX) % 1.0;
    this.phaseY = (this.phaseY + dtY) % 1.0;

    // Compute 2D scanning orbit (x, y)
    let x = 0.0, y = 0.0;
    const px = this.phaseX * TWO_PI;
    const py = this.phaseY * TWO_PI;

    if (this.orbitType === 'rose') {
      const k = 3;
      const r = Math.cos(k * px) * this.radiusX;
      x = r * Math.cos(px) + this.centerX;
      y = r * Math.sin(px) * (this.radiusY / this.radiusX) + this.centerY;
    } else if (this.orbitType === 'spiral') {
      const r = (this.phaseX * 0.8 + 0.2) * this.radiusX;
      x = r * Math.cos(px * 2.0) + this.centerX;
      y = r * Math.sin(px * 2.0) * (this.radiusY / this.radiusX) + this.centerY;
    } else {
      // Lissajous
      x = Math.sin(px) * this.radiusX + this.centerX;
      y = Math.cos(py) * this.radiusY + this.centerY;
    }

    this.currentX = x;
    this.currentY = y;

    // Sample terrain elevation z = f(x, y)
    const rawZ = this.evaluateTerrain(x, y);
    this.orbitZ = rawZ;

    // Non-linear wavefolding & saturation
    let shaped = rawZ * (1.0 + this.wavefoldDrive * 3.0);
    // Sine wavefolder: y = sin(x)
    shaped = Math.sin(shaped);

    // ZDF Filter
    this.filter.setParameters(this.filterCutoff, this.filterRes);
    const output = this.filter.process(shaped).lp;

    const env = this.ampEnv.process();
    return output * env * (this.velocity || 1.0) * 0.55;
  }

  getMathTelemetry() {
    return {
      type: 'neuralterrain',
      terrainType: this.terrainType,
      orbitType: this.orbitType,
      orbitX: this.currentX,
      orbitY: this.currentY,
      orbitZ: this.orbitZ,
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      elevation: this.elevation,
      freq: this.freq,
      amp: this.ampEnv.value
    };
  }
}
