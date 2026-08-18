/**
 * Synth Factory: Dynamically instantiates and manages any of the 22 sound synthesis engines.
 */
import { SubtractiveSynth } from './synths/SubtractiveSynth.js';
import { WavetableSynth } from './synths/WavetableSynth.js';
import { FMSynth } from './synths/FMSynth.js';
import { PhaseDistSynth } from './synths/PhaseDistSynth.js';
import { PhysicalStringSynth } from './synths/PhysicalStringSynth.js';
import { ModalSynth } from './synths/ModalSynth.js';
import { AdditiveSynth } from './synths/AdditiveSynth.js';
import { GranularSynth } from './synths/GranularSynth.js';
import { FormantSynth } from './synths/FormantSynth.js';
import { SamplerSynth } from './synths/SamplerSynth.js';
import { ChaosSynth } from './synths/ChaosSynth.js';
import { BytebeatSynth } from './synths/BytebeatSynth.js';

// 10 New Advanced Sound Generation Modules
import { CellularSynth } from './synths/CellularSynth.js';
import { ScannedMeshSynth } from './synths/ScannedMeshSynth.js';
import { FractalSynth } from './synths/FractalSynth.js';
import { NeuralTerrainSynth } from './synths/NeuralTerrainSynth.js';
import { StochasticGendynSynth } from './synths/StochasticGendynSynth.js';
import { BowedStringSynth } from './synths/BowedStringSynth.js';
import { VortexFluidSynth } from './synths/VortexFluidSynth.js';
import { SpectralFreezeSynth } from './synths/SpectralFreezeSynth.js';
import { PulsarTrainSynth } from './synths/PulsarTrainSynth.js';
import { PolytopicVectorSynth } from './synths/PolytopicVectorSynth.js';

