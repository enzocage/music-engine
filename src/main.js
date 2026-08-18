/**
 * Main Controller: Integrates AudioEngine, Sequencer, Visualizer, and UI interactions.
 * Features 22-Module Synthesizer Arsenal, Instant Stepper Navigation, Parameter Randomizer,
 * and 3D GPU Telemetry synchronization.
 */
import { AudioEngine } from './audio/AudioEngine.js';
import { SequencerEngine } from './sequencer/SequencerEngine.js';
import { MidiHandler, midiToNoteName, SCALES } from './sequencer/MidiHandler.js';
import { VisualizerEngine } from './visualizer/VisualizerEngine.js';
import { SYNTH_TYPES, getNextSynthId, getPrevSynthId } from './audio/SynthFactory.js';
import { PRESETS } from './sequencer/Presets.js';

export const COMPUTER_KEY_MAP = {
  'a': { semitone: 0, label: 'A' },    // C
  'w': { semitone: 1, label: 'W' },    // C#
  's': { semitone: 2, label: 'S' },    // D
  'e': { semitone: 3, label: 'E' },    // D#
  'd': { semitone: 4, label: 'D' },    // E
  'f': { semitone: 5, label: 'F' },    // F
  't': { semitone: 6, label: 'T' },    // F#
  'g': { semitone: 7, label: 'G' },    // G
  'z': { semitone: 8, label: 'Z' },    // G# (Between T and U)
  'h': { semitone: 9, label: 'H' },    // A
  'u': { semitone: 10, label: 'U' },   // A#
  'j': { semitone: 11, label: 'J' },   // B
  'k': { semitone: 12, label: 'K' },   // C (+1 Oct)
  'o': { semitone: 13, label: 'O' },   // C# (+1 Oct)
  'l': { semitone: 14, label: 'L' },   // D (+1 Oct)
  'p': { semitone: 15, label: 'P' },   // D# (+1 Oct)
  'ö': { semitone: 16, label: 'Ö' },   // E (+1 Oct)
  ';': { semitone: 16, label: ';' },   // E (+1 Oct)
  'ä': { semitone: 17, label: 'Ä' },   // F (+1 Oct)
  "'": { semitone: 17, label: "'" }    // F (+1 Oct)
};

class App {
  constructor() {
    this.audioEngine = new AudioEngine();
    this.sequencer = new SequencerEngine(this.audioEngine);
    this.midiHandler = new MidiHandler(this.audioEngine);
    this.visualizer = null;

    this.selectedChannel = 0;
    this.selectedTab = 'sequencer';
    this.drawerOpen = false;

    // Keyboard Playback State
    this.baseOctave = 48; // Default C3 (MIDI 48)
    this.activeKeyboardNotes = new Map();

    this.initDOM();
    this.initVisualizer();
    this.setupEventListeners();
    this.setupKeyboardPlayback();
    this.startUIUpdateLoop();
  }

  initDOM() {
    this.renderChannelStrips();
    this.renderSequencerGrid();
    this.populateSynthSelector();
    this.renderInspectorParams();
    this.renderPianoKeys();
  }

  initVisualizer() {
    const container = document.getElementById('visualizer-container');
    this.visualizer = new VisualizerEngine(container, this.audioEngine);
  }

  // --- Render 16 Channel Strips in Mixer Bar ---
  renderChannelStrips() {
    const container = document.getElementById('channel-strip-container');
    container.innerHTML = '';

    for (let i = 0; i < 16; i++) {
      const ch = this.audioEngine.channels[i];
      const meta = ch.getSynthMeta();

      const strip = document.createElement('div');
      strip.className = `channel-strip ${i === this.selectedChannel ? 'active' : ''}`;
      strip.id = `strip-${i}`;
      strip.onclick = (e) => {
        if (!e.target.classList.contains('strip-btn') && !e.target.classList.contains('strip-slider')) {
          this.selectChannel(i);
        }
      };

      strip.innerHTML = `
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <span class="channel-id">CH ${i + 1}</span>
          <span class="channel-badge" style="background: ${meta.color};">${meta.name.split(' ')[0]}</span>
        </div>
        <div class="channel-meter-bar">
          <div class="channel-meter-fill" id="meter-${i}"></div>
        </div>
        <div class="strip-btns">
          <button class="strip-btn ${ch.mute ? 'mute-active' : ''}" id="mute-${i}">M</button>
          <button class="strip-btn ${ch.solo ? 'solo-active' : ''}" id="solo-${i}">S</button>
        </div>
      `;

      const muteBtn = strip.querySelector(`#mute-${i}`);
      muteBtn.onclick = (e) => {
        e.stopPropagation();
        ch.mute = !ch.mute;
        muteBtn.classList.toggle('mute-active', ch.mute);
      };

      const soloBtn = strip.querySelector(`#solo-${i}`);
      soloBtn.onclick = (e) => {
        e.stopPropagation();
        ch.solo = !ch.solo;
        soloBtn.classList.toggle('solo-active', ch.solo);
      };

      container.appendChild(strip);
    }
  }

  selectChannel(chIdx) {
    this.selectedChannel = chIdx;
    this.midiHandler.setActiveChannel(chIdx);

    document.querySelectorAll('.channel-strip').forEach((s, idx) => {
      s.classList.toggle('active', idx === chIdx);
    });

    const ch = this.audioEngine.channels[chIdx];
    const meta = ch.getSynthMeta();

    if (this.visualizer.viewMode === 'deepdive') {
      this.visualizer.setViewMode('deepdive', chIdx);
    }
    this.updateHUDText(chIdx);

    document.getElementById('seq-active-track-name').textContent = `Track ${chIdx + 1} (${meta.name})`;
    this.renderSequencerGrid();

    // Update Stepper Badge & Selector
    const synthIdx = SYNTH_TYPES.findIndex(t => t.id === ch.synthTypeId);
    const counterBadge = document.getElementById('module-counter-badge');
    if (counterBadge) {
      counterBadge.textContent = `Modul ${synthIdx + 1} / ${SYNTH_TYPES.length}`;
    }

    const catBadge = document.getElementById('inspector-category-badge');
    if (catBadge) {
      catBadge.textContent = meta.category || 'Classic';
      catBadge.style.color = meta.color;
      catBadge.style.borderColor = meta.color;
    }

    const descBar = document.getElementById('inspector-desc-bar');
    if (descBar) {
      descBar.textContent = meta.desc || meta.name;
      descBar.style.borderLeftColor = meta.color;
    }

    const selector = document.getElementById('inspector-synth-selector');
    if (selector) {
      selector.value = ch.synthTypeId;
    }

    this.renderInspectorParams();
    document.getElementById('kbd-active-target').textContent = `Target: ${ch.name} (${meta.name})`;
  }

