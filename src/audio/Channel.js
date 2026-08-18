/**
 * Channel: Represents 1 of the 16 parallel audio tracks/synthesizer channels.
 * Zero-allocation processing, active voice sleep management, and anti-denormal protection.
 */
import { createSynth, SYNTH_TYPES } from './SynthFactory.js';
import { ZDFFilter, antiDenormal } from './DSPUtils.js';

export class Channel {
  constructor(id, synthTypeId = 'subtractive', sampleRate = 44100) {
    this.id = id;
    this.name = `Ch ${id + 1}`;
    this.sampleRate = sampleRate;

    // Active Synthesis Engine
    this.synthTypeId = synthTypeId;
    this.maxVoices = 4; // Polyphony per channel
    this.voices = [];
    this.activeVoices = new Map();

    this.initVoices();

    // Mixer Parameters
    this.volume = 0.8;
    this.pan = 0.0;
    this.mute = false;
    this.solo = false;
    this.reverbSend = 0.2;
    this.delaySend = 0.15;

    // Channel Insert Filter
    this.filter = new ZDFFilter();
    this.filter.setSampleRate(sampleRate);
    this.filterCutoff = 20000;
    this.filterRes = 0.707;

    // Zero-allocation reusable output fields
    this.outL = 0.0;
    this.outR = 0.0;
    this.outRevL = 0.0;
    this.outRevR = 0.0;
    this.outDelL = 0.0;
    this.outDelR = 0.0;

    // Telemetry Buffer for Visualizer
    this.telemetryBufferSize = 128;
    this.waveformBuffer = new Float32Array(this.telemetryBufferSize);
    this.telemetryWriteIdx = 0;
    this.peakLevel = 0.0;
  }

  initVoices() {
    this.voices = [];
    for (let i = 0; i < this.maxVoices; i++) {
      this.voices.push({
        synth: createSynth(this.synthTypeId, this.sampleRate),
        note: null,
        age: 0
      });
    }
  }

  setSynthType(typeId) {
    this.synthTypeId = typeId;
    this.initVoices();
  }

  setSampleRate(sr) {
    this.sampleRate = sr;
    this.filter.setSampleRate(sr);
    this.voices.forEach(v => v.synth.setSampleRate(sr));
  }

  getSynthMeta() {
    return SYNTH_TYPES.find(t => t.id === this.synthTypeId) || SYNTH_TYPES[0];
  }

  noteOn(midiNote, freq, velocity = 1.0) {
    let voiceIdx = this.voices.findIndex(v => !v.synth.active && (!v.synth.ampEnv || !v.synth.ampEnv.isActive()));
    if (voiceIdx === -1) {
      let oldestAge = -1;
      let oldestIdx = 0;
      for (let i = 0; i < this.voices.length; i++) {
        if (this.voices[i].age > oldestAge) {
          oldestAge = this.voices[i].age;
          oldestIdx = i;
        }
      }
      voiceIdx = oldestIdx;
    }

    const voice = this.voices[voiceIdx];
    voice.note = midiNote;
    voice.age = Date.now();
    voice.synth.noteOn(freq, velocity);
    this.activeVoices.set(midiNote, voiceIdx);
  }

  noteOff(midiNote) {
    if (this.activeVoices.has(midiNote)) {
      const voiceIdx = this.activeVoices.get(midiNote);
      if (this.voices[voiceIdx] && this.voices[voiceIdx].note === midiNote) {
        this.voices[voiceIdx].synth.noteOff();
      }
      this.activeVoices.delete(midiNote);
    }
  }

  allNotesOff() {
    this.voices.forEach(v => {
      v.synth.noteOff();
      v.note = null;
    });
    this.activeVoices.clear();
  }

  /**
   * Fast In-Place Sample Processing (Zero-Allocation)
   */
  process() {
    if (this.mute) {
      this.outL = 0.0;
      this.outR = 0.0;
      this.outRevL = 0.0;
      this.outRevR = 0.0;
      this.outDelL = 0.0;
      this.outDelR = 0.0;
      return;
    }

    let channelSum = 0.0;
    let anyActive = false;

    for (let i = 0; i < this.maxVoices; i++) {
      const synth = this.voices[i].synth;
      if (synth.active || (synth.ampEnv && synth.ampEnv.isActive())) {
        anyActive = true;
        channelSum += synth.process();
      }
    }

    if (!anyActive && Math.abs(channelSum) < 1e-6) {
      this.outL = 0.0;
      this.outR = 0.0;
      this.outRevL = 0.0;
      this.outRevR = 0.0;
      this.outDelL = 0.0;
      this.outDelR = 0.0;
      this.peakLevel *= 0.995;
      return;
    }

    // Insert Filter
    if (this.filterCutoff < 19000) {
      this.filter.setParameters(this.filterCutoff, this.filterRes);
      channelSum = this.filter.process(channelSum).lp;
    }

    channelSum = antiDenormal(channelSum);

    // Telemetry Buffer update
    this.waveformBuffer[this.telemetryWriteIdx] = channelSum;
    this.telemetryWriteIdx = (this.telemetryWriteIdx + 1) & (this.telemetryBufferSize - 1);

    const absVal = Math.abs(channelSum);
    if (absVal > this.peakLevel) {
      this.peakLevel = absVal;
    } else {
      this.peakLevel *= 0.9992;
    }

    // Panning & Gain
    const panAngle = (this.pan + 1.0) * 0.785398163; // (PI / 4)
    const gainL = Math.cos(panAngle) * this.volume;
    const gainR = Math.sin(panAngle) * this.volume;

    const outL = channelSum * gainL;
    const outR = channelSum * gainR;

    this.outL = outL;
    this.outR = outR;
    this.outRevL = outL * this.reverbSend;
    this.outRevR = outR * this.reverbSend;
    this.outDelL = outL * this.delaySend;
    this.outDelR = outR * this.delaySend;
  }

  getTelemetry() {
    const activeVoice = this.voices.find(v => v.synth.active) || this.voices[0];
    const synthMath = activeVoice.synth.getMathTelemetry ? activeVoice.synth.getMathTelemetry() : {};

    return {
      channelId: this.id,
      name: this.name,
      synthType: this.synthTypeId,
      meta: this.getSynthMeta(),
      peak: this.peakLevel,
      volume: this.volume,
      pan: this.pan,
      mute: this.mute,
      solo: this.solo,
      math: synthMath,
      recentWave: Array.from(this.waveformBuffer)
    };
  }
}
