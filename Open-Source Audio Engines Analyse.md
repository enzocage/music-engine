# **Architektur und Integration von Open-Source-Klangerzeugern und DSP-Bibliotheken für benutzerdefinierte Musik-Engines**

Die Entwicklung einer proprietären Musik-Engine erfordert eine fundierte Abwägung zwischen Eigenentwicklung und der Wiederverwendung etablierter Open-Source-Softwarekomponenten1. Im Bereich der digitalen Signalverarbeitung (DSP) und der Audiosynthese existiert eine Vielzahl von Open-Source-Bibliotheken, Frameworks und monolithischen Synthesizern, die sich hinsichtlich ihrer Klangerzeugungsmethoden, Speicherarchitekturen und Lizenzmodelle stark unterscheiden1. Eine hochleistungsfähige Audio-Engine muss in Echtzeitumgebungen strenge Anforderungen an Determinismus, Speicherallokation und Latenz erfüllen1. Während monolithische Anwendungssysteme oft umfangreiche Funktionalitäten wie grafische Benutzeroberflächen und Cloud-Anbindungen mitbringen, bieten modulare C/C++-DSP-Bibliotheken direkt integrierbare Signalverarbeitungsprimitive, die ohne Laufzeit-Overhead in benutzerdefinierte Audio-Graphen eingebunden werden können1.

## **Graph-basierte Audio-Laufzeit-Engines**

Für die Architektur einer Musik-Engine ist die Auswahl der übergeordneten Laufzeit- und Routing-Struktur von zentraler Bedeutung3. Graph-basierte Engines verwalten die Verknüpfung von Klangerzeugern, Modulatoren und Effekten über ein gerichtetes azyklisches Graph-Netzwerk (Directed Acyclic Graph, DAG), welches eine flexible Signalverarbeitung und Parallelausführung ermöglicht3.  
LabSound ist eine in C++ geschriebene, graph-basierte Audio-Engine, die ursprünglich als Abspaltung der WebAudio-Implementierung aus dem WebKit-Projekt hervorging3. Die Architektur basiert auf dem Konzept einzelner Audioknoten (AudioNode), die über Audio- und Steuerungskanäle dynamisch miteinander verschaltet werden3. Im Signalfluss durchläuft das Audiosignal typischerweise Generatoren wie Oszillatoren oder Sample-Buffer, welche in Filter- und Modulationsknoten eingespeist werden, ehe sie über Räumlichkeitsknoten an die finale Audioschnittstelle gelangen3. Die Kern-Engine von LabSound nutzt miniaudio als hardwarenahes Backend für das Audiosystem sowie libnyquist für das Dekodieren und Laden von verschiedenen Audiodateiformaten3. Die Signalverarbeitung erfolgt über dedizierte Knoten für Oszillatoren, Biquad-Filter, WaveShaper, Convolver und Räumlichkeitsberechnungen mittels HRTF (Head-Related Transfer Function)3.  
Hinsichtlich der Klangerzeugungsmethoden deckt LabSound die subtraktive Synthese, Sample-Playback, Rauschgeneratoren sowie Impulsantwort-Konvolution ab3. Zu den Architektur-Highlights gehören ein objektorientiertes Knoten-Modell, eine intern abgesicherte Multithreading-Nachrichtenübermittlung und ein standardisiertes Routing nach WebAudio-Vorbild3. Die Software steht unter der vereinfachten 2-Klausel-BSD-Lizenz3. Der direkte Quellcode-Import ist über das Repository unter https://github.com/LabSound/LabSound möglich3, während ergänzende C-Bindings über https://github.com/LabSound/labsound-c bezogen werden können9.

## **Modulare C/C++ DSP-Bibliotheken**

Für Entwickler, die direkte Kontrolle über den Audio-Callback und die mathematische Verarbeitung einzelner Samples benötigen, bieten modulare DSP-Bibliotheken vorgefertigte Primitive für Oszillatoren, Filter, Hüllkurven und Effekte1.

### **DaisySP: Einbettbare C++ DSP-Bausteine**

DaisySP ist eine für eingebettete Systeme und Echtzeit-Audioanwendungen optimierte C++-DSP-Bibliothek, die von Electrosmith entwickelt wurde1. Sie verzichtet auf dynamische Speicherallokationen im Audio-Prozesspfad und bietet eine flache, modulare Klassenstruktur1. Im Audio-Callback wird die DSP-Verarbeitung sampleweise oder blockweise durch direkten Aufruf der Prozessfunktionen der jeweiligen Objekte durchgeführt1. DaisySP vereint Bausteine aus etablierten Systemen wie Csound und den Open-Source-Hardwaremodulen von Mutable Instruments10.

C++  
\#**include** "daisysp.h"

static daisysp::Oscillator osc;  
static daisysp::OnePole flt;

// Initialisierung im Setup  
osc.Init(sample\_rate);  
osc.SetWaveform(daisysp::Oscillator::WAVE\_SAW);  
flt.Init();

// Audio-Callback (Sample-weise Verarbeitung)  
for (size\_t i \= 0; i \< size; i++) {  
    float saw\_sample \= osc.Process();  
    out\[i\] \= flt.Process(saw\_sample);  
}

Die Klangerzeugungsmethoden von DaisySP umfassen antialiased subtraktive Oszillatoren auf Basis der PolyBLEP-Technologie, Frequenzmodulation (FM), Physical Modeling wie Karplus-Strong-Saitensimulationen, Modalsynthese und Resonator-Netzwerke1. Darüber hinaus sind Drum-Modelle für analoge und synthetische Bass Drums, Snares und Hi-Hats integriert1. Im Bereich Sampling und Effekte bietet DaisySP Granular-Player, Looper-Module, Wavefolder, Bit-Decimator, Overdrive, Phaser, Limiter und State-Variable-Filter1. Die Bibliothek wird unter der MIT-Lizenz bereitgestellt1. Der Quellcode ist direkt erreichbar unter https://github.com/electro-smith/DaisySP1.

