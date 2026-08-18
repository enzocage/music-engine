Für den Bau von VST-Instrumenten unterteilt sich das Spektrum der digitalen Klangerzeugung in etablierte Industriestandards, physikalisch-akustische Modellierungen und experimentelle mathematische Ansätze.

---

### 1. Klassische & Oszillator-basierte Verfahren

| Syntheseform | Grundprinzip | DSP-Schlüsselkonzepte | VSTi-Vorzeigebeispiele |
| --- | --- | --- | --- |
| **Virtual Analog (VA) / Subtraktiv** | Harmonisch reiche Grundwellenformen (Sägezahn, Rechteck/PWM, Dreieck) werden durch dynamische Filter (Lowpass, Bandpass) und Verstärker geformt. | Bandlimiting gegen Aliasing (PolyBLEP, minBLEP, BLIT, DPW); Zero-Delay Feedback (ZDF) Filter; nichtlineare Sättigung (Tanh-Approximation). | *u-he Diva, LennarDigital Sylenth1* |
| **Wavetable-Synthese** | Oszillatoren durchlaufen zyklisch Arrays vorgerechneter Einzelzyklen-Wellenformen; dynamisches Überblenden (Morphing) über Positions-Parameter. | 2D/3D-Interpolation (Hermite/Lagrange); Mipmapping/Bandsplitting (vorgefilterte Tables pro Oktave gegen Nyquist-Verletzung). | *Serum, Vital, Massive / Massive X* |
| **Additive Synthese** | Rekonstruktion komplexer Spektren durch Summierung hunderter diskreter Sinus-Oszillatoren mit individueller Frequenz- und Amplitudenhüllkurve. | IFFT-basierte Oszillatorbänke (Spectral Processing) zur CPU-Entlastung statt tausender `sin()`-Aufrufe im Audio-Loop. | *Camel Audio Cameleon5000, Native Instruments Razor* |
| **Vector-Synthese** | Dynamisches Überblenden zwischen vier Oszillatorquellen (VA, Wavetable, Sample) über einen 2D-Joystick / X/Y-Koordinaten-Array. | Koordinaten-Modulationsmatrix, dynamisches Gain-Staging mit Phasenkorrektur. | *Prophet VS, Korg Wavestate* |

---

### 2. Modulations- & Nichtlineare Synthese

* **Phase Modulation (PM / "Digital FM"):**
* *Prinzip:* Ein Modulator verändert die Phase eines Trägers ($y(t) = \sin(\omega_c t + I \cdot m(t))$). Echte FM moduliert die Frequenz direkt; fast alle digitalen FM-Synths (Yamaha DX7-Tradition) nutzen Phasenmodulation, da sie bei Modulation mit Feedback pitch-stabil bleibt.
* *DSP-Fokus:* Operator-Topologien/Routing-Matrizen, Phase-Accumulator-Feedback, Sinus-Lookup-Tables mit Anti-Denormal-Handling.


* **Phase Distortion (PD):**
* *Prinzip:* Nicht-lineares Auslesen des Phasen-Akkumulators (z. B. Sägezahn wird zu Knick-Rampen deformiert), wodurch aus einfachen Sinus-Lookups drastisch obertonreiche Formen ohne Filter entstehen (Casio CZ-Serie).
* *DSP-Fokus:* Transferfunktionen auf dem Phasenindex $0 \dots 2\pi$.


* **Waveshaping & Nichtlineare Verzerrung:**
* *Prinzip:* Ein Audiosignal durchläuft eine mathematische Übertragungsfunktion $f(x)$.
* *DSP-Fokus:* Chebyshev-Polynome (erzeugen bei Sinus-Einspeisung gezielte Harmonische ohne Intermodulation), Oversampling (2x–8x) zur Beseitigung von Aliasing-Spiegelungen.


* **Ringmodulation (RM) & Amplitudenmodulation (AM):**
* *Prinzip:* Multiplikation zweier Signale. Erzeugt Summen- und Differenztöne ($f_c + f_m$ und $f_c - f_m$).



---

### 3. Sample-basierte & Zeitbereichs-Methoden

* **Granularsynthese:**
* *Prinzip:* Zerlegung von Audio-Puffern in winzige Fragmente ("Grains", 1–100 ms), die zeitlich, räumlich und in Tonhöhe neu moduliert abgespielt werden.
* *DSP-Fokus:* Fensterfunktionen (Hann, Gauss, Tukey), Ringpuffer-Verwaltung, Jitter-Generatoren, polyphone Grain-Scheduler (Overtone-Dichte).


* **Concatenative / Corpus-based Synthesis:**
* *Prinzip:* Segmentiert große Audio-Datenbanken nach deskriptiven Merkmalen (Pitch, Brightness, MFCCs) und setzt neue Audioströme anhand gewünschter Zieldeskriptoren zusammen.


* **Wavestate / Wave Sequencing:**
* *Prinzip:* Nahtlose Aneinanderreihung unterschiedlicher Sample-Slices innerhalb eines einzelnen Tastenanschlags mit variablen Überblendzeiten und Tonhöhenfolgen.



---

### 4. Physical Modeling (Akustische & Mechanische Simulation)