  stepNextSynth() {
    const ch = this.audioEngine.channels[this.selectedChannel];
    const nextId = getNextSynthId(ch.synthTypeId);
    ch.setSynthType(nextId);
    this.renderChannelStrips();
    this.selectChannel(this.selectedChannel);
  }

  stepPrevSynth() {
    const ch = this.audioEngine.channels[this.selectedChannel];
    const prevId = getPrevSynthId(ch.synthTypeId);
    ch.setSynthType(prevId);
    this.renderChannelStrips();
    this.selectChannel(this.selectedChannel);
  }

  updateHUDText(chIdx) {
    const ch = this.audioEngine.channels[chIdx];
    const meta = ch.getSynthMeta();
    const hudTitle = document.getElementById('hud-title');
    const hudFormula = document.getElementById('hud-formula');

    hudTitle.textContent = `🔬 Channel ${chIdx + 1}: ${meta.name}`;
    
    switch (ch.synthTypeId) {
      case 'subtractive':
        hudFormula.textContent = `Virtual Analog PolyBLEP: $x(t) = \\text{saw}(t) - \\text{PolyBLEP}(t), \\ y[n] = \\text{ZDF}_{SVF}(x[n])$`;
        break;
      case 'wavetable':
        hudFormula.textContent = `Wavetable Morph: $s(t) = (1-\\alpha)W_A(\\phi(t)) + \\alpha W_B(\\phi(t)) \\ast H_{spectral}(\\omega)$`;
        break;
      case 'fm':
        hudFormula.textContent = `6-Op Phase Modulation: $y(t) = \\sin(\\omega_c t + I\\sin(\\omega_m t)) = \\sum J_n(I)\\sin((\\omega_c + n\\omega_m)t)$`;
        break;
      case 'phasedist':
        hudFormula.textContent = `Casio Phase Distortion: $\\phi'(t) = f(\\phi(t)), \\ y(t) = \\sin(2\\pi \\phi'(t)) \\ast \\text{fold}(y)$`;
        break;
      case 'waveguide':
        hudFormula.textContent = `Karplus-Strong Waveguide: $y[n] = x[n] + \\rho \\frac{y[n-L] + y[n-L-1]}{2} \\ast H_{allpass}(z)$`;
        break;
      case 'modal':
        hudFormula.textContent = `Chladni Modal Bank: $\\ddot{u}_k + 2d_k\\dot{u}_k + \\omega_k^2 u_k = F_{impulse}(t), \\ k=1\\dots 12$`;
        break;
      case 'additive':
        hudFormula.textContent = `Additive Partial Series: $y(t) = \\sum_{k=1}^{32} A_k \\sin(\\omega_k t \\sqrt{1 + Bh^2} + \\phi_k)$`;
        break;
      case 'granular':
        hudFormula.textContent = `Granular Micro-Grains: $x(t) = \\sum_g A_g \\cdot w(t - \\tau_g) \\cdot s(\\alpha_g(t - \\tau_g))$`;
        break;
      case 'formant':
        hudFormula.textContent = `Vocal Tract FOF: $x(t) = \\sum_{f=1}^5 A_f e^{-\\pi B_f t}\\sin(2\\pi F_f t)$`;
        break;
      case 'sampler':
        hudFormula.textContent = `Multi-Sample Interpolation: $y(t) = \\text{Hermite4}(S[\\text{pos}(t)], \\text{loop})$`;
        break;
      case 'chaos':
        hudFormula.textContent = `Lorenz System DGL: $\\dot{x}=\\sigma(y-x), \\dot{y}=x(\\rho-z)-y, \\dot{z}=xy-\\beta z$`;
        break;
      case 'bytebeat':
        hudFormula.textContent = `Bytebeat Bitwise Math: $y[t] = ((t \\times (t>>12 \\mid t>>8) \\ \\& \\ 63 \\ \\& \\ t>>4) \\pmod{256}) / 128 - 1$`;
        break;
      case 'cellular':
        hudFormula.textContent = `Cellular Automata: $s_i^{t+1} = \\text{Rule}_{110}(s_{i-1}^t, s_i^t, s_{i+1}^t) \\oplus \\text{Mut}, \\ y(t) = \\sum s_i \\sin(\\omega_i t)$`;
        break;
      case 'scannedmesh':
        hudFormula.textContent = `Scanned Mass-Spring: $M\\ddot{u}_i = K(u_{i-1} + u_{i+1} - 2u_i) - c u_i^3, \\ y(t) = u(\\text{orbit}(t))$`;
        break;
      case 'fractal':
        hudFormula.textContent = `Fractal Julia Orbit: $z_{n+1} = z_n^2 + c, \\ \\text{pot}(z_0) = n - \\log_2 \\log_2 |z_n|, \\ z_0 = e^{i\\omega t}$`;
        break;
      case 'neuralterrain':
        hudFormula.textContent = `Wave-Terrain Scanning: $z(t) = f(x(t), y(t)) = (x^2 - y^2 + \\sin(3xy)), \\ x,y = \\text{Lissajous}(\\omega_x, \\omega_y)$`;
        break;
      case 'stochasticgendyn':
        hudFormula.textContent = `Xenakis GENDY: $x_k^{t+1} = x_k^t + \\Delta x \\cdot \\text{Cauchy}(u) \\pmod{\\text{MirrorBarriers}}$`;
        break;
      case 'bowedstring':
        hudFormula.textContent = `Helmholtz Stick-Slip: $F_{\\mu} = \\mu(v_{rel})F_B, \\ \\mu(v) = \\mu_d + (\\mu_s - \\mu_d)e^{-c|v|}, \\ y[n] = \\text{Waveguide}(F_\\mu)$`;
        break;
      case 'vortexfluid':
        hudFormula.textContent = `Kármán Vortex Street: $f_v = St \\cdot \\frac{v}{d}, \\ \\Delta P = \\rho v^2 \\sin(2\\pi f_v t) + \\text{Turbulence}$`;
        break;
      case 'spectralfreeze':
        hudFormula.textContent = `Spectral Freeze & Shimmer: $X_k[n] = (1-\\alpha)X_k + \\alpha X_{frozen} + X_{k-12} \\cdot g_{shimmer}$`;
        break;
      case 'pulsartrain':
        hudFormula.textContent = `Pulsar Synthesis: $p(t) = \\sum_n w\\left(\\frac{t - nT_0}{d}\\right) \\sin(2\\pi F_{formant}(1 + ct)t)$`;
        break;
      case 'polytopicvector':
        hudFormula.textContent = `4D Tesseract Vector: $V(t) = R_{4D}(\\theta_{xw}, \\theta_{yz}, \\theta_{zw}) V_0, \\ y(t) = \\sum_{i=1}^{16} \\frac{\\sin(\\omega_i t)}{\\text{dist}_{4D}(V_i, P)^2}$`;
        break;
      default:
        hudFormula.textContent = `Bandlimited Synthesis: $x(t) = \\text{saw}(t) - \\text{PolyBLEP}(t)$`;
        break;
    }
  }