### **Soundpipe: C-basierte Hochleistungs-DSP-Bibliothek**

Soundpipe ist eine leichte, in ANSI C geschriebene DSP-Bibliothek von Paul Batchelor2. Sie umfasst über 100 DSP-Module, wovon viele direkt aus den Opcodes von Csound und der FAUST-Bibliothek portiert wurden2. Soundpipe verwendet ein durchgängiges Callback-Modell (sp\_data\*), bei dem die Signalverarbeitung deterministisch Sample für Sample berechnet wird2.  
Die Bibliothek unterstützt bandbegrenzte PolyBLEP-Oszillatoren (Sägezahn, Rechteck, Dreieck) und interpolierte Wavetable-Oszillatoren2. Zu den erweiterbaren Synthesmethoden zählen der Padsynth-Algorithmus zur Erzeugung additiver, spektral erweiterter Wavetables, FOF (Formant-Organisierte-Funktion) und FOG (Granular)-Synthese sowie Linear Prediction Coding (LPC)2. Für Zeit- und Frequenztransformationen stehen der Paulstretch-Algorithmus für extreme Zeitdehnung, Time-Domain Pitch-Shifting und Pitch-Tracking bereit2. Das Filter- und Effektangebot erstreckt sich von Moog-Ladder- und Butterworth-Filtern über Karplus-Strong-Modelle bis hin zu variablen Delay-Lines und Nachhall2. Soundpipe steht unter der LGPLv3-Lizenz2. Der Quellcode kann unter https://github.com/PaulBatchelor/Soundpipe bezogen werden2.

### **Cycfi Q: Modernes C++20 Header-Only Framework**

Cycfi Q ist eine moderne, C++20-basierte DSP-Bibliothek, die von Joel de Guzman entworfen wurde5. Die Bibliothek ist hochgradig funktional aufgebaut und nutzt Konzept-Programmierung sowie Metaprogrammierung, um verlustfreie Abstraktionen zu ermöglichen5. Sie besteht aus der kerneigenen DSP-Bibliothek (q\_lib), die frei von externen Abhängigkeiten ist, und einer optionalen I/O-Schicht (q\_io)5.  
Cycfi Q stellt phasenakkurate Oszillatoren, multimode Resonanzfilter und Hüllkurvengeneratoren zur Verfügung5. Zu den spezialisierten Algorithmen gehören die *Bitstream Autocorrelation* (BACF) für eine ultraschnelle Tonhöhenerkennung in Echtzeit sowie der *Virtual Pickup Placement Simulator* zur Modellierung von Saiten- und Tonabnehmer-Positionen17. Als Header-Only-Bibliothek konzipiert, verzichtet Cycfi Q im Prozesspfad vollständig auf dynamische Speicherallokationen und nutzt Funktionskomposition für Compile-Zeit-Signalflussgraphen5. Die Lizenzierung erfolgt unter der Boost Software License 1.0 (BSL-1.0) sowie der MIT-Lizenz5. Der Quellcode-Import erfolgt direkt über https://github.com/cycfi/q5.

## **Monolithische Synthesizer-Engines und Algorithmen-Sammlungen**

Ergänzend zu isolierten Bausteinen bieten vollständige Open-Source-Synthesizer tiefgehende Einblicke in hochkomplexe Modulations- und Synthese-Architekturen4.

### **Vital / Vitalium: Spektrale Wavetable-Synthese**

Vital, entwickelt von Matt Tytel, ist ein professioneller Synthesizer mit spektraler Wavetable-Synthese4. Der Quellcode enthält komplexe Module für spektrales Warping, Echtzeit-FFT-Transformationen und flexible Modulations-Matrizen4. Der Verarbeitungsfluss führt das Signal von einem Wavetable-Frame über spektrale Warping-Operationen (wie Phasenverschiebung, Spektralfaltung oder Formant-Filterung) durch ein duales Filternetzwerk in einen dedizierten Effektbus, wobei LFOs und Hüllkurven sämtliche Parameter im Audiorate-Bereich modulieren können4. Für Open-Source-Engine-Entwickler ist die Abspaltung *Vitalium* von Relevanz, da dort alle proprietären Marken- und Online-Komponenten entfernt wurden, um eine reine FOSS-Verarbeitung zu gewährleisten6.  
Die Klangerzeugungsmethoden umfassen spektrales Wavetable-Morphing, Text-to-Wavetable-Generierung, Frequenz- und Phasenmodulation zweier Wavetable-Oszillatoren sowie Rauscherzeugung auf Basis von Audiodaten-Samples4. Der Quellcode ist unter der GNU General Public License v3.0 (GPLv3) lizenziert4. Der direkte Quellcode ist unter https://github.com/mtytel/vital abrufbar4.

### **Mutable Instruments Eurorack Codebase: Makro-Synthese und Resonatoren**

Die von Émilie Gillet geschriebenen C++-Quellcodes für die Eurorack-Module *Plaits*, *Rings* und *Clouds* gelten als Referenz für innovative Klangerzeugungs- und Granular-Algorithmen19.  
Das Modul *Plaits* fungiert als Makro-Oszillator mit 16 verschiedenen Synthesemodellen, darunter Virtual Analog, Waveshaping, FM, Granular-Formant, Additiv, Modal-Perkussion und Physical Modeling19. *Rings* konzentriert sich auf Physical Modeling Resonatoren, welche Modal-Resonatoren für gezupfte oder geschlagene Instrumente, Karplus-Strong-Saitenmodelle sowie sympathetische Saitenresonanzen implementieren24. *Clouds* arbeitet als Granular-Texturizer, der ankommende Audiosignale in Echtzeit granuliert, zeitlich dehnt, in der Tonhöhe verschiebt und mit Dichte- und Positionsmodulationen versieht24. Die gesamte Codebasis ist unter der MIT-Lizenz freigegeben11. Der Quellcode ist unter https://github.com/pichenettes/eurorack zugänglich19.

