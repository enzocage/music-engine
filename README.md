# 🌌 Universal Music Engine (22-Module Polyphonic 3D Synthesizer Workstation)

[![Built with Three.js](https://img.shields.io/badge/3D-Three.js-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-blue?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![JavaScript ES Modules](https://img.shields.io/badge/ECMAScript-2024+-F7DF1E?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

A cutting-edge, in-browser **16-Channel Universal Audio Workstation & Mathematical Sound Synthesis Laboratory**. Combines real-time digital signal processing (DSP), zero-allocation audio loops, 22 distinct sound synthesis paradigms, 3D WebGL GPU telemetry visualizers, generative algorithmic sequencers, and an expressive performance interface.

---

## ⚡ Core Highlights

- **16 Polyphonic Audio Channels**: 4-voice polyphony per channel (64 concurrent hardware-accelerated voices).
- **22 Mathematical & Physical Synthesis Modules**: Ranging from classical subtractive analog modeling to 4D hypercube vector projection, cellular automata, fractal Julia sets, and Xenakis stochastic dynamics.
- **Real-Time 3D GPU Telemetry**: Synchronized Three.js visualizer featuring Hyper-Spherical orbital interplay, 16-channel matrix arrays, and channel-specific Mathematical Deep-Dive views.
- **Zero-Allocation Real-Time Audio Loop**: Optimized 1024-sample circular buffers with anti-denormal protection, ZDF (Zero-Delay Feedback) filters, and zero memory allocation during audio rendering.
- **Generative Algorithmic Sequencer**: Euclidean rhythm generator ($E(k, n)$), Fibonacci sequence generator, scale quantization across 10 musical scales, and swing engine.
- **Master FX Chain**: High-density CloudSeed algorithmic diffusion reverb, cross-feedback stereo delay, and lookahead peak limiter.
- **Module Stepper & Parameter Randomizer**: Instant browsing across all 22 synthesizers with hotkeys (`[` / `]`), parameter randomization, and 10–20 parameters per module.
- **Live Musical Keyboard**: Polyphonic musical typing with octave transpositions and real-time visual feedback.

---

## 🎛️ The 22 Sound Synthesis Modules

Each module represents a unique mathematical or physical acoustic model:

| # | Module | Category | DSP & Mathematical Model | 3D Visualization |
|---|---|---|---|---|
| 1 | **Virtual Analog (VA)** | `Classic` | Bandlimited PolyBLEP oscillators (Saw/Square/Triangle), 4-pole ZDF SVF filter with saturation drive. | Pulsing resonant waveforms & filter poles. |
| 2 | **Wavetable & Spectral** | `Modern` | Real-time morphing across 4 wavetables with spectral tilt, formants, and Chebyshev wavefolding. | 3D Terrain wavetable morph ribbon. |
| 3 | **6-Operator FM / PM** | `Modulation` | 6-Operator Phase Modulation: $y(t) = \sin(\omega_c t + I\sin(\omega_m t))$, configurable feedback loops & Bessel ratios. | 6 Orbiting planetary operator nodes with modulation vectors. |
| 4 | **Phase Distortion & Wavefolder** | `Modulation` | Casio CZ-style cosine phase distortion $\phi'(t) = f(\phi(t))$ cascaded into West Coast wavefolding. | Distorted cosine transfer curve. |
| 5 | **Karplus-Strong Waveguide** | `Physical` | Digital waveguide 1D wave equation with fractional allpass interpolation, comb excitation, and damping. | Displaced plucked string wireframe. |
| 6 | **Modal & Chladni Plates** | `Physical` | Bank of 12 uncoupled second-order resonant bandpass filters modeling 2D vibrational eigenmodes. | Chladni nodal plate vibration modes. |
| 7 | **Bowed String (Stick-Slip)** | `Physical` | Helmholtz non-linear friction curve $\mu(v_{rel})$, rosin hysteresis, and violin body wood/air cavities. | Vibrating bowed string with rosin contact indicator. |
| 8 | **Scanned Synthesis** | `Physical` | 16-mass-spring-damper lattice $M\ddot{u}_i = K(u_{i-1} + u_{i+1} - 2u_i) - cu_i^3$ scanned along orbital loops. | 3D spring lattice with rotating laser scan probe. |
| 9 | **Additive Partial Series** | `Spectral` | Summation of 32 phase-synchronized partials with inharmonicity factor: $\omega_k = k f_0 \sqrt{1 + B k^2}$. | 3D Fourier partials spectrum rods. |
| 10 | **Formant Vocal Tract** | `Acoustic` | 5 parallel formant resonators modeling human vowel transitions (A-E-I-O-U) with throat length scaling. | Vocal tract acoustic formant cavity. |
| 11 | **Vortex Fluidics & Wind** | `Acoustic` | Kármán vortex street shedding frequency $f_v = St \cdot \frac{v}{d}$ with aeroacoustic pipe turbulence. | Swirling fluid eddies around a cylinder obstacle. |
| 12 | **Spectral Freeze & Diffuser** | `Spectral` | 24-bin spectral bank with infinite freeze hold, FFT bin blurring, and pitch shimmer feedback (+12st / +7st). | Crystalline spectral prism bars with freeze aura. |
| 13 | **Granular Micro-Sound** | `Sample` | Micro-grain asynchronous stream (10–200ms) with Hann windowing, pitch spray, and stereo diffusion. | 3D floating grain cloud with position jitter. |
| 14 | **Multi-Zone Sampler** | `Sample` | Pitch-tracking sample playback with 4-point Hermite interpolation, loop envelopes, and filters. | Rotating sample tape spool. |
| 15 | **Chaotic Attractors** | `Nonlinear` | Numerical Runge-Kutta integration of the Lorenz system: $\dot{x}=\sigma(y-x), \dot{y}=x(\rho-z)-y, \dot{z}=xy-\beta z$. | 3D Lorenz strange attractor trajectory ribbon. |
| 16 | **Fractal Julia & Mandelbrot** | `Mathematical` | Complex plane escape-time dynamics $z_{n+1} = z_n^2 + c$ with continuous potential field resynthesis. | 3D Julia point cloud with escape-time gradients. |
| 17 | **Neural Wave-Terrain** | `Nonlinear` | 3D surface scanning $z = f(x,y)$ along Lissajous and rose-curve trajectories with wavefolding. | Topographic wave terrain with scanning head. |
| 18 | **Bytebeat Bitwise Math** | `Mathematical` | Algorithmic C-style one-liner arithmetic: $y[t] = ((t \times (t \gg 12 \mid t \gg 8) \ \& \ 63 \ \& \ t \gg 4) \pmod{256}) / 128 - 1$. | Digital bit-ladder spectrum steps. |
| 19 | **Cellular Automata** | `Quantum` | 1D Wolfram Elementary Automata (Rules 0–255) and 2D Conway's Life with mutation probabilities. | 3D cellular voxel grid with state pulsing. |
| 20 | **Pulsar & Formant Train** | `Quantum` | Curtis Roads pulsar synthesis emitting micro-pulsarets with Hann/Gaussian masking and pitch chirping. | 3D pulsar emission cone with expanding rings. |
| 21 | **Stochastic Gendyn (Xenakis)** | `Experimental` | Xenakis Dynamic Stochastic Synthesis (GENDY) with Cauchy/Gaussian random walks and elastic mirrors. | Xenakis breakpoint ribbon with boundary planes. |
| 22 | **Polytopic 4D Hypercube** | `Modern` | 4D Tesseract projection with 16 vertex oscillators and 4D isometric rotation matrices ($R_{xw}, R_{yz}, R_{zw}$). | 4D Tesseract wireframe with 16 rotating nodes. |

---

## 🏗️ Architecture & Signal Flow

```mermaid
graph TD
    UI[HTML5 / WebGL UI & Inspector] -->|Transport / MIDI| Seq[16-Track Sequencer Engine]
    UI -->|Param Changes & Stepper| Factory[Synth Factory]
    Seq -->|NoteOn / NoteOff / CC| Engine[AudioEngine]
    
    subgraph AudioEngine [Zero-Allocation 16-Channel Audio Engine]
        CH1[Channel 1 (Poly 4-Voice)]
        CH2[Channel 2 (Poly 4-Voice)]
        CHdots[...]
        CH16[Channel 16 (Poly 4-Voice)]
        
        CH1 --> Mixer[Summation Bus]
        CH2 --> Mixer
        CHdots --> Mixer
        CH16 --> Mixer
        
        CH1 -.->|Sends| FX_Delay[Stereo Delay]
        CH2 -.->|Sends| FX_Delay
        CH1 -.->|Sends| FX_Reverb[CloudSeed Reverb]
        CH2 -.->|Sends| FX_Reverb
        
        FX_Delay --> Mixer
        FX_Reverb --> Mixer
        Mixer --> Limiter[Lookahead Peak Limiter]
        Limiter --> Out[Audio Output DAC]
    end

    Engine -.->|Telemetry Buffer 60fps| Vis[Three.js Visualizer Engine]
    Vis -->|Render Loop| Canvas[3D GPU Viewports]
```

---

## 🎹 Navigation & Keyboard Shortcuts

- **Spacebar**: Start / Stop Sequencer Playback.
- **`[` / `]`**: Step Previous / Next Synthesizer Module on the selected channel.
- **`Y` / `Z`**: Shift Base Octave Down (-1 Octave).
- **`X`**: Shift Base Octave Up (+1 Octave).
- **`A`, `W`, `S`, `E`, `D`, `F`, `T`, `G`, `Z`, `H`, `U`, `J`, `K`, `O`, `L`, `P`**: Musical Typing Keyboard (C3 to F4).
- **`1` - `3` / Buttons**: Switch 3D GPU Visualizer view modes:
  1. `🌌 16-CH Hyper-Sphere`: Macro orbital representation of all active channels.
  2. `📊 16-Track 3D Matrix`: Spatial 4x4 array of all track spectrograms.
  3. `🔬 Synth Math Deep-Dive`: Real-time geometric mathematical representation of the active synthesizer.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Modern Web Browser with WebGL 2.0 and Web Audio API support (Chrome, Edge, Firefox, Safari)

### Installation

```bash
# Clone repository
git clone https://github.com/enzocage/music-engine.git

# Enter project directory
cd music-engine

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be running at `http://localhost:5173`.

### Production Build

```bash
# Compile and optimize production bundle
npm run build

# Preview production build
npm run preview
```

---

## 📂 Project Structure

```text
├── index.html                  # Main application structure & HUD overlays
├── package.json                # Project manifest & scripts
├── vite.config.js              # Vite bundler configuration
├── src/
│   ├── main.js                 # App coordinator, UI bindings, parameter inspector
│   ├── audio/
│   │   ├── AudioEngine.js      # Zero-allocation master coordinator & audio loop
│   │   ├── Channel.js          # Polyphonic channel voice management & mixing
│   │   ├── DSPUtils.js         # ZDF filters, PolyBLEP, ADSR, Fast Tanh
│   │   ├── SynthFactory.js     # Registry and metadata for all 22 synths
│   │   ├── fx/
│   │   │   └── MasterFX.js     # CloudSeed Reverb, Delay & Limiter
│   │   └── synths/             # All 22 standalone synthesis engines
│   │       ├── SubtractiveSynth.js
│   │       ├── WavetableSynth.js
│   │       ├── FMSynth.js
│   │       ├── PhaseDistSynth.js
│   │       ├── PhysicalStringSynth.js
│   │       ├── ModalSynth.js
│   │       ├── BowedStringSynth.js
│   │       ├── ScannedMeshSynth.js
│   │       ├── AdditiveSynth.js
│   │       ├── FormantSynth.js
│   │       ├── VortexFluidSynth.js
│   │       ├── SpectralFreezeSynth.js
│   │       ├── GranularSynth.js
│   │       ├── SamplerSynth.js
│   │       ├── ChaosSynth.js
│   │       ├── FractalSynth.js
│   │       ├── NeuralTerrainSynth.js
│   │       ├── BytebeatSynth.js
│   │       ├── CellularSynth.js
│   │       ├── PulsarTrainSynth.js
│   │       ├── StochasticGendynSynth.js
│   │       └── PolytopicVectorSynth.js
│   ├── sequencer/
│   │   ├── SequencerEngine.js  # 16-track polyphonic clock & pattern sequencer
│   │   ├── EuclideanGenerator.js # Euclidean algorithm & Fibonacci tracking
│   │   ├── MidiHandler.js      # Musical scale quantizer & MIDI mappings
│   │   └── Presets.js          # Multi-channel composition presets
│   ├── visualizer/
│   │   └── VisualizerEngine.js # Three.js WebGL 3D visualization engine
│   └── ui/
│       └── styles/
│           └── main.css        # Premium dark glassmorphism styling
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