  // --- Sequencer Grid Rendering ---
  renderSequencerGrid() {
    const grid = document.getElementById('sequencer-grid');
    grid.innerHTML = '';

    const track = this.sequencer.tracks[this.selectedChannel];
    if (!track) return;

    for (let s = 0; s < this.sequencer.numSteps; s++) {
      const stepNote = track.steps[s];
      const cell = document.createElement('div');
      cell.className = `step-cell ${stepNote !== null ? 'active' : ''}`;
      cell.id = `seq-step-${s}`;

      cell.innerHTML = `
        <span style="font-size: 9px; color: var(--text-muted);">${s + 1}</span>
        <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 700;">${stepNote ? midiToNoteName(stepNote) : '—'}</span>
      `;

      cell.onclick = () => {
        if (track.steps[s] !== null) {
          this.sequencer.clearStep(this.selectedChannel, s);
        } else {
          this.sequencer.setStepNote(this.selectedChannel, s, 48 + (s % 4 === 0 ? 0 : 7));
        }
        this.renderSequencerGrid();
      };

      grid.appendChild(cell);
    }
  }

  // --- Populate Synth Selector in Inspector ---
  populateSynthSelector() {
    const sel = document.getElementById('inspector-synth-selector');
    if (!sel) return;
    sel.innerHTML = '';
    SYNTH_TYPES.forEach((t, i) => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${i + 1}. ${t.name} (${t.category})`;
      sel.appendChild(opt);
    });

    sel.onchange = (e) => {
      const newType = e.target.value;
      const ch = this.audioEngine.channels[this.selectedChannel];
      ch.setSynthType(newType);
      this.renderChannelStrips();
      this.selectChannel(this.selectedChannel);
    };
  }

  // --- Render Dynamic Parameter Cards for All 22 Synthesizers ---
  renderInspectorParams() {
    const grid = document.getElementById('params-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const ch = this.audioEngine.channels[this.selectedChannel];
    const synth = ch.voices[0].synth;

    const createSlider = (label, val, min, max, step, onChange) => {
      const card = document.createElement('div');
      card.className = 'param-card';
      const formattedVal = (typeof val === 'number' && !Number.isInteger(val)) ? parseFloat(val.toFixed(3)) : val;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <label>${label}</label>
          <span class="value-display">${formattedVal}</span>
        </div>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${val}" style="accent-color: var(--accent-cyan);">
      `;
      const input = card.querySelector('input');
      const display = card.querySelector('.value-display');
      input.oninput = (e) => {
        const v = parseFloat(e.target.value);
        display.textContent = (typeof v === 'number' && !Number.isInteger(v)) ? parseFloat(v.toFixed(3)) : v;
        onChange(v);
      };
      grid.appendChild(card);
      return { input, display };
    };

    // Common Channel Level, Pan & FX Sends
    createSlider('Channel Volume', ch.volume, 0, 1, 0.01, (v) => { ch.volume = v; });
    createSlider('Channel Pan', ch.pan, -1, 1, 0.02, (v) => { ch.pan = v; });
    createSlider('Reverb Send', ch.reverbSend, 0, 1, 0.01, (v) => { ch.reverbSend = v; });
    createSlider('Delay Send', ch.delaySend, 0, 1, 0.01, (v) => { ch.delaySend = v; });

    // Multi-Voice Helper
    const setParamAll = (fn) => {
      ch.voices.forEach(voice => fn(voice.synth));
    };

    // 22-Module Parameter Dispatcher
    switch (ch.synthTypeId) {
      // 1. Virtual Analog
      case 'subtractive':
        createSlider('Filter Cutoff (Hz)', synth.filterCutoff || 2000, 50, 12000, 10, (v) => setParamAll(s => s.filterCutoff = v));
        createSlider('Filter Res (Q)', synth.filterRes || 0.7, 0.5, 8.0, 0.1, (v) => setParamAll(s => s.filterRes = v));
        createSlider('Sub Osc Level', synth.subLevel || 0.3, 0, 1, 0.01, (v) => setParamAll(s => s.subLevel = v));
        createSlider('Osc2 Detune', synth.osc2Detune || 0.005, -0.05, 0.05, 0.001, (v) => setParamAll(s => s.osc2Detune = v));
        createSlider('Filter Drive', synth.drive || 0.2, 0, 1.0, 0.02, (v) => setParamAll(s => s.drive = v));
        createSlider('Portamento (s)', synth.glideTime || 0.0, 0, 0.5, 0.01, (v) => setParamAll(s => s.glideTime = v));
        break;

      // 2. Wavetable
      case 'wavetable':
        createSlider('Table Morph Pos', synth.tablePos || 0.0, 0.0, 3.0, 0.02, (v) => setParamAll(s => s.tablePos = v));
        createSlider('Spectral Warp', synth.warpAmount || 0.0, 0.0, 1.0, 0.01, (v) => setParamAll(s => s.warpAmount = v));
        createSlider('Sub Osc Mix', synth.subLevel || 0.2, 0, 1, 0.01, (v) => setParamAll(s => s.subLevel = v));
        createSlider('Wavetable Drive', synth.drive || 0.25, 0, 1.0, 0.02, (v) => setParamAll(s => s.drive = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 4000, 100, 12000, 20, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 3. FM/PM
      case 'fm':
        createSlider('Op 2 Ratio (Mod)', synth.ops[1].ratio, 0.5, 12.0, 0.5, (v) => setParamAll(s => s.ops[1].ratio = v));
        createSlider('Op 2 Level (Index)', synth.ops[1].level, 0, 3.0, 0.05, (v) => setParamAll(s => s.ops[1].level = v));
        createSlider('Op 2 Feedback', synth.ops[1].feedback, 0, 0.9, 0.02, (v) => setParamAll(s => s.ops[1].feedback = v));
        createSlider('Op 3 Ratio', synth.ops[2].ratio, 0.5, 16.0, 0.5, (v) => setParamAll(s => s.ops[2].ratio = v));
        createSlider('Op 3 Level', synth.ops[2].level, 0, 3.0, 0.05, (v) => setParamAll(s => s.ops[2].level = v));
        createSlider('Op 4 Ratio', synth.ops[3].ratio, 0.5, 16.0, 0.5, (v) => setParamAll(s => s.ops[3].ratio = v));
        createSlider('Op 4 Level', synth.ops[3].level, 0, 3.0, 0.05, (v) => setParamAll(s => s.ops[3].level = v));
        break;

      // 4. Phase Distortion
      case 'phasedist':
        createSlider('PD Amount', synth.pdAmount || 0.5, 0.0, 1.0, 0.01, (v) => setParamAll(s => s.pdAmount = v));
        createSlider('Wavefolder Drive', synth.wavefoldAmount || 0.5, 0.0, 3.0, 0.05, (v) => setParamAll(s => s.wavefoldAmount = v));
        createSlider('Resonant Bias', synth.resBias || 0.3, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.resBias = v));
        createSlider('Sub Mix', synth.subLevel || 0.2, 0.0, 1.0, 0.01, (v) => setParamAll(s => s.subLevel = v));
        break;

      // 5. Karplus-Strong Waveguide
      case 'waveguide':
        createSlider('String Damping', synth.damping || 0.98, 0.90, 0.999, 0.001, (v) => setParamAll(s => s.damping = v));
        createSlider('Pick Position', synth.pickPosition || 0.2, 0.05, 0.95, 0.02, (v) => setParamAll(s => s.pickPosition = v));
        createSlider('Pluck Sharpness', synth.pluckSharpness || 0.8, 0.1, 2.0, 0.05, (v) => setParamAll(s => s.pluckSharpness = v));
        createSlider('Body Resonance', synth.bodyRes || 0.4, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.bodyRes = v));
        break;

      // 6. Modal Chladni Plates
      case 'modal':
        createSlider('Decay Time (s)', synth.decayTime || 2.5, 0.2, 6.0, 0.1, (v) => setParamAll(s => s.decayTime = v));
        createSlider('Structure / Inharm', synth.structure || 0.5, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.structure = v));
        createSlider('Modes Count', synth.numModes || 12, 4, 12, 1, (v) => setParamAll(s => s.numModes = v));
        break;

      // 7. Bowed String
      case 'bowedstring':
        createSlider('Bow Pressure', synth.bowPressure || 0.65, 0.1, 1.5, 0.02, (v) => setParamAll(s => s.bowPressure = v));
        createSlider('Bow Velocity', synth.bowVelocity || 0.8, 0.1, 2.0, 0.05, (v) => setParamAll(s => s.bowVelocity = v));
        createSlider('Bow Position', synth.bowPosition || 0.16, 0.05, 0.5, 0.01, (v) => setParamAll(s => s.bowPosition = v));
        createSlider('Rosin Friction', synth.rosinFriction || 0.85, 0.2, 1.5, 0.02, (v) => setParamAll(s => s.rosinFriction = v));
        createSlider('String Damping', synth.stringDamping || 0.992, 0.95, 0.999, 0.001, (v) => setParamAll(s => s.stringDamping = v));
        createSlider('Body Wood Mode (Hz)', synth.bodyWoodFreq || 540, 200, 1200, 10, (v) => setParamAll(s => s.bodyWoodFreq = v));
        createSlider('Tremolo Depth', synth.tremoloDepth || 0.08, 0.0, 0.3, 0.01, (v) => setParamAll(s => s.tremoloDepth = v));
        createSlider('Tremolo Rate (Hz)', synth.tremoloRate || 5.0, 1.0, 12.0, 0.2, (v) => setParamAll(s => s.tremoloRate = v));
        break;

      // 8. Scanned Synthesis Mesh
      case 'scannedmesh':
        createSlider('Spring Tension', synth.springTension || 0.35, 0.05, 1.0, 0.02, (v) => setParamAll(s => s.springTension = v));
        createSlider('Mass Damping', synth.massDamping || 0.015, 0.001, 0.1, 0.002, (v) => setParamAll(s => s.massDamping = v));
        createSlider('Scan Speed Mult', synth.scanSpeedMult || 1.0, 0.25, 4.0, 0.25, (v) => setParamAll(s => s.scanSpeedMult = v));
        createSlider('Scan Orbit Radius', synth.scanRadius || 0.8, 0.0, 1.5, 0.05, (v) => setParamAll(s => s.scanRadius = v));
        createSlider('Pluck Force', synth.pluckForce || 1.2, 0.2, 3.0, 0.1, (v) => setParamAll(s => s.pluckForce = v));
        createSlider('Pluck Position', synth.pluckPosition || 0.25, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.pluckPosition = v));
        createSlider('Non-linear Elasticity', synth.nonLinearity || 0.4, 0.0, 1.5, 0.05, (v) => setParamAll(s => s.nonLinearity = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 5000, 200, 12000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 9. Additive
      case 'additive':
        createSlider('Spectral Slope', synth.spectralSlope || -1.2, -3.0, 0.0, 0.05, (v) => setParamAll(s => s.spectralSlope = v));
        createSlider('Inharmonicity', synth.inharmonicity || 0.0, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.inharmonicity = v));
        createSlider('Odd/Even Balance', synth.oddEvenBalance || 0.5, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.oddEvenBalance = v));
        createSlider('Phase Spread', synth.phaseSpread || 0.0, 0.0, 1.0, 0.05, (v) => setParamAll(s => s.phaseSpread = v));
        break;