### **TinySoundFont: Sample-basierte Synthese (SF2 Rendering)**

TinySoundFont von Bernhard Schelling ist eine in einer einzigen C/C++-Header-Datei enthaltene Bibliothek zum Rendern von SoundFont2 (SF2)-Dateien20. Sie eignet sich zur Ergänzung einer Musik-Engine um echtzeitfähiges, multitimbrales Sample-Playback mit minimalem Ressourcenverbrauch25. Die Bibliothek führt sample-basiertes Wavetable-Playback aus, verarbeitet Loop-Punkte, verwaltet Multi-Layering und generiert Hüllkurven sowie Biquad-Filter strikt nach SF2-Spezifikation20. TinySoundFont steht unter der MIT-Lizenz20. Der Import erfolgt direkt über https://github.com/schellingb/TinySoundFont20.

## **Spezialisierte Effekt-Engines und Deklarative Algorithmen**

Ein wesentlicher Bestandteil einer vollumfänglichen Musik-Engine ist das Effekt-System, für dessen Realisierung verschiedene spezialisierte Repositories bereitstehen26.

### **CloudSeed und VitaliumVerb: Algorithmitische Reverb-Prozessoren**

CloudSeed, entwickelt von Valdemar Erlingsson, ist ein Open-Source-Hall-Algorithmus, der speziell auf die Erzeugung von dichten, ätherischen Hallfahnen ausgelegt ist28. Er basiert auf einer Feedback-Delay-Netzwerk-Struktur (FDN) mit mehrstufigen Diffusionsketten28. Im Gegensatz dazu stellt *VitaliumVerb* eine eigenständige Portierung des Hall-Moduls aus dem Vital-Synthesizer in der Programmiersprache Rust dar27.  
Die zugrunde liegenden DSP-Mechanismen beinhalten mehrstufige Delay-Diffusion, kaskadierte Allpass-Filter sowie eingewebte Chorus-Modulationen zur Vermeidung metallischer Eigenresonanzen27. CloudSeed ist unter der MIT-Lizenz verfügbar28, während VitaliumVerb unter der GPLv3 steht27. Der Quellcode von CloudSeed kann unter https://github.com/ValdemarOrn/CloudSeed bezogen werden28, der Quellcode von VitaliumVerb unter https://github.com/BillyDM/vitalium-verb27.

### **FAUST Libraries: Deklarative DSP-Kompilierung**

FAUST (Functional Audio Stream) ist eine funktionale Programmiersprache für DSP, die von GRAME entwickelt wird11. Das System kompiliert deklarative mathematische Beschreibungen direkt in hochoptimierten C++-Code11. Die dazugehörigen Faust-Bibliotheken (faustlibraries) enthalten mathematisch aufbereiteten Quellcode für hunderte von DSP-Algorithmen26. Besonders hervorzuheben ist die Bibliothek mi.lib, welche eine umfassende Sammlung für physikalische Modellierung auf Basis von Feder-Masse-Systemen und dem Cordis-Anima-Formalismus bietet32.  
Die Faust-Bibliotheken decken die physikalische Modellierung von Membranen, Saiten und Resonatoren ab und bieten mathematisch exakte IIR/FIR-Filterarchitekturen, Wavefolder sowie nichtlineare Sättigungsmodelle2. Der Quellcode ist unter einer Dual-Lizenzierung (GPL/MIT/LGPL je nach Modul) zugänglich26. Der Quellcode-Import erfolgt über https://github.com/grame-cncm/faustlibraries26.

## **Vergleichende Systemmatrix**

Die nachfolgende Übersicht vergleicht die analysierten Open-Source-Quellen hinsichtlich ihrer primären Paradigmen, Implementierungssprachen, Lizenzierungsmodelle, Hauptanwendungsfälle und direkten Repository-URLs für den Import in eine eigene Musik-Engine.

| Bibliothek / Framework | Primäres Paradigma | Programmiersprache | Lizenz | Wiederverwendbarkeit & Hauptanwendungsfall | Source-Code Repository URL |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **LabSound** | Graph-Engine / WebAudio | C++ / C | BSD 2-Clause | Routing, Knotengraph, räumliches Audio (HRTF)3 | https://github.com/LabSound/LabSound \[cite: 3\] |
| **DaisySP** | Modulare DSP-Bausteine | C++ | MIT | Generische Synthese, Effekte, Embedded/Realtime1 | https://github.com/electro-smith/daisysp \[cite: 1\] |
| **Soundpipe** | Modulare DSP-Primitives | C | LGPLv3 | Effiziente C-Synthese, Padsynth, FOF/FOG Granular2 | https://github.com/PaulBatchelor/Soundpipe \[cite: 2\] |
| **Cycfi Q** | Functional DSP / Modul-System | C++20 | BSL-1.0 / MIT | Header-only Primitive, Tonhöhenerkennung, Pickup-Sim5 | https://github.com/cycfi/q \[cite: 5\] |
| **Vital / Vitalium** | Spektrale Wavetable-Synthese | C++ | GPLv3 | Wavetable-Morphing, Spektrale Transformationen4 | https://github.com/mtytel/vital \[cite: 4\] |
| **Mutable Instruments** | Makro-Synthese / Phys. Modeling | C++ | MIT | Resonatoren, Modal-Synthese, Granular-Texturen19 | https://github.com/pichenettes/eurorack \[cite: 19\] |
| **TinySoundFont** | Sample-basierte Synthese | C / C++ | MIT | SF2-Sample-Playback, Instrumenten-Rendering20 | https://github.com/schellingb/TinySoundFont \[cite: 20\] |
| **CloudSeed** | Algorithmitischer Reverb | C\# / C++ | MIT | Dichte Diffusions-Hall-Netzwerke28 | https://github.com/ValdemarOrn/CloudSeed \[cite: 28\] |
| **VitaliumVerb** | Algorithmitischer Reverb | Rust | GPLv3 | Portierter Reverb-Prozessor aus Vital27 | https://github.com/BillyDM/vitalium-verb \[cite: 27\] |
| **Faust Libraries** | Deklarative DSP-Synthese | FAUST / C++ | Dual GPL/MIT | Physikalische Modellierung, Filterentwurf via Cross-Compiler11 | https://github.com/grame-cncm/faustlibraries \[cite: 26\] |

