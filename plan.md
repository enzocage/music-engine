# Universal Multi-Channel Music Engine & Mathematical Visualizer
## Umfassender Softwareentwicklungsplan (plan.md)

---

### 1. Architektur- & System-Überblick

Dieses Dokument definiert die technische Architektur und den Implementierungsfahrplan für eine universelle, webbasierte **Multi-Channel Music Engine** mit integrierter **GPU-beschleunigter mathematischer 3D-Echtzeit-Visualisierung**.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       USER INTERFACE & CONTROL LAYER                                   │
│  ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 16-Track Polyphonic Sequencer │ │ Live MIDI / MPE Controller    │ │ Algorithmic Math & Euclidean │  │
│  │ • Step / Pattern Editor       │ │ • Web MIDI API Integration    │ │ • Formula Tracker            │  │
│  │ • Micro-Tuning & Scales       │ │ • MPE Pitch-Bend & Pressure   │ │ • Stochastic Generators      │  │
│  └───────────────┬───────────────┘ └───────────────┬───────────────┘ └──────────────┬───────────────┘  │
└──────────────────┼─────────────────────────────────┼────────────────────────────────┼──────────────────┘
                   │                                 │                                │
                   ▼                                 ▼                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              HIGH-PERFORMANCE AUDIO CORE (AUDIO-WORKLET)                               │
│                                                                                                        │
│   SharedArrayBuffer Ringbuffer (Lock-Free SPSC) <─── Parameter Updates, MIDI Events, Clock             │
│                                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 16 PARALLEL SYNTHESIS CHANNELS (Dynamic Engine Allocation)                                     │   │
│   │                                                                                                │   │
│   │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────────────┐ │   │
│   │ │ Ch 1: VA/Sub  │ │ Ch 2: FM/PM   │ │ Ch 3: PhysMod │ │ Ch 4: Granular│ │ ... Ch 16: Chaos   │ │   │
│   │ │ • PolyBLEP    │ │ • 6-Op Matrix │ │ • Waveguide   │ │ • Grain Cloud │ │ • Lorenz / Chua    │ │   │
│   │ │ • ZDF SVF     │ │ • Bessel Mod  │ │ • Chladni Pl. │ │ • Ring Buffer │ │ • Runge-Kutta 4    │ │   │
│   │ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └─────────┬──────────┘ │   │
│   │         │                 │                 │                 │                   │            │   │
│   │ ┌───────┴─────────────────┴─────────────────┴─────────────────┴───────────────────┴──────────┐ │   │
│   │ │ Per-Channel Modulation Matrix (4x LFOs, 4x Envelopes, 2x Math Operators, Cross-Modulation)  │ │   │
│   │ └───────┬────────────────────────────────────────────────────────────────────────────────────┘ │   │
│   │         ▼                                                                                      │   │
│   │ ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │   │
│   │ │ Per-Channel Insert FX (Stereo Drive, Multimode Filter, Tempo Delay, Parametric EQ)         │ │   │
│   │ └───────┬────────────────────────────────────────────────────────────────────────────────────┘ │   │
│   └─────────┼──────────────────────────────────────────────────────────────────────────────────────┘   │
│             ▼                                                                                          │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ MASTER MIXER & BUS PROCESSING                                                                  │   │
│   │ • Algorithmic Reverb (CloudSeed Feedback Delay Network)                                        │   │
│   │ • Stereo Width / Panning Engine                                                                │   │
│   │ • True-Peak Master Limiter & Anti-Clipping Stage                                               │   │
│   └─────────┬──────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────┼──────────────────────────────────────────────────────────────────────────────────────────┘
              │ Audio Output Stream (Hardware Audio Sink)
              │
              │ Telemetrie & Rohdaten-Streams (SharedArrayBuffer)
              ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              MATHEMATICAL GPU VISUALIZATION ENGINE                                     │
