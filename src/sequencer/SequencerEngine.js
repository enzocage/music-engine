/**
 * SequencerEngine: 16-Track Polyphonic Step Sequencer & Composition Engine.
 * Manages clock, step advancement, Euclidean pattern generators, and note triggering.
 */
import { EuclideanGenerator, FormulaTracker } from './EuclideanGenerator.js';
import { PRESETS } from './Presets.js';

export class SequencerEngine {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.numTracks = 16;
    this.numSteps = 16; // 16 steps per bar

    this.bpm = 120;
    this.isPlaying = false;
    this.currentStep = 0;
    this.swing = 0.0; // 0.0 to 0.75

    this.timerId = null;
    this.stepDurationMs = 0;
    this.activePresetId = 'cybernetic_symphony';

    // 16 Tracks data
    this.tracks = [];
    this.initTracks();
    this.loadPreset('cybernetic_symphony');
  }

  initTracks() {
    this.tracks = [];
    for (let i = 0; i < this.numTracks; i++) {
      this.tracks.push({
        id: i,
        name: `Track ${i + 1}`,
        steps: new Array(this.numSteps).fill(null), // null or MIDI note number
        velocities: new Array(this.numSteps).fill(0.8),
        mute: false,
        solo: false,
        euclidean: { k: 4, n: 16, rot: 0, active: false }
      });
    }
  }

  loadPreset(presetId) {
    const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    this.activePresetId = preset.id;
    this.bpm = preset.bpm;

    preset.tracks.forEach((t, i) => {
      if (this.tracks[i]) {
        // Set synth type on channel
        this.audioEngine.channels[i].setSynthType(t.synth);
        this.audioEngine.channels[i].volume = t.vol;
        this.audioEngine.channels[i].pan = t.pan;

        // Populate steps
        this.tracks[i].steps = [...t.pattern];
        this.tracks[i].velocities = this.tracks[i].steps.map(s => s ? 0.8 : 0.0);
      }
    });

    if (this.isPlaying) {
      this.restartClock();
    }
  }

  setBpm(newBpm) {
    this.bpm = Math.max(40, Math.min(300, newBpm));
    if (this.isPlaying) {
      this.restartClock();
    }
  }

  setStepNote(trackIdx, stepIdx, midiNote, velocity = 0.8) {
    if (this.tracks[trackIdx] && stepIdx >= 0 && stepIdx < this.numSteps) {
      this.tracks[trackIdx].steps[stepIdx] = midiNote;
      this.tracks[trackIdx].velocities[stepIdx] = velocity;
    }
  }

  clearStep(trackIdx, stepIdx) {
    if (this.tracks[trackIdx] && stepIdx >= 0 && stepIdx < this.numSteps) {
      this.tracks[trackIdx].steps[stepIdx] = null;
    }
  }

  applyEuclidean(trackIdx, k, n, rot = 0, rootNote = 60) {
    const pattern = EuclideanGenerator.generate(k, n, rot);
    const track = this.tracks[trackIdx];
    if (!track) return;

    for (let i = 0; i < this.numSteps; i++) {
      if (pattern[i % n]) {
        track.steps[i] = rootNote;
        track.velocities[i] = 0.8;
      } else {
        track.steps[i] = null;
      }
    }
    track.euclidean = { k, n, rot, active: true };
  }

  applyFormula(trackIdx, formulaType, rootNote = 48, scaleIntervals = [0, 2, 3, 5, 7, 8, 10]) {
    const seq = FormulaTracker.generateSequence(formulaType, this.numSteps, rootNote, scaleIntervals);
    const track = this.tracks[trackIdx];
    if (!track) return;

    seq.forEach((item, i) => {
      track.steps[i] = item.note;
      track.velocities[i] = item.velocity;
    });
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextStep();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.audioEngine.allNotesOff();
    this.currentStep = 0;
  }

  pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.audioEngine.allNotesOff();
  }

  restartClock() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.scheduleNextStep();
  }

  scheduleNextStep() {
    if (!this.isPlaying) return;

    // 16th note duration = (60 / BPM) / 4 seconds = (15000 / BPM) ms
    const baseDuration = (15000 / this.bpm);
    
    // Apply swing on odd 16th notes
    let duration = baseDuration;
    if (this.currentStep % 2 === 1 && this.swing > 0.01) {
      duration += baseDuration * this.swing * 0.5;
    } else if (this.currentStep % 2 === 0 && this.swing > 0.01) {
      duration -= baseDuration * this.swing * 0.5;
    }

    this.timerId = setTimeout(() => {
      this.triggerStep(this.currentStep);
      this.currentStep = (this.currentStep + 1) % this.numSteps;
      this.scheduleNextStep();
    }, Math.max(10, duration));
  }

  triggerStep(stepIdx) {
    for (let i = 0; i < this.numTracks; i++) {
      const track = this.tracks[i];
      if (track.mute) continue;

      const note = track.steps[stepIdx];
      if (note !== null && note !== undefined) {
        const vel = track.velocities[stepIdx] || 0.8;
        // Trigger Note On on the channel
        this.audioEngine.noteOn(i, note, vel);
      }
    }
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      bpm: this.bpm,
      swing: this.swing,
      activePresetId: this.activePresetId,
      tracks: this.tracks.map((t, idx) => ({
        id: t.id,
        name: t.name,
        steps: [...t.steps],
        synthType: this.audioEngine.channels[idx].synthTypeId,
        volume: this.audioEngine.channels[idx].volume,
        pan: this.audioEngine.channels[idx].pan,
        mute: this.audioEngine.channels[idx].mute,
        solo: this.audioEngine.channels[idx].solo
      }))
    };
  }
}