## **Technische Integrationsarchitektur, Threading und Lizenzierungsstrategie**

Beim Aufbau einer eigenen Musik-Engine auf Basis existierender Quellcodes müssen funktionale, laufzeitrelevante und lizenzrechtliche Rahmenbedingungen systematisch aufeinander abgestimmt werden1.

### **Pufferungs- und Thread-Management**

Audio-Engines trennen die Abarbeitung im Audio-Callback (Echtzeit-Thread) strikt vom Steuerungs-Thread, in welchem GUI-, MIDI- oder Sequenzer-Ereignisse verarbeitet werden17. Im Echtzeit-Prozesspfad dürfen unter keinen Umständen Thread-Sperren (Mutexes), systembedingte Speicherallokationen (malloc, new) oder E/A-Operationen ausgeführt werden1. Bibliotheken wie DaisySP und Cycfi Q halten diese Vorgaben ein, indem sämtliche internen Datenstrukturen bei der Initialisierung im Speicher präallokiert werden1.  
Hinsichtlich der Datenverarbeitung unterscheiden sich die Bibliotheken: Während graphische Frameworks wie LabSound Blöcke fester Größe (beispielsweise ![][image1] oder ![][image2] Samples) verarbeiten, arbeiten Soundpipe und Cycfi Q rein sampleweise2. Ist eine sampleweise Logik erforderlich (etwa bei Rückkopplungen innerhalb von FM-Modulationen), müssen Bibliotheken ohne Block-Puffer-Overhead gewählt werden1. Die systembedingte Puffer-Latenz ![][image3] berechnet sich aus der Blockgröße ![][image4] und der Abtastrate ![][image5]:  
![][image6]  
Bei einer Standard-Blockgröße von ![][image7] Samples und einer Abtastrate von ![][image8] ergibt sich eine theoretische Puffer-Latenz von:  
![][image9]

### **Lizenzrechtliche Einordnung und Schichtenarchitektur**

Die lizenzrechtliche Charakteristik der wiederverwendeten Bibliotheken bestimmt die Wahl der Schichtenarchitektur für das Gesamtsystem4. Die Anbindung unterscheidet sich im Wesentlichen zwischen permissiver Lizenzierung und Strong Copyleft:

* **Permissive Schicht (MIT, BSD-2-Clause, BSL-1.0)**: Bibliotheken wie DaisySP, LabSound, Cycfi Q, TinySoundFont, CloudSeed sowie die Codebasis von Mutable Instruments können ohne lizenzrechtliche Einschränkungen direkt in proprietäre oder geschlossene Audio-Engines einkompiliert und statisch verlinkt werden1.  
* **Weak Copyleft Schicht (LGPLv3)**: Soundpipe erlaubt die Einbindung in proprietäre Systeme unter der Bedingung, dass die Bibliothek als dynamische Bibliothek (.so, .dll oder .dylib) verlinkt wird, sodass Endanwender in der Lage sind, die Bibliothek unabhängig vom Hauptprogramm auszutauschen2.  
* **Strong Copyleft Schicht (GPLv3)**: Die Direkteinbindung von Vital/Vitalium oder VitaliumVerb überträgt die GPLv3-Lizenzpflicht auf das gesamte abgeleitete Werk4. Soll die eigene Musik-Engine proprietär bleiben, dürfen GPLv3-Komponenten nicht innerhalb desselben Prozessbereichs einkompiliert werden4. Stattdessen müssen sie über eine Inter-Process Communication (IPC) oder als extern isolierter Plugin-Prozess (beispielsweise via CLAP oder VST3) angebunden werden6.

## **Fazit und Handlungsempfehlungen**

Für die Entwicklung einer performanten, modularen und zukunftssicheren Musik-Engine wird eine hybride Integrationsarchitektur empfohlen:

> 1. **Routing- und Laufzeit-Infrastruktur**: Verwendung von **LabSound** als übergeordnetem Knoten-Graphen für das Dynamic Routing, das Thread-Handling und die räumliche Audioausgabe3.  
> 2. **Kerneigene DSP-Erzeugung**: Einbindung von **DaisySP** und **Cycfi Q** innerhalb der einzelnen Audioknoten zur Abdeckung von PolyBLEP-Oszillatoren, Physical Modeling, Drum-Synthese und präzisem Pitch-Tracking1.  
> 3. **Erweiterte Klangerzeugung**: Ergänzung von **TinySoundFont** für ressourcenschonendes SF2-Sample-Playback sowie direkte Nutzung der **Mutable Instruments**\-Codebasis (Plaits/Rings) für hochgradig charakteristische Makro- und Modal-Synthese19.  
> 4. **Effekt-Netzwerke**: Integration von **CloudSeed** als dediziertem C++-Reverb-Knoten für hochwertige Diffusions-Hallfahnen28.  
> 5. **GPL-Isolierung**: Auslagerung von hochkomplexen GPLv3-Komponenten (wie der Spektralsynthese aus **Vital**) in einen separaten Subprozess, um den proprietären Kern der eigenen Engine lizenzrechtlich zu schützen4.