│                               (Three.js / WebGPU / GLSL Shader Pipelines)                              │
│                                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 16-CHANNEL 3D PHASENRAUM- & MODELL-DASHBOARD (60–120 FPS)                                      │   │
│   │                                                                                                │   │
│   │ • FM/PM: 3D Torus-Knoten & Lissajous-Phasenkurven (Bessel-moduliert)                           │   │
│   │ • PhysMod: Echtzeit-Gitterdeformation schwingender Saiten & Chladnischer 2D-Platten            │   │
│   │ • Wavetable / Additiv: 3D Fourier-Wasserfall & komplexe Phasenzeiger ($e^{i\theta}$)           │   │
│   │ • Chaos / Attraktoren: 3D Lorenz/Chua Orbit-Trajektorien mit Geschwindigkeitscodierung         │   │
│   │ • Granular: 3D Partikelwolke (Zeit x Pitch x Stereoraum x Lebensdauer)                        │   │
│   │ • Vokal/Formant: 2D/3D Akustischer Vokalraum ($F_1$ vs $F_2$) mit Pol-Nullstellen-Plot         │   │
│   └────────────────────────────────────────┬───────────────────────────────────────────────────────┘   │
│                                            │                                                           │
│   ┌────────────────────────────────────────┴───────────────────────────────────────────────────────┐   │
│   │ ZENTRALES INTERPLAY-ZENTRUM (Gesamt-Zusammenspiel aller 16 Kanäle)                             │   │
│   │ • Hyper-Dimensionale Phasen-Sphäre (Kreuzkorrelation $R_{xy}(\tau)$ deformiert 3D-Kugel)       │   │
│   │ • Spektrale Maskierungs- & Interferenz-Heatmap aller 16 Stimmen                                │   │
│   │ • Synchronisiertes Multikanal-Oszilloskop mit Live-Formel-Overlay                              │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Das vollständige Klangerzeugungs-Spektrum (12 Synthese-Typen)

Jeder der 16 Kanäle besitzt eine vollständig ausgestattete, polyphone Synthesizer-Engine, die auf eine der folgenden 12 mathematischen Erzeugungsmethoden konfiguriert werden kann:

#### 1. Virtual Analog (VA) / Subtraktive Synthese
* **Mathematisches Modell:** Bandbegrenzte Sprung- und Rampenfunktionen:
  $$x_{\text{saw}}(t) = \left( \frac{t}{T} - \lfloor \frac{t}{T} \rfloor \right) - \text{PolyBLEP}\left(\frac{t}{T}\right)$$
  Filterung via Zero-Delay-Feedback (ZDF) State-Variable-Filter (SVF):
  $$s_1[n] = s_1[n-1] + 2 g \cdot (v_0[n] - s_1[n-1] - k \cdot s_2[n-1])$$
* **Visualisierung:** 2D Oszilloskop-Kurve mit visualisierten PolyBLEP-Korrekturwerten an den Sprungstellen sowie dynamischer 3D Pol-Nullstellen-Plot im komplexen $z$-Raum.

#### 2. Wavetable- & Spektralsynthese
* **Mathematisches Modell:** Dynamische zweidimensionale und dreidimensionale Hermite-Spline-Interpolation:
  $$s(t, p) = \text{Interp3D}(W[\lfloor p \rfloor], W[\lceil p \rceil], t \cdot f_0)$$
  mit Mipmapping-Bandsplitting zur Nyquist-Sicherung.
* **Visualisierung:** 3D Topologie-Relief der geladenen Wavetable mit leuchtendem Abtastzeiger und rotierenden Oberton-Spinoren im komplexen Einheitskreis.

#### 3. Frequenz- & Phasenmodulation (FM / PM)
* **Mathematisches Modell:** 6-Operator-Matrix mit konfigurierbarem Algorithmen-Routing und Feedback:
  $$y(t) = A_1 \sin\left(\omega_1 t + \sum_{j=1}^{6} M_{1,j} A_j \sin(\omega_j t + \dots)\right)$$
  Jacobi-Anger Spektralzerlegung:
  $$\sin(\omega_c t + \beta \sin(\omega_m t)) = \sum_{n=-\infty}^{\infty} J_n(\beta) \sin((\omega_c + n\omega_m)t)$$