export const SYNTH_TYPES = [
  // Classic & Modern Foundations
  { id: 'subtractive', name: 'Virtual Analog (VA)', class: SubtractiveSynth, color: '#00f0ff', category: 'Classic', desc: 'PolyBLEP bandlimited oscillators with zero-delay filter' },
  { id: 'wavetable', name: 'Wavetable & Spectral', class: WavetableSynth, color: '#00e5ff', category: 'Modern', desc: 'Single-cycle dynamic morphing with 3D waterfall display' },
  { id: 'fm', name: '6-Operator FM/PM', class: FMSynth, color: '#7b2cbf', category: 'Modulation', desc: 'Phase modulation matrix with Bessel harmonic expansion' },
  { id: 'phasedist', name: 'Phase Distortion & Wavefolder', class: PhaseDistSynth, color: '#f72585', category: 'Modulation', desc: 'Casio CZ phase distortion transfer functions' },
  
  // Physical Modeling & Acoustics
  { id: 'waveguide', name: 'Karplus-Strong String', class: PhysicalStringSynth, color: '#4cc9f0', category: 'Physical', desc: 'Recursive waveguide string with pick comb-filtering' },
  { id: 'modal', name: 'Modal & Chladni Plates', class: ModalSynth, color: '#4361ee', category: 'Physical', desc: '2D vibrational plates and bells with biquad mode banks' },
  { id: 'bowedstring', name: 'Bowed String & Stick-Slip', class: BowedStringSynth, color: '#ff5400', category: 'Physical', desc: 'Helmholtz stick-slip friction dynamics & violin body' },
  { id: 'scannedmesh', name: 'Scanned Synthesis & Mass Mesh', class: ScannedMeshSynth, color: '#118ab2', category: 'Physical', desc: 'Orbital audio scanning across vibrating mass-spring lattice' },
  
  // Spectral & Formant Resonators
  { id: 'additive', name: 'Additive Partial Bank', class: AdditiveSynth, color: '#ffb703', category: 'Spectral', desc: '32-partial harmonic series with inharmonicity controls' },
  { id: 'formant', name: 'Formant & Vocal Tract', class: FormantSynth, color: '#e63946', category: 'Acoustic', desc: 'FOF vowel formant synthesis (A-E-I-O-U)' },
  { id: 'vortexfluid', name: 'Vortex Fluidics & Aeolian Wind', class: VortexFluidSynth, color: '#3a86ff', category: 'Acoustic', desc: 'Kármán vortex street shedding & acoustic pipe turbulence' },
  { id: 'spectralfreeze', name: 'Spectral Freeze & Diffuser', class: SpectralFreezeSynth, color: '#00b4d8', category: 'Spectral', desc: 'Real-time spectral hold, blur, phase scramble & shimmer' },
  
  // Sample & Granular
  { id: 'granular', name: 'Granular Micro-Sound', class: GranularSynth, color: '#fb8500', category: 'Sample', desc: 'Polyphonic micro-grain clouds with random spray' },
  { id: 'sampler', name: 'Multi-Zone Sampler', class: SamplerSynth, color: '#2a9d8f', category: 'Sample', desc: 'Multi-sample playback engine with loop points' },
  
  // Nonlinear, Chaos & Fractal Math
  { id: 'chaos', name: 'Chaotic Attractors & DGLs', class: ChaosSynth, color: '#70e000', category: 'Nonlinear', desc: 'Audio-rate Runge-Kutta 4 Lorenz, Rössler & Chua systems' },
  { id: 'fractal', name: 'Fractal Julia & Mandelbrot', class: FractalSynth, color: '#d90429', category: 'Mathematical', desc: 'Audio-rate complex plane escape-time spectral resynthesis' },
  { id: 'neuralterrain', name: 'Neural Wave-Terrain Morph', class: NeuralTerrainSynth, color: '#8338ec', category: 'Nonlinear', desc: '3D non-linear potential field scanning along 2D/3D orbits' },
  
  // Algorithmic, Quantum & Vector
  { id: 'bytebeat', name: 'Bytebeat & Bitwise Math', class: BytebeatSynth, color: '#38b000', category: 'Mathematical', desc: '1-line bitwise mathematical expressions at 8/16kHz' },
  { id: 'cellular', name: 'Cellular Automata (Wolfram & Life)', class: CellularSynth, color: '#06d6a0', category: 'Quantum', desc: '1D Wolfram & 2D Life cellular state evolution & pulse trains' },
  { id: 'pulsartrain', name: 'Pulsar & Formant Train', class: PulsarTrainSynth, color: '#ffbe0b', category: 'Quantum', desc: 'Curtis Roads pulsar micro-acoustic bursts with window masking' },
  { id: 'stochasticgendyn', name: 'Stochastic Gendyn (Xenakis)', class: StochasticGendynSynth, color: '#ff006e', category: 'Experimental', desc: 'Dynamic stochastic breakpoint random walks with elastic barriers' },
  { id: 'polytopicvector', name: 'Polytopic 4D Hypercube Vector', class: PolytopicVectorSynth, color: '#9d4edd', category: 'Modern', desc: '4D Tesseract geometry with 16 vertex oscillators & 4D rotation' }
];

export function createSynth(typeId, sampleRate = 44100) {
  const match = SYNTH_TYPES.find(t => t.id === typeId);
  if (match) {
    return new match.class(sampleRate);
  }
  return new SubtractiveSynth(sampleRate);
}

export function getNextSynthId(currentId) {
  const idx = SYNTH_TYPES.findIndex(t => t.id === currentId);
  if (idx === -1) return SYNTH_TYPES[0].id;
  return SYNTH_TYPES[(idx + 1) % SYNTH_TYPES.length].id;
}

export function getPrevSynthId(currentId) {
  const idx = SYNTH_TYPES.findIndex(t => t.id === currentId);
  if (idx === -1) return SYNTH_TYPES[0].id;
  return SYNTH_TYPES[(idx - 1 + SYNTH_TYPES.length) % SYNTH_TYPES.length].id;
}