#### **Referenzen**

> 1. electro-smith/DaisySP: A Powerful DSP Library in C++ \- GitHub, [https://github.com/electro-smith/daisysp](https://github.com/electro-smith/daisysp)  
> 2. Soundpipe \- A lightweight music DSP library. \- GitHub, [https://github.com/PaulBatchelor/Soundpipe](https://github.com/PaulBatchelor/Soundpipe)  
> 3. GitHub \- LabSound/LabSound: :speaker: graph-based audio engine, [https://github.com/LabSound/LabSound](https://github.com/LabSound/LabSound)  
> 4. mtytel/vital: Spectral warping wavetable synth \- GitHub, [https://github.com/mtytel/vital](https://github.com/mtytel/vital)  
> 5. cycfi/q: C++ Library for Audio Digital Signal Processing \- GitHub, [https://github.com/cycfi/q](https://github.com/cycfi/q)  
> 6. Vital/Vial Open Source Repository, [https://forum.vital.audio/t/vital-vial-open-source-repository/9736](https://forum.vital.audio/t/vital-vial-open-source-repository/9736)  
> 7. Sound support · Issue \#31 · BabylonJS/BabylonNative \- GitHub, [https://github.com/BabylonJS/BabylonNative/issues/31](https://github.com/BabylonJS/BabylonNative/issues/31)  
> 8. LabSound/LabSoundGraphToy: Graph Explorer for LabSound \- GitHub, [https://github.com/LabSound/LabSoundGraphToy](https://github.com/LabSound/LabSoundGraphToy)  
> 9. LabSound C bindings \- GitHub, [https://github.com/LabSound/labsound-c](https://github.com/LabSound/labsound-c)  
> 10. GitHub \- rheslip/DaisySP\_Teensy: DaisySP Audio DSP Library for the Teensy 4, [https://github.com/rheslip/DaisySP\_Teensy](https://github.com/rheslip/DaisySP_Teensy)  
> 11. olilarkin/awesome-musicdsp: A curated list of my favourite music DSP and audio programming resources \- GitHub, [https://github.com/olilarkin/awesome-musicdsp](https://github.com/olilarkin/awesome-musicdsp)  
> 12. electro-smith/DaisyDuino: Arduino Support for the Daisy Audio Platform. \- GitHub, [https://github.com/electro-smith/DaisyDuino](https://github.com/electro-smith/DaisyDuino)  
> 13. Open-Source Audio Plugins & Apps \- GitHub, [https://github.com/webprofusion/OpenAudio](https://github.com/webprofusion/OpenAudio)  
> 14. GitHub \- jpiringer/LinearPredictionCoder: an au- & vst-plugin that does linear prediction coding and pitch shifting. sounds crazy on voice., [https://github.com/jpiringer/LinearPredictionCoder](https://github.com/jpiringer/LinearPredictionCoder)  
> 15. Time Stretching \- HISE Forum, [https://forum.hise.audio/topic/2628/time-stretching](https://forum.hise.audio/topic/2628/time-stretching)  
> 16. Soundpipe – A lightweight music DSP library written in C | Hacker News, [https://news.ycombinator.com/item?id=9746366](https://news.ycombinator.com/item?id=9746366)  
> 17. shayan-taheri/Q: C++ library for Audio Digital Signal Processing \- GitHub, [https://github.com/shayan-taheri/Q](https://github.com/shayan-taheri/Q)  
> 18. stephenberry/Q: C++ library for Audio Digital Signal ... \- GitHub, [https://github.com/stephenberry/Q](https://github.com/stephenberry/Q)  
> 19. plaits.cc \- pichenettes/eurorack \- GitHub, [https://github.com/pichenettes/eurorack/blob/master/plaits/plaits.cc](https://github.com/pichenettes/eurorack/blob/master/plaits/plaits.cc)  
> 20. BardMusicPlayer/3rd-party-licenses.md at develop \- GitHub, [https://github.com/BardMusicPlayer/BardMusicPlayer/blob/develop/3rd-party-licenses.md](https://github.com/BardMusicPlayer/BardMusicPlayer/blob/develop/3rd-party-licenses.md)  
> 21. Vitalium : r/VitalSynth \- Reddit, [https://www.reddit.com/r/VitalSynth/comments/u7xdrv/vitalium/](https://www.reddit.com/r/VitalSynth/comments/u7xdrv/vitalium/)  
> 22. Free/Open Source Vital: Anyone Using It? \- Cakewalk Discuss, [https://discuss.cakewalk.com/topic/43227-freeopen-source-vital-anyone-using-it/](https://discuss.cakewalk.com/topic/43227-freeopen-source-vital-anyone-using-it/)  
> 23. vital/LICENSE at main · mtytel/vital · GitHub, [https://github.com/mtytel/vital/blob/main/LICENSE](https://github.com/mtytel/vital/blob/main/LICENSE)  
> 24. Any Rings clones? \- Plugins & Modules \- VCV Community, [https://community.vcvrack.com/t/any-rings-clones/21963](https://community.vcvrack.com/t/any-rings-clones/21963)  
> 25. replace fmod · Issue \#167 \- GitHub, [https://github.com/openframeworks/openFrameworks/issues/167](https://github.com/openframeworks/openFrameworks/issues/167)  
> 26. grame-cncm/faustlibraries: The Faust libraries \- GitHub, [https://github.com/grame-cncm/faustlibraries](https://github.com/grame-cncm/faustlibraries)  
> 27. BillyDM/vitalium-verb: A Rust port of the reverb module from the Vital/Vitalium synthesizer, [https://github.com/BillyDM/vitalium-verb](https://github.com/BillyDM/vitalium-verb)  
> 28. GitHub \- baylessj/daisy-reverb: a fork of guitarml/daisycloudseed with expanded controls, [https://github.com/baylessj/daisy-reverb](https://github.com/baylessj/daisy-reverb)  
> 29. CloudSeed/license.txt at master · ValdemarOrn/CloudSeed · GitHub, [https://github.com/ValdemarOrn/CloudSeed/blob/master/license.txt](https://github.com/ValdemarOrn/CloudSeed/blob/master/license.txt)  
> 30. Search results for Electrosmith Daisy \- MATRIXSYNTH, [https://www.matrixsynth.com/search?q=Electrosmith+Daisy\&by-date=true](https://www.matrixsynth.com/search?q=Electrosmith+Daisy&by-date=true)  
> 31. Arco: A Flexible Audio Processing Framework \- Carnegie Mellon University, [https://www.cs.cmu.edu/\~rbd/papers/arco-icmc2025-web.pdf](https://www.cs.cmu.edu/~rbd/papers/arco-icmc2025-web.pdf)  
> 32. faustlibraries/mi.lib at master \- GitHub, [https://github.com/grame-cncm/faustlibraries/blob/master/mi.lib](https://github.com/grame-cncm/faustlibraries/blob/master/mi.lib)  
> 33. Vital goes Open Source\! huge and enormous thanks to sir tytel\! \- Feedback, [https://forum.vital.audio/t/vital-goes-open-source-huge-and-enormous-thanks-to-sir-tytel/5611](https://forum.vital.audio/t/vital-goes-open-source-huge-and-enormous-thanks-to-sir-tytel/5611)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAAAaCAYAAADsS+FMAAAB+0lEQVR4Xu2XzysFURTHj1AkSWRlgbVYKKXYUVYWUpR/gT/AjmTJQlZSWFmQbJRkxUZZKClLsVHKRliQH+frzDVnjpn33ryY2dxPfWvuOfPmnnvm3jPnEXk8Hk/5LLFuWZ+BDqJuqmHdBz7oiTUduSNbdimMZc74LEOsZ2sshQ8KJ6kwPrDM6rHGDKkmiW0kGDew3ik5JqwB96dORiNrnzVL8oCpiFe4o/gkZQUWpXctXg5iHVU2zSXJb1InY5LVz6oimQC7xJL6oX9IH0lcHcbeYsaOAdYM64bKiPuMJBHglGTiztD9HcS6GmcN4kNMiLGNNUZSy+LA7nUJKCsZb+q6nWTiK2VboOSzmQWIDzEdsVpZlSSL3NY3BRyzmoLr1MlAvdgxNjwAk6NIAdSLUuliraZUMVxhn1A2xA0bvhiOXta8GqdOhqsXmmGSibaC8aPy5YFLRl2MXb8ovcNB6mToeqFxAaBerBlf1ryQxGJxMYJD+l1QUycj7ssBVkgmumZ1G18h/uOYnFDxZFyQNI9azo9rNJcFaSbpL+KopehkeTJIEke9srk2wHbMGvhL3hnnrA1rVKBxebDGnEC3qYvjOMli0ZkmAX/Szv9hj8K37hTXXeIzu2iNOYFFIyGvJP+PELMtqA7UCnc83HHZjNzh8Xg8Ho/H48mOL/VwlJlBZvwPAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAABaUlEQVR4Xu2UvS9FQRDFj0IhkYhQEDRK0QmFRqJSKSg1729Q+Cgk/ghBJAqdhl6i0Cs0NBIFiUgkolL6mGN33Nl5e5/3orS/5OTtnJnd2Xfv7gUKBWBDtO7NSI/oWfQZdZimf5hAVfMuGk3TKceoiqlc8z6EhbpizAV1ccui6MTErGfNjPGy9KK++YXoUdRtvG2Eev4qH6g2qEyLXpzXRKvmnMzcqvGGo3dvPMbzJiZs/uS8Jlo1HxLtIv1X4wj1d8Z7jd6p8/702HPsINQvGI9nw54fas7ka+mkOd89a699QphE2vwqTefppDkf5aU3hT3RbRzz3esG1Kul3ebnon1vCmMI8z0PCP6gT1jaaX4g2nSeHjjOu7EJA9ed8qblt+ZroobzRkRHcbyC+vvMdfu9aRlAKNryCWEW6SGyWoo1vIaMl2OsNJA/mN9w55zEd6Ni/GZqOPZNVbzvCr//6us6ZyZfKBT+EV/YQm0sodhhsQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAcCAYAAACtQ6WLAAAAg0lEQVR4XmNgGOQgHIgz0QVh4D8Qr0EXBAFGBohkEboECBgzQCTFkQWdgTgEiPdBJUFsEAaDACjnDxA/hLJBYnAAsy8dWRAGYPaJoEuAwHwGiCRWcBqIf6MLwgC658/BGDwMEEkbKN8ViGNgkiAAkgSFK0hiD7IECIC8AvKbMLrEiAcAJy0YdXJvTrIAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAaCAYAAAAXHBSTAAACCklEQVR4Xu2WP0iVYRTGn6jAhghJgjYNFISgoVGDcErCRQUFdycdI4KGQBoVKcVFqKYWhxbBwcEhQhB0EZxEFEFQLAhzMCjP0zkv37nnfnRN+Ohe+H7wwPc+573v/Z77/rtASUlJkUyJ9kS/TUuVZTSJDq1GnYjGK3rUMb+QvfiVUCNvRA+jWc80ixZFr6ChxiqqygHyw9YtI6Ju0TVoKM5a5Ec06p01aCCyCg12PyvjnuidazcEP91zGzTUlvNeowH300LwuNQY7Ja1uZ8airSfPE+goT5a+7urPRbNQeuDppfWbrU+ndAf4oO1/5Uh6Hh3Y+Gi+P3kScc799N8qHEpsubhj+O957h8KMLVculQeScdmYG+5I7oQajlheoN3n8L1QK9n/K4gWy2IjFU6tvjvBjqi2gUeujMOr9VdAZdxqei2+anUH3I3uNCITdE76Pp2BQdRxNZKH4J1Q6d8S7Xx4fi3uTyTPBgGoZe5hwnXepHog57TqH6RU/N+yufkKVPyvu3wON9MpqonimSZoufIT4UfX8lsLYLPaDiOAmGeiv6FgtFkReK0EszUivUNmqHuiNaFr0ItULICzVg3nVr+1DTogl7JuuiR/bMz/DlCVdL+t/JUDfN830KYQXVS5f6LLpqfRgo+SnYM9FX6KHgDxQuWx4Q+9CxSbr8Ke7XOFZJSUlJyR/OAavMi1kHayCeAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAAA/UlEQVR4XmNgGLFAHYjvArE5ugQpIByI3wNxMRD/B2JuVGniAUjzJCD+BGWTBQQZIJpt0CVIBZ4MEIN40SWIBbpAHALEhxggBoHYIMyKrIgYYMUA0fgRiL9C2SBMNgC5Zg26IKkAFM0gg4LQJUgFxgwQg8TRJUgFrQwUpBtkcBWIv6ELQkEPEM8A4sNALIMmhwFArtmKLggEIkB8AMq+BcQOcBksgIUBYpAfugQQCDNA5EAYlP/wAk0GiEIOdAkGSLZhBOIIBjyZGCTxlgES0E/Q5EBAnwE1An4iseGAhwHhXJACXIEIKlIeMUAigg9NDg6CgfgGAx4Fo2AQAQD+iDAHSGlB6wAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABcCAYAAADTcOmhAAAED0lEQVR4Xu3dMYhdRRQG4BM0oBiNohCDATGdVQrBIqRSizRJIYKiZQobBUmh2IgIKS2EqGCjjQgiWIggkmKxSWGhhWKjECwSUmgaI2gwOiczl503+xSi7Hs37vfB4c6b8/ay5c/ceXMjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIDtdXOpP7u6tNiOPW3+x1ZXF9sAAKzK8dgMbcvk/IFxEgCA1dkodThqMNu72Lrm03ECAIDVmh515vWDvtEcGScAAFidg6VOtfEDUVfZ9m22hTUAgHXLsJahbZKB7bPu80fdGACANbgwfM7Hohna8hek6UrXAwBgDcbA9lzUwPZq1ND2Q5u/r9SJ1nui1eelfi91U6lbo+5/u9y+fz1eib//hSoAwI7W71+b7IrNIz5y/9rJxfaWYPVlqXNtvD/+XWBL430BAIh6nMft42TxVGyGtunR6GQMVhnQ3m7jMbDdVuqtqCtzvbtLvVPqxW5uum/eIysP7QUA2PHG8NXL3rL9azk/vfngj1KHut4Y2F5u11y1y++mDGnvtfG3UUNdmv6XX0s93sYAADvW66V+iRqS8vraYvua07H8F6JjyPui1Jk27gNb7oXrV8k22jX//q5ufpLz95baPTYAALg+Y2DLfXD948wpsGWIGwPbnVG/mytuo5zPIPnk2AAAWLf8ZeWN9J7OMbAd7eb6wJb74O5p45SPP1N+tz/3bXwkmlerbADAbDwUNaD0bxaYq2NR/9exclUsZVib5qbQ9mGp81H3r/Wh9Gypn0tdbJ/He/b3AABYq3djc2UJAIAZuT/qwbO/lbrUxo8ufAMAgLU6HDWk5eram22ccwAAzEwGtvFgWgAAZiLPIlt2MO12Gzf33wgFALAWz8Tyg2kBAJiJfGl6vlw95WPRfOfmMrfE1hWnf6rj9c8AAPivMlxN+9c+ifpCdAAAZuSRqKHt+7EBAADb4elSX5e6Y2wAALB+e0udLvVN+FUnAMAsbZR6MGpY+26xBQDAHFhVAwCYsX0hsAEAzNJjsfUMOMENAGCG8m0NghoAwIz9VOrCOAkAwHzk6trJcRIAgHk4GDWw5ZEeAADM0LNRA9uusVGcK/VGqReGeQAAVuhMqavjZNQgd6zU86U+HnoAAKzQlahvORidiLrydnZsAACwGqdK7YkayvLg3N7DpS628fuljnQ9AABWIB91ZlA7Wur80EsvlTrUxpf7BgAAq3Gg1FdR967tHnqTXH3bP04CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPB/9xfjaeaDBvCLuAAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG8AAAAaCAYAAAC5KgISAAADVUlEQVR4Xu2YTahNURTHl1CE5OORkfuE8hEDMfCdDEgmKMqYEWZIGZDewIDkIyX1GCkZmChFuiGJYqKMJFKKUEIhH+tv7eWss+6+755z75P7OvtX/97da++z3znnf/Ze6xyiRCKRSCSqyXHWS9avoOv5bhrFehP6oE+s3bkR1WIYyf0a6zsCKym7VxDaMS5TNua26yvNT8omwwl6TrIW+WCFeE95U2Lm7WOdN+3DJGPPmRj4wKqZ9lrWD9MuxQTWNdYhkn+2K9crvKa4qVVjPzU3D/FLLvY1xMeH9hzWnaz7L69ITCzNdtZy1giSf4RV6PnsAxWlmXlIL7oqx5j4xRDbGNr4G9vdYB48KM1DEuPAfZLJ52fdNIPVb9pVppl5YAdrp4tdIRm/PrSnhjY0N8SmUwfb5nfzu5dk4qcm1kfVzneWgcyLobWEXWnIgWrgF5Jdza/EQiDf4emwYDJMrPs08t1QYSTJzSkjvc4ilDFvK8nYTb6DuUGZgdCqfHcxNN9Z1pFMqMn3o+lbzTpL0r8l6GBo18IYJGUYjv2+HfSip/mOLqCoeXggMG6Di2OFIb40tB+ENrREBxXF5juLToh8Z8tfgC0UfRY8BDaGi2zXPIDVP1TNU4Nm+g6mTo33czbJ+Hcu3pJYZQlOk0z4nLXQ9cXMQ0LuBvPa2TZ7/hxZjCLmofiYaNrY2bRgwbHYmTzbqPGeDshkkve7GKMpW30eb56OXWNi3rx7JJUYip8zJl5jfSPZfpG8J4W4mqelNdSOmYNNK/PwAm5fFUA/ZeeO4jD2PreYStYWj1kXfNDwhOJLWc3DCUGzSFbwMjPGmofciW1VQYGEJ023F6203pJsIUDNQ7L3eeN/cpTknFHoeW5R9qB56TVqPvfVJUyf52JRrlLzyS29rGM+SI0rD+jqwzHAmoe4fdVA3wuS7cTPo8C8UyQX1Q3ofcJ3TQgv1WjjWgBWor+nVpY9IYZPbvrZbUFuxD8kZh5ATFdYK/OeUWvzprBusg64vkQHxMzbHGIoGIA17wTrSPgNHrFWhN84BiYBrH79rgrzxoWYHZPogDo1bgnQXdbwMEaTOqQG7iXZIlCc2MIG2y0KFWxD9RDTjwQQ8qmfK5FIJBKJRCKRSAw6vwGujwXhnZLjqgAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH4AAAAaCAYAAABxRujEAAAD6klEQVR4Xu2YS6hOURTHl1DkUR6Foq5XkiR5RQYGDAwYoJChAQMzRcYyUAbSVRLJVDKRmSQGBsYiMSAykESXQh77Z+/1nfUt+3zXPdfNuexfrb6919rfOfuc/9nrrLNFCoVCofCfsyTY02DrfKDw77I72Ntgh4N9DzapO9warge77J2BicE+Spw7trc73OGaVGMuupiyUKoxX4PN7Q53uCfVuJMuluN5sAGp/vMi2N0U45e+xj6n8SOuAyc7E+x9areRZRLn5oWfHOxDsDHGdyfYedMHHmzro43PslbiOcanPr/0V3ZGRHggjpj+zWAPTb8O5srxmG+OZxLjc3xgJJgm8WQbfaBlfJG88DeCrXE+HgL7AG9xfdAx640PQVkAlkvBPpn+Qfn1WCrofOf3tEr4rRJPNsUHWsSVYH2SF56bddX5vPAPXF/Bdzu1Z6b+tk40siP5EQ3eSF44xvCQ9KIVwi8PtktiWuRktDFNc21hkVQ3NCd8f/K/CzY2+UjjNq0TrxOe2gB0AfBr4UHAr1mFNq9ED37e071oIvxSqbTx1ogNEv/MDWMiwzrYCEL6VXLCA2NUXIQ82x2uvdn2gTia2quq8E9U+H2pTxuBPPh5HfVChWecFxGj5vDCc71c3+LU17rjdWdEQziIT5VDhdSqq+x3ra5atjCOFa/UCU9V/00qIblRNnP9CeGJQy/h9Vh1NBGeGmaB6euYccY3ZPhc4CC8x9oGDwafb5ac8KuTnzQ/NbXVeCCBdpuEz80Fcqn+tmmflhjn62NYcJEcaJYPtIBc2mSuXnh885yPVI//QOrTrjueiqUC+68b9WvRR/tVFe7QS1ClifBKn8SYrV0ac0KqCx8OTVK9TV852MCwphscn1Of4pQbVDd/xutDov/14GO3EsgwVmBFq3pdHNQQOeEYw/d8L5oKz/3Fb/cd7pv2kHkgVVXrORXsnMRdpd95H480etPsitc9iBzMWwuyQ5Ifh0+zgvb9d/yF5Ff6XR/0lbnZ+T1NhX+c/LZuoaZpDAejePDMlOrdwkk3dSJ/D/YZcvNlxfqVNlu6xdEVw0aOwja1F/C4dH9FADeYrWxFq2p2EpVj8uv/cug11C22lxLjdqHphtF249uffI2gKvQHVGZIjGH2ov8WzENTvKZtW4Q9ST7iemP1m16ZnmKkSIx2bi+czSJivI749RkA+iTGbgV7JHFug+1/2GvQeWqRqCtdYwOprxkiZ3VZY1DYGOAAE3xAYgplleyR+htUGGUgJNuOFHa5naYVEscodp+6MErR1EH6RtC6oo3qkZRDyuTbuPAPsFPie6kIWigUCoVCoVAojDZ+AH9ecUWil9dmAAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,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>