* **Visualisierung:** 3D-Torus im Phasenraum mit Lissajous-Projektion, deren Schlaufen sich in Abhängigkeit vom Modulationsindex $I(t)$ und den rationalen Operatoren-Verhältnissen verdrillen, flankiert von dynamischen Besselfunktions-Diagrammen $J_n(\beta)$.

#### 4. Phase Distortion (PD) & Wavefolding
* **Mathematisches Modell:** Nichtlineare Phasenverzerrung nach Casio-CZ und Buchla/Serge Wavefolder:
  $$\phi'(t) = f(\phi(t)), \quad y(t) = \sin(2\pi \phi'(t))$$
  Wavefolding via iterierter Dreiecksfaltung:
  $$y_{\text{fold}}(x) = 4 \left| \text{frac}\left(\frac{x}{4} + \frac{1}{4}\right) - \frac{1}{2} \right| - 1$$
* **Visualisierung:** 2D/3D Phasen-Transferfunktions-Kurve und dynamisches "Falt-Diagramm", das das Hineinklappen von Signalspitzen bei Übersteuerung darstellt.

#### 5. Physical Modeling I: Karplus-Strong & Waveguides
* **Mathematisches Modell:** 1D Wellengleichung mit Reflektionen, Dämpfung und Allpass-Interpolationsfilter für kontinuierliches Tuning:
  $$y[n] = x[n] + g \cdot \left( \frac{y[n-L] + y[n-(L+1)]}{2} \right) \ast H_{\text{allpass}}(z)$$
* **Visualisierung:** 3D-Echtzeit-Simulation der schwingenden Saite $u(x,t)$ mit Reflexionswellenfronten an den festen Enden und Amplitudenabklingkurve.

#### 6. Physical Modeling II: Modale Synthese & 2D-Resonatorplatten
* **Mathematisches Modell:** Überlagerung von $K$ resonanten Biquad-Bandpässen (Eigenmoden) mit spezifischen Frequenzen $\omega_k$ und Dämpfungen $d_k$:
  $$\ddot{u}_k + 2 d_k \dot{u}_k + \omega_k^2 u_k = F(t)$$
* **Visualisierung:** 2D/3D Chladnische Klangfiguren (Schwingungsknotenlinien und Fliehkräfte von Festkörpern und Membranen als animierte Heatmap).

#### 7. Additive Synthese & Spektral-Resynthese
* **Mathematisches Modell:** Direkte Summierung von bis zu 128 partiellen Sinus-Oszillatoren pro Stimme:
  $$y(t) = \sum_{k=1}^{N} A_k(t) \sin\left(\omega_k(t) \cdot t + \phi_k\right)$$
* **Visualisierung:** 3D-Wasserfall-Spektrogramm kombiniert mit schwebenden Vektorpfeilen im Einheitskreis für jede einzelne Harmonische.

#### 8. Granular-Synthese & Time-Domain Resampling
* **Mathematisches Modell:** Überlappende Mikrosound-Grains mit Fensterfunktionen (Hann/Tukey) und stochastischem Pitch/Pos-Jitter:
  $$y(t) = \sum_{g=1}^{G} w_g(t - t_g) \cdot s\left(\alpha_g (t - t_g) + P_g\right)$$
* **Visualisierung:** 3D-Partikelwolke im Koordinatenraum (Zeit vs. Pitch vs. Stereobreite); jedes Grain leuchtet bei Trigger auf und verblasst gemäß seiner Lebensdauerhüllkurve.

#### 9. Formant- & Vokalsynthese (FOF)
* **Mathematisches Modell:** Forme d’Onde Formantique – Summe exponentiell gedämpfter Sinuspulse:
  $$x(t) = \sum_{f=1}^{5} A_f \cdot e^{-\pi B_f t} \sin(2\pi F_f t) \cdot \Theta(t)$$
* **Visualisierung:** 2D-Vokaltrakt-Diagramm ($F_1$ vs. $F_2$ Resonanz-Vokalraum nach IPA) mit Wanderung des aktiven Vokalpunkts (z. B. von [a] nach [u]).