```
[Erreger / Exciter]  --->  [Resonanzkörper / Waveguide]  --->  [Abstrahlung / Radiation]
(Impuls, Rauschen,          (Delay-Lines, Biquad-Bänke,         (Filter, Dispersion,
 Anstrich, Anblasdruck)      Streumatrizen, Federmodelle)        Stereo-Verteilung)

```

* **Digital Waveguide Synthese:**
* *Prinzip:* Simulation von Wellenausbreitung entlang Saiten und Röhren über bidirektionale Delay-Lines mit Streuknoten (Scattering Junctions).
* *DSP-Fokus:* Fractional Delay-Filter (Allpass/Lagrange-Interpolation für stufenloses Tuning), Dämpfungsfilter im Feedback-Pfad.


* **Karplus-Strong-Algorithmus:**
* *Prinzip:* Die Urform der Waveguides: Ein Rausch-Burst wird in eine rückgekoppelte Delay-Line mit Tiefpassfilter geschickt; simuliert gezupfte Saiten/Plucks extrem ressourcenschonend.


* **Modale Synthese:**
* *Prinzip:* Modelliert Festkörper (Glocken, Membranen, Metallstäbe) als Parallelschaltung hochgütiger Bandpassfilter/Biquads (Moden), die durch kurze Impulse angeregt werden.


* **FDTD (Finite-Difference Time-Domain) & Mass-Spring-Gitter:**
* *Prinzip:* Numerische Lösung der partiellen Wellengleichungen im diskreten Raum-Zeit-Gitter oder Verknüpfung virtueller Punktmassen über Dämpfer und Federn. Sehr rechenintensiv, bildet aber komplexe 3D-Körper realistisch ab.



---

### 5. Spektrale & Resonator-Synthese

* **Formantsynthese / FOF (Forme d’Onde Formantique):**
* *Prinzip:* Erzeugung von Vokalen und Stimmsounds durch Schachtelung exponentiell abklingender Sinusschwingungspakete (FOF) oder Filterung von Impulsketten mit mehreren festen Resonanzspitzen (Formanten).


* **Phase Vocoder / Spektral-Resynthese:**
* *Prinzip:* Fourier-Transformation (STFT) in Echtzeit. Manipulation von Betrags- und Phasenspektren im Frequenzraum vor der Rücktransformation via IFFT (z. B. spektrales Einfrieren, Dehnen ohne Pitch-Shift, Formant-Morphing).


* **Scanned Synthesis:**
* *Prinzip:* Ein physikalisches System (z. B. Mass-Spring-Netzwerk) bewegt sich langsam im Sub-Audio-Bereich; ein Auslesezeiger tastet dessen dynamische 1D/2D-Geometrie mit Audiofrequenz ab.



---

### 6. Ungewöhnliche, Mathematische & KI-getriebene Ansätze

* **Neuronale & Differenzierbare Synthese (DDSP / Neural Audio):**
* *Prinzip:* Verwendung von tiefen neuronalen Netzen, die klassische DSP-Blöcke (Oszillatoren, Rauschgeneratoren, Hallräume) steuern, oder direkte latente Generierung via Autoencoder (z. B. RAVE, EnCodec).


* **Chaotische Systeme & Seltsame Attraktoren:**
* *Prinzip:* Iterative nichtlineare Differentialgleichungen (Lorenz-, Rössler-, Chua-Attraktor) laufen direkt mit Audio-Abtastrate ab. Erzeugt raue, lebendige Oszillationsformen zwischen Stabilität und Chaos.


* **Fraktale Synthese & Iterated Function Systems (IFS):**
* *Prinzip:* Wellenformen werden durch Selbstähnlichkeit, fraktale Dimensionen oder rekursive Mandelbrot/Julia-Trajektorien moduliert.


* **Bytebeat / Bitwise Algorithmen:**
* *Prinzip:* Klangerzeugung durch einzeilige Bit-Operationen (z. B. `t * ((t>>12|t>>8)&63&t>>4)`), die bei Inkrementierung von `t` mit z. B. 8 kHz abgetastet werden. Erzeugt rohe Chiptune- und Glitch-Klangwelten.


* **Zelluläre Automaten (Cellular Automata):**
* *Prinzip:* 1D- (Wolfram) oder 2D-Gitter (Conways Game of Life) steuern Obertongeneratoren, Wavetable-Strukturen oder dynamische Resonator-Koeffizienten.



---

### Architektur-Fahrplan für VSTi-Entwickler

```
[MIDI / MPE Events]
        │
        ▼
[Voice Allocator]  ──► [Polyphonic Modulation Matrix] (LFOs, Envelopes)
        │
        ▼
[Oszillator Engine] (PolyBLEP / Wavetable / Waveguide / Chaos)
        │
        ▼ (Audio Stream)
[Nonlinear Filters / ZDF SVF]
        │
        ▼
[FX Chain & Master Limiter]

```

1. **Framework-Wahl:** C++ mit **JUCE** oder **CLAP** (moderner Standard mit direktem Poly-Modulation-Support); Prototyping in **FAUST**, **RNBO (Max/MSP)** oder **Soul**.
2. **Audio-Thread-Sicherheit:** Keine dynamischen Speicherallokationen (`malloc`, `new`), keine Mutexe/Locks und kein File-I/O im `processBlock()`.
3. **Aliasing-Prävention:** Oszillatoren immer mit PolyBLEP oder 2x/4x Oversampling mit linearphasigen Halbbandfiltern absichern.