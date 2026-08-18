/**
 * Multi-Channel Demo Presets & Compositions
 * Rich multi-track arrangements demonstrating all 16 channels and all 22 sound synthesis engines.
 */

export const PRESETS = [
  {
    id: 'cybernetic_symphony',
    name: '⚡ Cybernetic Symphony (22-Module Mix)',
    bpm: 124,
    scale: 'minor',
    description: 'Cyberpunk & Future IDM: 16 channels playing Virtual Analog, Cellular Automata, Fractal Orbits, Wave-Terrain Morphs, and Pulsar Particle Trains.',
    tracks: [
      // Track 0: Subtractive Synth (Deep Bassline)
      { synth: 'subtractive', vol: 0.85, pan: 0.0, pattern: [36, null, null, 36, null, null, 36, null, 38, null, null, 36, null, null, 41, null] },
      // Track 1: FM/PM (Bright Metallic Bell Arp)
      { synth: 'fm', vol: 0.75, pan: -0.4, pattern: [60, 63, 67, 70, 72, 70, 67, 63, 60, 65, 68, 72, 75, 72, 68, 65] },
      // Track 2: Wavetable (Shimmering Pad)
      { synth: 'wavetable', vol: 0.65, pan: 0.4, pattern: [48, null, null, null, 51, null, null, null, 55, null, null, null, 58, null, null, null] },
      // Track 3: Cellular Automata (Organic Pulse Arp)
      { synth: 'cellular', vol: 0.75, pan: -0.5, pattern: [60, 60, null, 63, 60, null, 67, 65, null, 70, 67, null, 72, 72, null, 75] },
      // Track 4: Scanned Mass-Spring Mesh (Acoustic Plucked String)
      { synth: 'scannedmesh', vol: 0.8, pan: 0.3, pattern: [72, null, 67, null, 75, null, 70, null, 74, null, 67, null, 72, null, 63, null] },
      // Track 5: Modal Chladni (Deep Resonant Kick / Plate)
      { synth: 'modal', vol: 0.9, pan: 0.0, pattern: [36, null, null, null, 36, null, null, null, 36, null, null, null, 36, null, null, null] },
      // Track 6: Fractal Julia & Mandelbrot (Complex Crystalline Lead)
      { synth: 'fractal', vol: 0.7, pan: -0.3, pattern: [48, 48, 60, 48, 51, 48, 63, 48, 55, 48, 67, 48, 58, 60, 63, 65] },
      // Track 7: Neural Wave-Terrain Morph (Vocal Bass Growl)
      { synth: 'neuralterrain', vol: 0.8, pan: 0.1, pattern: [36, null, 36, null, 39, null, 41, null, 36, null, 44, null, 43, 41, 39, 36] },
      // Track 8: Bowed String Stick-Slip (Expressive Cello Solo)
      { synth: 'bowedstring', vol: 0.75, pan: -0.6, pattern: [48, null, null, null, 51, null, null, null, 53, null, null, null, 55, null, null, null] },
      // Track 9: Vortex Fluidics & Aeolian Wind (Turbulent Flute Wash)
      { synth: 'vortexfluid', vol: 0.65, pan: 0.5, pattern: [60, null, 63, null, 67, null, 70, null, 72, null, 75, null, 79, null, 75, null] },
      // Track 10: Spectral Freeze & Diffuser (Shimmer Pad)
      { synth: 'spectralfreeze', vol: 0.7, pan: -0.2, pattern: [60, null, null, null, 63, null, null, null, 67, null, null, null, 70, null, null, null] },
      // Track 11: Pulsar & Formant Train (Micro-Acoustic Rhythm)
      { synth: 'pulsartrain', vol: 0.75, pan: 0.6, pattern: [null, 72, null, null, 75, null, 79, null, null, 82, null, 79, null, 75, 72, null] },
      // Track 12: Polytopic 4D Tesseract Vector (Hypercube Pad)
      { synth: 'polytopicvector', vol: 0.7, pan: 0.0, pattern: [48, null, null, null, 48, null, null, null, 51, null, null, null, 53, null, null, null] },
      // Track 13: Stochastic Gendyn (Xenakis Grain Glitch)
      { synth: 'stochasticgendyn', vol: 0.6, pan: -0.7, pattern: [null, 60, null, 63, null, null, 67, null, null, 70, null, null, 72, null, null, null] },
      // Track 14: Formant Vocal Tract (Choir Formant)
      { synth: 'formant', vol: 0.7, pan: 0.4, pattern: [48, null, null, null, 51, null, null, null, 55, null, null, null, 58, null, null, null] },
      // Track 15: Chaos Attractor (Strange Attractor Outro)
      { synth: 'chaos', vol: 0.65, pan: 0.7, pattern: [null, null, 84, null, null, null, 87, null, null, null, 91, null, null, null, 94, null] }
    ]
  },
  {
    id: 'xenakis_archipelago',
    name: '🎲 Xenakis Stochastic Archipelago',
    bpm: 116,
    scale: 'hirajoshi',
    description: 'Experimental mathematical tapestry combining Stochastic Gendyn, Fractal Julia, 4D Tesseract, Scanned String, and Vortex Turbulence.',
    tracks: [
      { synth: 'stochasticgendyn', vol: 0.8, pan: -0.5, pattern: [36, null, 36, null, 37, null, 41, null, 36, null, 42, null, 44, null, 41, null] },
      { synth: 'fractal', vol: 0.75, pan: 0.4, pattern: [60, 61, 65, 66, 72, 66, 65, 61, 60, 65, 66, 72, 73, 72, 66, 65] },
      { synth: 'scannedmesh', vol: 0.8, pan: -0.4, pattern: [48, null, 53, null, 54, null, 60, null, 61, null, 65, null, 66, null, 72, null] },
      { synth: 'bowedstring', vol: 0.7, pan: 0.6, pattern: [48, null, null, null, 49, null, null, null, 53, null, null, null, 54, null, null, null] },
      { synth: 'vortexfluid', vol: 0.75, pan: -0.2, pattern: [null, 60, null, null, 65, null, null, 66, null, null, 72, null, null, 73, null, null] },
      { synth: 'spectralfreeze', vol: 0.8, pan: 0.3, pattern: [60, null, null, null, 61, null, null, null, 65, null, null, null, 66, null, null, null] },
      { synth: 'pulsartrain', vol: 0.75, pan: -0.6, pattern: [60, 60, 61, 61, 65, 65, 66, 66, 72, 72, 73, 73, 72, 66, 65, 61] },
      { synth: 'polytopicvector', vol: 0.85, pan: 0.0, pattern: [36, null, null, null, 36, null, null, null, 37, null, null, null, 41, null, null, null] },
      { synth: 'cellular', vol: 0.7, pan: 0.5, pattern: [72, null, null, 73, null, 77, null, 78, 84, null, 78, null, 77, null, 73, 72] },
      { synth: 'neuralterrain', vol: 0.75, pan: -0.3, pattern: [36, 36, null, 37, 36, null, 41, 37, null, 42, 41, null, 44, 44, null, 48] },
      { synth: 'chaos', vol: 0.65, pan: 0.7, pattern: [null, null, 84, null, null, null, 85, null, null, null, 89, null, null, null, 90, null] },
      { synth: 'bytebeat', vol: 0.5, pan: -0.7, pattern: [48, null, 48, null, 49, null, 53, null, 54, null, 60, null, 61, null, 65, null] },
      { synth: 'modal', vol: 0.85, pan: 0.0, pattern: [36, null, null, null, 36, null, null, null, 36, null, null, null, 36, null, null, null] },
      { synth: 'fm', vol: 0.7, pan: 0.2, pattern: [null, 60, null, 61, null, 65, null, 66, null, 72, null, 73, null, 72, null, 66] },
      { synth: 'waveguide', vol: 0.75, pan: -0.4, pattern: [72, null, 73, null, 77, null, 78, null, 84, null, 85, null, 84, null, 78, null] },
      { synth: 'subtractive', vol: 0.8, pan: 0.0, pattern: [24, null, null, null, 24, null, null, null, 25, null, null, null, 29, null, null, null] }
    ]
  },
  {
    id: 'mathematical_genesis',
    name: '🌀 Mathematical Genesis',
    bpm: 108,
    scale: 'dorian',
    description: 'Algorithmic Fibonacci arpeggios, chaotic strange attractors, modal Chladni resonances, and complex spinor harmonic pads.',
    tracks: [
      { synth: 'subtractive', vol: 0.8, pan: 0.0, pattern: [38, null, null, null, 38, null, null, 38, 41, null, null, null, 43, null, 45, null] },
      { synth: 'fm', vol: 0.7, pan: -0.5, pattern: [62, 65, 69, 72, 74, 72, 69, 65, 62, 67, 70, 74, 76, 74, 70, 67] },
      { synth: 'waveguide', vol: 0.75, pan: 0.5, pattern: [74, null, 69, null, 77, null, 72, null, 76, null, 69, null, 74, null, 65, null] },
      { synth: 'modal', vol: 0.85, pan: 0.0, pattern: [38, null, null, 50, null, null, 38, null, 41, null, null, 53, null, null, 45, null] },
      { synth: 'additive', vol: 0.65, pan: -0.3, pattern: [50, null, 53, null, 57, null, 60, null, 62, null, 65, null, 67, null, 69, null] },
      { synth: 'chaos', vol: 0.7, pan: 0.6, pattern: [null, 62, null, null, 65, null, null, 69, null, null, 72, null, null, 74, null, null] },
      { synth: 'phasedist', vol: 0.7, pan: -0.4, pattern: [50, 50, 62, 50, 53, 50, 65, 50, 57, 50, 69, 50, 60, 62, 65, 67] },
      { synth: 'granular', vol: 0.6, pan: 0.3, pattern: [62, null, null, null, null, null, null, null, 65, null, null, null, null, null, null, null] },
      { synth: 'formant', vol: 0.75, pan: 0.0, pattern: [50, null, null, null, 53, null, null, null, 55, null, null, null, 57, null, null, null] },
      { synth: 'sampler', vol: 0.6, pan: -0.2, pattern: [62, null, null, 65, null, null, 69, null, null, 72, null, null, 74, null, null, 77] },
      { synth: 'bytebeat', vol: 0.55, pan: 0.4, pattern: [50, null, null, 50, null, 53, null, null, 55, null, null, 57, null, 60, null, null] },
      { synth: 'wavetable', vol: 0.7, pan: -0.6, pattern: [74, null, null, 77, null, null, 81, null, null, 84, null, null, 86, null, null, 89] },
      { synth: 'subtractive', vol: 0.8, pan: 0.0, pattern: [26, null, null, null, 26, null, null, null, 29, null, null, null, 31, null, null, null] },
      { synth: 'fm', vol: 0.65, pan: 0.2, pattern: [null, 38, null, 38, null, 38, null, 38, null, 41, null, 41, null, 43, null, 45] },
      { synth: 'modal', vol: 0.65, pan: -0.7, pattern: [null, null, 86, null, null, null, 89, null, null, null, 93, null, null, null, 96, null] },
      { synth: 'additive', vol: 0.6, pan: 0.7, pattern: [74, 76, 77, 81, 84, 81, 77, 76, 74, 77, 81, 84, 86, 84, 81, 77] }
    ]
  },
  {
    id: 'quantum_resonance',
    name: '🌌 Quantum Resonance (Ambient)',
    bpm: 88,
    scale: 'pentatonic_minor',
    description: 'Ethereal ambient soundscape with rich Karplus-Strong harp echoes, Formant vocal choirs, and CloudSeed diffusion reverb.',
    tracks: [
      { synth: 'waveguide', vol: 0.8, pan: -0.4, pattern: [60, null, 63, null, 65, null, 67, null, 70, null, 72, null, 75, null, 72, null] },
      { synth: 'wavetable', vol: 0.7, pan: 0.4, pattern: [48, null, null, null, 51, null, null, null, 55, null, null, null, 58, null, null, null] },
      { synth: 'formant', vol: 0.8, pan: 0.0, pattern: [48, null, null, null, 51, null, null, null, 53, null, null, null, 55, null, null, null] },
      { synth: 'modal', vol: 0.75, pan: -0.6, pattern: [72, null, null, null, 75, null, null, null, 79, null, null, null, 82, null, null, null] },
      { synth: 'granular', vol: 0.7, pan: 0.6, pattern: [60, null, null, null, null, null, null, null, 63, null, null, null, null, null, null, null] },
      { synth: 'additive', vol: 0.65, pan: -0.2, pattern: [60, 63, 65, 67, 70, 67, 65, 63, 60, 65, 67, 70, 72, 70, 67, 65] },
      { synth: 'fm', vol: 0.6, pan: 0.3, pattern: [null, null, 72, null, null, null, 75, null, null, null, 79, null, null, null, 82, null] },
      { synth: 'subtractive', vol: 0.8, pan: 0.0, pattern: [36, null, null, null, 36, null, null, null, 39, null, null, null, 41, null, null, null] },
      { synth: 'sampler', vol: 0.65, pan: -0.5, pattern: [60, null, 63, null, 67, null, 70, null, 72, null, 75, null, 79, null, 75, null] },
      { synth: 'chaos', vol: 0.5, pan: 0.7, pattern: [null, null, null, 60, null, null, null, 63, null, null, null, 67, null, null, null, 70] },
      { synth: 'phasedist', vol: 0.6, pan: -0.3, pattern: [48, null, null, 48, null, null, 51, null, null, 53, null, null, 55, null, null, null] },
      { synth: 'bytebeat', vol: 0.45, pan: 0.5, pattern: [48, null, null, null, 51, null, null, null, 53, null, null, null, 55, null, null, null] },
      { synth: 'subtractive', vol: 0.75, pan: 0.0, pattern: [24, null, null, null, 24, null, null, null, 27, null, null, null, 29, null, null, null] },
      { synth: 'waveguide', vol: 0.7, pan: 0.2, pattern: [null, 72, null, 75, null, 79, null, 82, null, 84, null, 82, null, 79, null, 75] },
      { synth: 'modal', vol: 0.6, pan: -0.7, pattern: [null, null, 84, null, null, null, 87, null, null, null, 91, null, null, null, 94, null] },
      { synth: 'wavetable', vol: 0.65, pan: 0.1, pattern: [60, null, null, null, 63, null, null, null, 65, null, null, null, 67, null, null, null] }
    ]
  }
];