#### 10. Sample-Playback & SF2 Multi-Layer (TinySoundFont Engine)
* **Mathematisches Modell:** Multi-Zonen-Interpolation mit Key- und Velocity-Splits, Loop-Crossfades und Filterhüllkurven.
* **Visualisierung:** Dynamische Sample-Puffer-Heatmap, Wellenform-Loopmarker und Hüllkurven-Trace.

#### 11. Chaotische Attraktoren & Nichtlineare Dynamik
* **Mathematisches Modell:** Numerische Echtzeit-Integration des Lorenz-, Chua- und Rössler-Systems bei Audio-Abtastrate via Runge-Kutta 4:
  $$\frac{dx}{dt} = \sigma (y - x), \quad \frac{dy}{dt} = x (\rho - z) - y, \quad \frac{dz}{dt} = x y - \beta z$$
* **Visualisierung:** Dreidimensionaler Phasenraum-Attraktor mit glühendem Partikelschweif, farbcodiert nach Momentangeschwindigkeit $v = \|\dot{\mathbf{x}}\|$.

#### 12. Bytebeat & Zelluläre Automaten
* **Mathematisches Modell:** Diskrete mathematische Formeln und Wolfram 1D-Automaten:
  $$y[t] = \left(\left(t \cdot (t \gg 12 \mid t \gg 8) \& 63 \& t \gg 4\right) \pmod{256}\right) / 128 - 1.0$$
* **Visualisierung:** 2D-Zellgitter-Evolution (z. B. Rule 30 / Conways Game of Life) und binäre Bit-Muster-Matrix.

---

### 3. Multi-Channel Interplay & Master Visualisierung

Das Zusammenspiel aller 8–16 Kanäle wird auf einer zentralen Master-Visualisierungsebene mathematisch zusammengeführt:

1. **Hyper-Dimensionale Phasen-Sphäre:**
   - Die Amplituden und Phasen aller 16 Kanäle spannen einen 16-dimensionalen Vektor $\mathbf{v}(t) \in \mathbb{R}^{16}$ auf.
   - Mittels orthogonaler Projektion auf $\mathbb{R}^3$ wird eine 3D-Sphäre in Echtzeit kontinuierlich verformt und gedreht.
2. **Kreuzkorrelations-Matrix ($R_{ij}(\tau)$):**
   - Berechnung der paarweisen Kreuzkorrelation $R_{ij}(\tau) = \int x_i(t) x_j(t+\tau) dt$ zwischen Kanälen zur Erkennung harmonischer und phasenstarrer Beziehungen.
3. **Spektrale Interferenz- und Maskierungs-Heatmap:**
   - Echtzeit-FFT aller 16 Kanäle zeigt Frequenzkollisionen und Phasenasymmetrien im Master-Mix farblich differenziert auf.

---

### 4. Sequenzer-, Tracker- & Eingabe-System

* **16-Track Polyphoner Step-Sequencer:** Bis zu 64 Steps pro Pattern, Micro-Timing, Gate-Length, Velocity, Probability & Parameter-Locks pro Step.
* **Euklidischer Rhythmus-Generator:** Mathematische Rhythmusverteilung nach Bjorklund-Algorithmus $E(k, n)$ für polyrhythmische Strukturen.
* **MPE / Web MIDI API:** Volle Unterstützung für polyphonen Pitch-Bend, Channel Pressure, Timbre und Microtuning (Scala-Dateien / Just Intonation / 432Hz / temperiert).
* **Mathematical Formula Tracker:** Skript-basierte Eingabe von Notensequenzen via mathematische Funktionen (z. B. $f(n) = \text{Fibonacci}(n) \pmod{12}$).

---

