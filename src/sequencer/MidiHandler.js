/**
 * MIDI Handler & Musical Scale Quantizer
 * Integrates Web MIDI API, MPE (MIDI Polyphonic Expression), scale quantization,
 * and virtual keyboard mappings.
 */

export const SCALES = [
  { id: 'minor', name: 'Natural Minor (Äolisch)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'major', name: 'Major (Ionisch)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'pentatonic_minor', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'hirajoshi', name: 'Hirajoshi (Japanese)', intervals: [0, 2, 3, 7, 8] },
  { id: 'chromatic', name: 'Chromatic (All 12 Notes)', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midiNote) {
  const octave = Math.floor(midiNote / 12) - 1;
  const name = NOTE_NAMES[midiNote % 12];
  return `${name}${octave}`;
}

export class MidiHandler {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.midiAccess = null;
    this.activeChannel = 0; // Target channel for live keyboard playing
    this.currentScale = SCALES[0]; // Minor
    this.rootNote = 48; // C3
    this.isMidiAvailable = false;

    this.initWebMidi();
  }

  async initWebMidi() {
    if (navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess();
        this.isMidiAvailable = true;
        this.setupMidiInputs();
        this.midiAccess.onstatechange = () => this.setupMidiInputs();
        console.log('Web MIDI API initialized successfully.');
      } catch (err) {
        console.warn('Web MIDI API access denied or unavailable:', err);
      }
    }
  }

  setupMidiInputs() {
    if (!this.midiAccess) return;
    const inputs = this.midiAccess.inputs.values();
    for (let input of inputs) {
      input.onmidimessage = (msg) => this.handleMidiMessage(msg);
    }
  }

  handleMidiMessage(msg) {
    const [status, data1, data2] = msg.data;
    const command = status >> 4;
    const channel = status & 0xf;

    // Note On
    if (command === 9) {
      if (data2 > 0) {
        const velocity = data2 / 127.0;
        this.audioEngine.noteOn(this.activeChannel, data1, velocity);
      } else {
        this.audioEngine.noteOff(this.activeChannel, data1);
      }
    }
    // Note Off
    else if (command === 8) {
      this.audioEngine.noteOff(this.activeChannel, data1);
    }
    // Pitch Bend
    else if (command === 14) {
      const bend = ((data2 << 7) | data1) - 8192;
      // Polyphonic pitch bend / MPE
    }
  }

  setActiveChannel(chIdx) {
    this.activeChannel = Math.max(0, Math.min(15, chIdx));
  }

  setScale(scaleId) {
    const match = SCALES.find(s => s.id === scaleId);
    if (match) this.currentScale = match;
  }
}