      // 10. Formant Vocal Tract
      case 'formant':
        createSlider('Vowel Morph (A-E-I-O-U)', synth.vowelMorph || 0.0, 0.0, 4.0, 0.05, (v) => setParamAll(s => s.vowelMorph = v));
        createSlider('Throat Formant Shift', synth.formantShift || 1.0, 0.5, 2.0, 0.05, (v) => setParamAll(s => s.formantShift = v));
        createSlider('Vibrato Rate (Hz)', synth.vibratoRate || 5.5, 1.0, 10.0, 0.2, (v) => setParamAll(s => s.vibratoRate = v));
        createSlider('Vibrato Depth', synth.vibratoDepth || 0.03, 0.0, 0.15, 0.005, (v) => setParamAll(s => s.vibratoDepth = v));
        break;

      // 11. Vortex Fluidics
      case 'vortexfluid':
        createSlider('Airflow Speed', synth.airflowSpeed || 1.2, 0.2, 3.0, 0.05, (v) => setParamAll(s => s.airflowSpeed = v));
        createSlider('Strouhal Number', synth.strouhalNumber || 0.21, 0.1, 0.4, 0.01, (v) => setParamAll(s => s.strouhalNumber = v));
        createSlider('Turbulence Noise', synth.turbulenceNoise || 0.45, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.turbulenceNoise = v));
        createSlider('Jet Attack Offset', synth.jetOffset || 0.2, -0.5, 0.8, 0.02, (v) => setParamAll(s => s.jetOffset = v));
        createSlider('Pipe Overblowing', synth.pipeOverblowing || 1.0, 1.0, 3.0, 1.0, (v) => setParamAll(s => s.pipeOverblowing = v));
        createSlider('Swirl Mod Depth', synth.swirlModDepth || 0.35, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.swirlModDepth = v));
        createSlider('Pipe Reflection', synth.reflectionFactor || 0.985, 0.90, 0.999, 0.001, (v) => setParamAll(s => s.reflectionFactor = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 5800, 200, 12000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 12. Spectral Freeze
      case 'spectralfreeze':
        createSlider('Freeze Hold (0-1)', synth.freezeHold || 0.0, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.freezeHold = v));
        createSlider('Spectral Blur', synth.spectralBlur || 0.4, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.spectralBlur = v));
        createSlider('Phase Scramble', synth.phaseScramble || 0.6, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.phaseScramble = v));
        createSlider('Shimmer Semitones', synth.shimmerShift || 12, 0, 24, 1, (v) => setParamAll(s => s.shimmerShift = v));
        createSlider('Shimmer Feedback', synth.shimmerFeedback || 0.35, 0.0, 0.8, 0.02, (v) => setParamAll(s => s.shimmerFeedback = v));
        createSlider('Damping Highs', synth.dampingHighs || 0.3, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.dampingHighs = v));
        createSlider('Spectral Wet/Dry', synth.wetDry || 0.85, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.wetDry = v));
        break;

      // 13. Granular
      case 'granular':
        createSlider('Grain Size (s)', synth.grainSize || 0.05, 0.01, 0.25, 0.005, (v) => setParamAll(s => s.grainSize = v));
        createSlider('Grain Density', synth.grainDensity || 20, 4, 80, 2, (v) => setParamAll(s => s.grainDensity = v));
        createSlider('Pitch Spray', synth.pitchSpray || 0.2, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.pitchSpray = v));
        createSlider('Pos Jitter', synth.posJitter || 0.3, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.posJitter = v));
        break;

      // 14. Multi-Zone Sampler
      case 'sampler':
        createSlider('Filter Cutoff', synth.filterCutoff || 6000, 100, 12000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        createSlider('Sample Drive', synth.drive || 0.2, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.drive = v));
        break;

      // 15. Chaos Attractors
      case 'chaos':
        createSlider('Lorenz Sigma', synth.sigma || 10.0, 5.0, 25.0, 0.2, (v) => setParamAll(s => s.sigma = v));
        createSlider('Lorenz Rho', synth.rho || 28.0, 10.0, 50.0, 0.5, (v) => setParamAll(s => s.rho = v));
        createSlider('Lorenz Beta', synth.beta || 2.66, 1.0, 6.0, 0.1, (v) => setParamAll(s => s.beta = v));
        break;

      // 16. Fractal Julia & Mandelbrot
      case 'fractal':
        createSlider('Julia Real (Cr)', synth.cr || -0.7, -1.5, 1.5, 0.01, (v) => setParamAll(s => s.cr = v));
        createSlider('Julia Imag (Ci)', synth.ci || 0.27, -1.5, 1.5, 0.01, (v) => setParamAll(s => s.ci = v));
        createSlider('Fractal Zoom', synth.zoom || 1.2, 0.2, 5.0, 0.05, (v) => setParamAll(s => s.zoom = v));
        createSlider('Max Iterations', synth.maxIter || 12, 4, 24, 1, (v) => setParamAll(s => s.maxIter = v));
        createSlider('Escape Radius', synth.escapeRadius || 4.0, 1.0, 10.0, 0.2, (v) => setParamAll(s => s.escapeRadius = v));
        createSlider('Chaos Mod Depth', synth.chaosMod || 0.25, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.chaosMod = v));
        createSlider('Sine Blend Ratio', synth.sineBlend || 0.3, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.sineBlend = v));
        createSlider('Sub Harmonic Mix', synth.subHarmonic || 0.4, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.subHarmonic = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 6000, 200, 12000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 17. Neural Wave-Terrain
      case 'neuralterrain':
        createSlider('Orbit Ratio X', synth.orbitRatioX || 1.0, 0.5, 6.0, 0.5, (v) => setParamAll(s => s.orbitRatioX = v));
        createSlider('Orbit Ratio Y', synth.orbitRatioY || 2.0, 0.5, 6.0, 0.5, (v) => setParamAll(s => s.orbitRatioY = v));
        createSlider('Radius X', synth.radiusX || 1.2, 0.1, 3.0, 0.05, (v) => setParamAll(s => s.radiusX = v));
        createSlider('Radius Y', synth.radiusY || 1.0, 0.1, 3.0, 0.05, (v) => setParamAll(s => s.radiusY = v));
        createSlider('Terrain Elevation', synth.elevation || 1.4, 0.2, 4.0, 0.1, (v) => setParamAll(s => s.elevation = v));
        createSlider('Wavefold Drive', synth.wavefoldDrive || 0.5, 0.0, 2.0, 0.05, (v) => setParamAll(s => s.wavefoldDrive = v));
        createSlider('Formant Ripple Shift', synth.formantShift || 1.0, 0.25, 3.0, 0.05, (v) => setParamAll(s => s.formantShift = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 5500, 200, 12000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 18. Bytebeat
      case 'bytebeat':
        createSlider('Formula Equation (0-4)', synth.formulaId || 0, 0, 4, 1, (v) => setParamAll(s => s.formulaId = v));
        break;

      // 19. Cellular Automata
      case 'cellular':
        createSlider('Wolfram Rule (0-255)', synth.rule || 110, 0, 255, 1, (v) => setParamAll(s => s.rule = v));
        createSlider('Clock Rate (Hz)', synth.clockRate || 80, 5, 400, 5, (v) => setParamAll(s => s.clockRate = v));
        createSlider('Mutation Prob', synth.mutationProb || 0.02, 0.0, 0.2, 0.005, (v) => setParamAll(s => s.mutationProb = v));
        createSlider('Bit Tap Shift', synth.bitShift || 2, 1, 8, 1, (v) => setParamAll(s => s.bitShift = v));
        createSlider('Pulse Width', synth.pulseWidth || 0.5, 0.1, 0.9, 0.02, (v) => setParamAll(s => s.pulseWidth = v));
        createSlider('Chaos Seed Bias', synth.chaosBias || 0.3, 0.05, 0.95, 0.05, (v) => setParamAll(s => s.chaosBias = v));
        createSlider('Feedback Res', synth.feedbackRes || 0.4, 0.0, 0.85, 0.02, (v) => setParamAll(s => s.feedbackRes = v));
        createSlider('Scale Quantize', synth.scaleQuantize || 1.0, 0.5, 4.0, 0.25, (v) => setParamAll(s => s.scaleQuantize = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 4500, 150, 10000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 20. Pulsar Synthesis
      case 'pulsartrain':
        createSlider('Formant Ratio', synth.formantRatio || 3.5, 0.5, 12.0, 0.25, (v) => setParamAll(s => s.formantRatio = v));
        createSlider('Duty Cycle', synth.dutyCycle || 0.45, 0.05, 0.95, 0.02, (v) => setParamAll(s => s.dutyCycle = v));
        createSlider('Formant Mask Ratio', synth.formantMask || 1.0, 0.1, 2.0, 0.05, (v) => setParamAll(s => s.formantMask = v));
        createSlider('Burst Jitter', synth.burstJitter || 0.05, 0.0, 0.4, 0.01, (v) => setParamAll(s => s.burstJitter = v));
        createSlider('Formant Chirp', synth.formantChirp || 0.2, -1.0, 2.0, 0.05, (v) => setParamAll(s => s.formantChirp = v));
        createSlider('Pulsar Drive', synth.drive || 0.3, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.drive = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 7000, 200, 12000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 21. Stochastic Gendyn
      case 'stochasticgendyn':
        createSlider('Breakpoints Count', synth.numPoints || 8, 4, 16, 1, (v) => setParamAll(s => s.numPoints = v));
        createSlider('Time Step Delta (dx)', synth.stepSizeTime || 0.08, 0.01, 0.3, 0.01, (v) => setParamAll(s => s.stepSizeTime = v));
        createSlider('Amp Step Delta (dy)', synth.stepSizeAmp || 0.15, 0.02, 0.5, 0.01, (v) => setParamAll(s => s.stepSizeAmp = v));
        createSlider('Barrier Max (+)', synth.barrierMax || 0.9, 0.3, 1.0, 0.02, (v) => setParamAll(s => s.barrierMax = v));
        createSlider('Barrier Min (-)', synth.barrierMin || -0.9, -1.0, -0.3, 0.02, (v) => setParamAll(s => s.barrierMin = v));
        createSlider('Memory / Inertia', synth.memoryInertia || 0.3, 0.0, 0.85, 0.02, (v) => setParamAll(s => s.memoryInertia = v));
        createSlider('Ring Mod Freq (Hz)', synth.ringModFreq || 0.0, 0.0, 400.0, 10.0, (v) => setParamAll(s => s.ringModFreq = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 4800, 150, 10000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;

      // 22. Polytopic 4D Tesseract
      case 'polytopicvector':
        createSlider('4D Speed XW', synth.speedXW || 0.6, 0.0, 2.5, 0.05, (v) => setParamAll(s => s.speedXW = v));
        createSlider('4D Speed YZ', synth.speedYZ || 0.4, 0.0, 2.5, 0.05, (v) => setParamAll(s => s.speedYZ = v));
        createSlider('4D Speed ZW', synth.speedZW || 0.3, 0.0, 2.5, 0.05, (v) => setParamAll(s => s.speedZW = v));
        createSlider('Listener Morph X', synth.morphX || 0.0, -1.5, 1.5, 0.05, (v) => setParamAll(s => s.morphX = v));
        createSlider('Listener Morph Y', synth.morphY || 0.0, -1.5, 1.5, 0.05, (v) => setParamAll(s => s.morphY = v));
        createSlider('Harmonics Count', synth.harmonicsCount || 4, 1, 8, 1, (v) => setParamAll(s => s.harmonicsCount = v));
        createSlider('Detune Spread', synth.detuneSpread || 0.003, 0.0, 0.02, 0.0005, (v) => setParamAll(s => s.detuneSpread = v));
        createSlider('Tesseract Drive', synth.drive || 0.25, 0.0, 1.0, 0.02, (v) => setParamAll(s => s.drive = v));
        createSlider('Filter Cutoff', synth.filterCutoff || 6500, 200, 12000, 50, (v) => setParamAll(s => s.filterCutoff = v));
        break;
    }

    // Common Envelope Sliders (ADSR)
    if (synth.ampEnv) {
      createSlider('Amp Attack (s)', synth.ampEnv.attack || 0.01, 0.001, 2.0, 0.01, (v) => {
        setParamAll(s => { if (s.ampEnv) s.ampEnv.attack = v; });
      });
      createSlider('Amp Decay (s)', synth.ampEnv.decay || 0.3, 0.01, 4.0, 0.02, (v) => {
        setParamAll(s => { if (s.ampEnv) s.ampEnv.decay = v; });
      });
      createSlider('Amp Sustain', synth.ampEnv.sustain !== undefined ? synth.ampEnv.sustain : 0.7, 0.0, 1.0, 0.02, (v) => {
        setParamAll(s => { if (s.ampEnv) s.ampEnv.sustain = v; });
      });
      createSlider('Amp Release (s)', synth.ampEnv.release || 0.35, 0.01, 4.0, 0.02, (v) => {
        setParamAll(s => { if (s.ampEnv) s.ampEnv.release = v; });
      });
    }
  }

  // --- Randomize Selected Synth Parameters ---
  randomizeSynthParams() {
    const ch = this.audioEngine.channels[this.selectedChannel];
    const synth = ch.voices[0].synth;

    ch.voices.forEach(v => {
      const s = v.synth;
      if (s.filterCutoff) s.filterCutoff = 200 + Math.random() * 8000;
      if (s.filterRes) s.filterRes = 0.5 + Math.random() * 4.0;
      if (s.drive !== undefined) s.drive = Math.random() * 0.7;

      // Module-specific random mutations
      if (s.rule !== undefined) s.rule = Math.floor(Math.random() * 256);
      if (s.cr !== undefined) s.cr = (Math.random() * 2.0 - 1.0) * 0.9;
      if (s.ci !== undefined) s.ci = (Math.random() * 2.0 - 1.0) * 0.9;
      if (s.zoom !== undefined) s.zoom = 0.5 + Math.random() * 3.0;
      if (s.springTension !== undefined) s.springTension = 0.1 + Math.random() * 0.8;
      if (s.massDamping !== undefined) s.massDamping = 0.005 + Math.random() * 0.05;
      if (s.bowPressure !== undefined) s.bowPressure = 0.2 + Math.random() * 1.0;
      if (s.airflowSpeed !== undefined) s.airflowSpeed = 0.5 + Math.random() * 2.0;
      if (s.turbulenceNoise !== undefined) s.turbulenceNoise = Math.random() * 0.8;
      if (s.freezeHold !== undefined) s.freezeHold = Math.random() < 0.5 ? 0.0 : Math.random();
      if (s.spectralBlur !== undefined) s.spectralBlur = Math.random() * 0.8;
      if (s.formantRatio !== undefined) s.formantRatio = 1.0 + Math.random() * 8.0;
      if (s.dutyCycle !== undefined) s.dutyCycle = 0.1 + Math.random() * 0.8;
      if (s.stepSizeTime !== undefined) s.stepSizeTime = 0.02 + Math.random() * 0.2;
      if (s.stepSizeAmp !== undefined) s.stepSizeAmp = 0.05 + Math.random() * 0.3;
      if (s.speedXW !== undefined) s.speedXW = Math.random() * 1.5;
      if (s.speedYZ !== undefined) s.speedYZ = Math.random() * 1.5;
    });

    this.renderInspectorParams();
  }

  // --- Render Interactive Virtual Piano Keys ---
  renderPianoKeys() {
    const container = document.getElementById('virtual-piano-keys');
    if (!container) return;
    container.innerHTML = '';

    const startNote = Math.max(24, this.baseOctave - 12);
    const totalKeys = 36;

    const semitoneToKey = {};
    for (const [k, data] of Object.entries(COMPUTER_KEY_MAP)) {
      if (!semitoneToKey[data.semitone]) {
        semitoneToKey[data.semitone] = data.label;
      }
    }

    for (let n = startNote; n < startNote + totalKeys; n++) {
      const isBlack = [1, 3, 6, 8, 10].includes(n % 12);
      const key = document.createElement('div');
      key.className = `piano-key ${isBlack ? 'black-key' : 'white-key'}`;
      key.id = `piano-key-${n}`;
      key.style.flex = isBlack ? '0 0 24px' : '0 0 36px';
      key.style.height = isBlack ? '65px' : '100px';
      key.style.display = 'flex';
      key.style.flexDirection = 'column';
      key.style.alignItems = 'center';
      key.style.justifyContent = 'flex-end';
      key.style.paddingBottom = '4px';

      const semitoneOffset = n - this.baseOctave;
      const kbdChar = semitoneToKey[semitoneOffset];

      key.innerHTML = `
        ${kbdChar ? `<span class="key-kbd-badge">${kbdChar}</span>` : ''}
        <span style="font-family: var(--font-mono); font-size: 9px; font-weight: 700;">${midiToNoteName(n)}</span>
      `;

      key.onmousedown = async () => {
        await this.audioEngine.initAudio();
        this.audioEngine.noteOn(this.selectedChannel, n, 0.9);
        key.classList.add('key-pressed');
      };

      key.onmouseup = () => {
        this.audioEngine.noteOff(this.selectedChannel, n);
        key.classList.remove('key-pressed');
      };

      key.onmouseleave = () => {
        this.audioEngine.noteOff(this.selectedChannel, n);
        key.classList.remove('key-pressed');
      };

      container.appendChild(key);
    }
  }

  // --- Computer Keyboard Musical Typing & Stepper Hotkeys ---
  setupKeyboardPlayback() {
    window.addEventListener('keydown', async (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();

      // Module stepping shortcuts [ and ]
      if (key === '[') {
        this.stepPrevSynth();
        return;
      }
      if (key === ']') {
        this.stepNextSynth();
        return;
      }

      // Octave Shift (Y or Z for down, X for up)
      if (key === 'y') {
        this.baseOctave = Math.max(24, this.baseOctave - 12);
        document.getElementById('current-octave-display').textContent = `${midiToNoteName(this.baseOctave)} (${this.baseOctave})`;
        this.renderPianoKeys();
        return;
      }
      if (key === 'x') {
        this.baseOctave = Math.min(84, this.baseOctave + 12);
        document.getElementById('current-octave-display').textContent = `${midiToNoteName(this.baseOctave)} (${this.baseOctave})`;
        this.renderPianoKeys();
        return;
      }

      const mapEntry = COMPUTER_KEY_MAP[key];
      if (!mapEntry) return;

      const midiNote = this.baseOctave + mapEntry.semitone;

      if (!this.activeKeyboardNotes.has(key)) {
        this.activeKeyboardNotes.set(key, midiNote);
        await this.audioEngine.initAudio();
        this.audioEngine.noteOn(this.selectedChannel, midiNote, 0.9);

        const keyEl = document.getElementById(`piano-key-${midiNote}`);
        if (keyEl) keyEl.classList.add('key-pressed');
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      if (this.activeKeyboardNotes.has(key)) {
        const midiNote = this.activeKeyboardNotes.get(key);
        this.audioEngine.noteOff(this.selectedChannel, midiNote);
        this.activeKeyboardNotes.delete(key);

        const keyEl = document.getElementById(`piano-key-${midiNote}`);
        if (keyEl) keyEl.classList.remove('key-pressed');
      }
    });
  }

  setupEventListeners() {
    // Transport Buttons
    document.getElementById('btn-play').onclick = async () => {
      await this.audioEngine.initAudio();
      this.sequencer.start();
      document.getElementById('btn-play').classList.add('btn-active');
    };

    document.getElementById('btn-stop').onclick = () => {
      this.sequencer.stop();
      document.getElementById('btn-play').classList.remove('btn-active');
    };

    document.getElementById('input-bpm').onchange = (e) => {
      this.sequencer.setBpm(parseFloat(e.target.value));
    };

    document.getElementById('slider-master-vol').oninput = (e) => {
      this.audioEngine.setMasterVolume(parseFloat(e.target.value));
    };

    document.getElementById('select-scale').onchange = (e) => {
      this.midiHandler.setScale(e.target.value);
    };

    document.getElementById('select-preset').onchange = (e) => {
      this.loadPreset(e.target.value);
    };

    // 3D View Mode Buttons
    document.getElementById('btn-mode-interplay').onclick = () => {
      this.visualizer.setViewMode('interplay');
      this.updateModeButtonStates('btn-mode-interplay');
    };

    document.getElementById('btn-mode-matrix').onclick = () => {
      this.visualizer.setViewMode('matrix16');
      this.updateModeButtonStates('btn-mode-matrix');
    };

    document.getElementById('btn-mode-deepdive').onclick = () => {
      this.visualizer.setViewMode('deepdive', this.selectedChannel);
      this.updateModeButtonStates('btn-mode-deepdive');
      this.updateHUDText(this.selectedChannel);
    };

    // Drawer / Inspector Toggle
    document.getElementById('btn-toggle-drawer').onclick = () => {
      this.drawerOpen = !this.drawerOpen;
      document.getElementById('drawer-panel').classList.toggle('open', this.drawerOpen);
    };

    document.getElementById('btn-close-drawer').onclick = () => {
      this.drawerOpen = false;
      document.getElementById('drawer-panel').classList.remove('open');
    };

    // Drawer Tabs
    document.querySelectorAll('.drawer-tab').forEach(tab => {
      tab.onclick = () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

        tab.classList.add('active');
        const targetPane = document.getElementById(`tab-${target}`);
        if (targetPane) targetPane.style.display = 'block';
      };
    });

    // Stepper & Randomize Buttons
    const prevBtn = document.getElementById('btn-module-prev');
    if (prevBtn) prevBtn.onclick = () => this.stepPrevSynth();

    const nextBtn = document.getElementById('btn-module-next');
    if (nextBtn) nextBtn.onclick = () => this.stepNextSynth();

    const randBtn = document.getElementById('btn-module-randomize');
    if (randBtn) randBtn.onclick = () => this.randomizeSynthParams();

    // Sequencer Track Helpers
    document.getElementById('btn-seq-euclidean').onclick = () => {
      this.sequencer.generateEuclideanTrack(this.selectedChannel, 5, 16, 48);
      this.renderSequencerGrid();
    };

    document.getElementById('btn-seq-fibonacci').onclick = () => {
      this.sequencer.generateFibonacciArp(this.selectedChannel, 48);
      this.renderSequencerGrid();
    };

    document.getElementById('btn-seq-clear').onclick = () => {
      this.sequencer.clearTrack(this.selectedChannel);
      this.renderSequencerGrid();
    };

    // Octave Shift Buttons in Piano Tab
    const octDown = document.getElementById('btn-octave-down');
    if (octDown) {
      octDown.onclick = () => {
        this.baseOctave = Math.max(24, this.baseOctave - 12);
        document.getElementById('current-octave-display').textContent = `${midiToNoteName(this.baseOctave)} (${this.baseOctave})`;
        this.renderPianoKeys();
      };
    }

    const octUp = document.getElementById('btn-octave-up');
    if (octUp) {
      octUp.onclick = () => {
        this.baseOctave = Math.min(84, this.baseOctave + 12);
        document.getElementById('current-octave-display').textContent = `${midiToNoteName(this.baseOctave)} (${this.baseOctave})`;
        this.renderPianoKeys();
      };
    }
  }

  updateModeButtonStates(activeId) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === activeId);
    });
  }

  loadPreset(presetKey) {
    this.sequencer.loadPreset(presetKey);
    this.renderChannelStrips();
    this.selectChannel(0);
  }

  startUIUpdateLoop() {
    const update = () => {
      // Update Playhead Step highlight
      const currentStep = this.sequencer.currentStep;
      for (let s = 0; s < this.sequencer.numSteps; s++) {
        const cell = document.getElementById(`seq-step-${s}`);
        if (cell) {
          cell.classList.toggle('current-playhead', s === currentStep && this.sequencer.isPlaying);
        }
      }

      // Update Channel VU Level Meters
      for (let i = 0; i < 16; i++) {
        const meter = document.getElementById(`meter-${i}`);
        if (meter) {
          const peak = this.audioEngine.channels[i].peakLevel;
          meter.style.width = `${Math.min(100, peak * 120)}%`;
        }
      }

      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