### 5. Detaillierter Entwicklungsplan (Phasen 1–6)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ROADMAP MEILENSTEINE                                                                   │
├────────────┬─────────────────────────────────────────────┬─────────────────────────────┤
│ Phase 1    │ Core Web Audio, AudioWorklet & SPSC Buffer  │ Woche 1 – 3                 │
├────────────┼─────────────────────────────────────────────┼─────────────────────────────┤
│ Phase 2    │ Implementierung der 12 Synthese-Engines     │ Woche 4 – 8                 │
├────────────┼─────────────────────────────────────────────┼─────────────────────────────┤
│ Phase 3    │ GPU-Shader-Pipeline & 3D-Math-Visualizer    │ Woche 9 – 12                │
├────────────┼─────────────────────────────────────────────┼─────────────────────────────┤
│ Phase 4    │ Multi-Channel Mixer, Modulation & FX-Bus    │ Woche 13 – 15               │
├────────────┼─────────────────────────────────────────────┼─────────────────────────────┤
│ Phase 5    │ 16-Track Sequenzer, MPE & Formel-Editor     │ Woche 16 – 18               │
├────────────┼─────────────────────────────────────────────┼─────────────────────────────┤
│ Phase 6    │ Performance, Glassmorphism-UI & Export      │ Woche 19 – 20               │
└────────────┴─────────────────────────────────────────────┴─────────────────────────────┘
```

#### Phase 1: Core Audio Engine & Multi-Threading Fundament
- [ ] Aufbau des `AudioWorklet`-Kerns mit unterbrechungsfreier 128-Sample Block-Verarbeitung.
- [ ] Erstellung des lock-freien `SharedArrayBuffer` Single-Producer-Single-Consumer (SPSC) Ringbuffers für Sample-Telemetrie und Parameter-Automation.
- [ ] Implementierung der polyphonen Voice-Allocation-Matrix (Dynamic Stealing, MPE-Tagging) für 16 parallele Kanäle.
- [ ] Basis-DSP-Bausteine: Schnelle Sin/Cos-Approximationen, Bandlimited PolyBLEP Oszillatoren, ZDF State-Variable-Filter, ADSR-Hüllkurven mit einstellbarer Krümmung (Linear, Exponentiell, S-Curve).

#### Phase 2: Die 12 Klangerzeuger-Module
- [ ] **Kanal-Engine 1: Virtual Analog** (PolyBLEP Saw, Square/PWM, Triangle, Sub-Osc, ZDF Ladder/SVF, Drive).
- [ ] **Kanal-Engine 2: Wavetable/Spektral** (2D/3D Table-Morphing, Mipmap-Interpolation, Spectral Tilt/Phase-Spread).
- [ ] **Kanal-Engine 3: FM/PM Matrix** (6 Operatoren, Algorithmen 1–32 frei verschaltbar, Operator-Feedback).
- [ ] **Kanal-Engine 4: Phase Distortion & Wavefolder** (Casio CZ Resonanzmodelle, Buchla 4-Stufen Wavefolding).
- [ ] **Kanal-Engine 5: Karplus-Strong Physical Modeling** (Plucked String, Fractional Allpass-Tuning, Damping).
- [ ] **Kanal-Engine 6: Modale Resonatorsynthese** (2D Membranen, Chladni-Moden, Glocken- & Bar-Resonatoren).
- [ ] **Kanal-Engine 7: Additive Synthese** (64 Sinus-Partials mit spektraler Hüllkurvensteuerung).
- [ ] **Kanal-Engine 8: Granular-Synthesizer** (Live Grain Cloud Scheduler, Jitter, Scan-Head-Pointer).
- [ ] **Kanal-Engine 9: Formant / FOF Synthese** (Vokaltrakt-Modell mit $F_1 \dots F_5$ Parallelresonatoren).
- [ ] **Kanal-Engine 10: Multi-Sample Player** (SoundFont2 / SFZ Playback mit Sample-Interpolation).
- [ ] **Kanal-Engine 11: Chaotische Attraktoren** (Runge-Kutta-4 Integrator für Lorenz, Chua & Rössler).
- [ ] **Kanal-Engine 12: Bytebeat & Cellular Automata** (Formel-Evaluator & 1D/2D Gittermuster-Mapper).

#### Phase 3: Mathematische GPU-Visualisierungs-Pipeline (WebGPU / Three.js)
- [ ] Erstellung der GPU-Render-Schleife mit Shared Memory Kopplung (60–120 FPS ohne Audio-Glitching).
- [ ] **Shader 1 (FM-Torus & Lissajous):** Raymarching / Mesh-Shader für verdrillten 3D-Torus im Phasenraum.
- [ ] **Shader 2 (Schwingende Saiten & Chladni-Membranen):** Vertex-Displacement-Shader der Wellengleichung.
- [ ] **Shader 3 (Attraktoren & Chaos):** Instanzierte Partikel-Trails im 3D-Vektorraum.
- [ ] **Shader 4 (Wavetable-Wasserfall):** Dynamisches 3D-Heightmap-Mesh mit Sweep-Marker.
- [ ] **Shader 5 (Granular-Wolke):** 3D Punktwolke mit Alpha-Decay und Pitch-Y-Achse.
- [ ] **Master-Shader (Hyper-Sphäre & Maskierungs-Matrix):** Kreuzkorrelations-Sphäre & spektrale Heatmap.

#### Phase 4: Multi-Channel Mischpult, Modulations-Matrix & Effekt-Kette
- [ ] 16-Kanal-Mixer: Gain, Panning, Stereo-Imager, Mute/Solo, Pre/Post-Sends.
- [ ] Umfassende Modulations-Matrix pro Kanal (4x LFOs mit Wave-Morph, 4x Loopable Envelopes, 2x Math Modulatoren).
- [ ] Cross-Channel Modulation (Kanal $A$ moduliert Filter/Pitch von Kanal $B$).
- [ ] FX-Kette: Algorithmic Diffusion Reverb (CloudSeed FDN Modell), Stereo Ping-Pong Delay, Chorus/Flanger, True-Peak Limiter.

#### Phase 5: 16-Spur Sequenzer, MIDI/MPE & Formel-Tracker
- [ ] 16-Spur Step-Sequenzer UI mit Piano-Roll, Velocity-Kurven und Probability-Triggern.
- [ ] Euklidischer Rhythmus-Generator mit Live-Morphing von Pattern-Längen ($k$ Pulses in $n$ Steps).
- [ ] Web MIDI & MPE Input Parser mit polyphonem Aftertouch und Per-Note Pitch-Bend.
- [ ] Mathematischer Formel-Editor für algorithmische Melodie- und Bytebeat-Generierung.

#### Phase 6: Performance-Optimierung, Glassmorphism-UI & Export
- [ ] WebAssembly SIMD128 Optimierung für DSP-Rechenschleifen.
- [ ] Hochmodernes, ansprechendes UI-Design (Glassmorphism, Dark Mode, flüssige 120Hz Animationen).
- [ ] Audio-Export (Master-Mix als WAV und Stem-Export aller 16 Einzelkanäle).
- [ ] Video-/Visualizer-Frame-Export (Echtzeit-Aufzeichnung der mathematischen 3D-Animationen).

---

### 6. Datei- & Modulstruktur des Projekts

```
music-engine/
├── index.html                      # Hauptanwendung (HTML5 Shell)
├── package.json                    # Konfiguration & Dependencies
├── plan.md                         # Vorliegender Entwicklungsplan
├── Open-Source Audio Engines Analyse.md # Analyse der DSP-Bibliotheken
├── Klangerzeugung.md               # DSP-Grundlagen & Formeln
├── src/
│   ├── main.js                     # UI-Orchestrierung & Lifecycle
│   ├── audio/
│   │   ├── AudioEngine.js          # Haupt-Audiomanager & AudioContext-Brücke
│   │   ├── AudioWorkletProcessor.js # Echtzeit-Prozessorkern (Audio-Thread)
│   │   ├── RingBuffer.js           # Lock-free SPSC SharedArrayBuffer
│   │   ├── VoiceAllocator.js       # Polyphones Stimmen- & MPE-Management
│   │   ├── synths/                 # Die 12 Klangerzeuger-DSP-Module
│   │   │   ├── SubtractiveSynth.js # Virtual Analog (PolyBLEP, SVF)
│   │   │   ├── WavetableSynth.js   # 3D Wavetable & Spektral
│   │   │   ├── FMSynth.js          # 6-Op FM/PM Matrix Engine
│   │   │   ├── PhaseDistSynth.js   # Casio CZ & Wavefolding
│   │   │   ├── PhysicalStringSynth.js # Karplus-Strong & Waveguides
│   │   │   ├── ModalSynth.js       # 2D Platten & Glocken-Resonatoren
│   │   │   ├── AdditiveSynth.js    # Sinus-Partial-Bank & Resynthese
│   │   │   ├── GranularSynth.js    # Granular Cloud Engine
│   │   │   ├── FormantSynth.js     # Vokaltrakt FOF Resonatoren
│   │   │   ├── SamplerSynth.js     # SoundFont2 / SFZ Player
│   │   │   ├── ChaosSynth.js       # Lorenz / Chua / Rössler DGLs
│   │   │   └── BytebeatSynth.js    # Algorithmische Bit-Operatoren
│   │   ├── fx/                     # Kanal- und Master-Effekte
│   │   │   ├── CloudSeedReverb.js  # FDN Diffusions-Hall
│   │   │   ├── StereoDelay.js      # Biquad-gefiltertes Ping-Pong Delay
│   │   │   └── MasterLimiter.js    # Lookahead True-Peak Limiter
│   │   └── modulation/             # LFOs, ADSR Envelopes, Mod-Matrix
│   ├── visualizer/                 # GPU-Shader & Math-Visualisierung
│   │   ├── VisualizerEngine.js     # Three.js / WebGPU Renderer
│   │   ├── shaders/                # GLSL / WGSL Mathematische Shader
│   │   │   ├── FMTorusShader.js    # 3D Phasenraum-Torus & Lissajous
│   │   │   ├── WaveguideMeshShader.js # 3D Saiten & Membran-Deformation
│   │   │   ├── AttractorTrailShader.js # 3D Chaotische Partikeltrails
│   │   │   ├── WavetableMeshShader.js  # 3D Spektral-Topologie
│   │   │   ├── GranularCloudShader.js  # 3D Partikelwolke
│   │   │   └── InterplaySphereShader.js # Hyper-Phasen-Sphäre & Masking
│   │   └── widgets/                # Oszilloskope, FFT & Vektor-Displays
│   ├── sequencer/                  # Sequenzer, Tracker & MIDI
│   │   ├── SequencerEngine.js      # 16-Spur Polyphon-Clock & Scheduler
│   │   ├── EuclideanGenerator.js   # Bjorklund Rhythmus-Verteilung
│   │   ├── MidiHandler.js          # Web MIDI API & MPE Parser
│   │   └── FormulaTracker.js       # Mathematischer Noten-Evaluator
│   └── ui/                         # Benutzeroberfläche
│       ├── styles/                 # Glassmorphism & Cyber-Dark CSS
│       ├── components/             # Channel-Strips, Piano-Roll, Knob-Matrix
│       └── views/                  # Dashboard, Synth-Detail, Master-Interplay
```

---

### 7. Verifikations- und Validierungsplan

1. **DSP-Korrektheit & Aliasing-Freiheit:**
   - Analyse der Oszillator-Ausgaben mit hochauflösender FFT (Spektralreinheit > 80 dB THD+N bis zur Nyquist-Grenze).
2. **Audio-Thread-Stabilität:**
   - Stresstest: Gleichzeitiges polyphones Spielen aller 16 Kanäle unter voller DSP- und GPU-Last; Null Pufferunterläufe (Zero Audio-Dropouts).
3. **Echtzeit-GPU-Framerate:**
   - Kontinuierliche Überwachung der Visualisierungs-Framerate (konstant 60–120 FPS).
4. **Sequenzer- & MIDI-Timing:**
   - Jitter-freies Abspielen von Patterns mit einer zeitlichen Präzision von unter 1 Millisekunde.
