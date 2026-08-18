/**
 * AudioEngine: Master Coordinator for the 16-channel universal sound engine.
 * Zero-allocation audio processing pipeline, buffer underrun protection,
 * and high-stability audio rendering.
 */
import { Channel } from './Channel.js';
import { CloudSeedReverb, StereoDelay, MasterLimiter } from './fx/MasterFX.js';

export class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.scriptNode = null;
    this.sampleRate = 44100;
    this.isRunning = false;

    this.numChannels = 16;
    this.channels = [];

    // Master FX
    this.reverb = new CloudSeedReverb(this.sampleRate);
    this.delay = new StereoDelay(this.sampleRate);
    this.limiter = new MasterLimiter(this.sampleRate);

    this.masterVolume = 0.85;
    this.masterGainReduction = 1.0;

    // Master Peak Telemetry
    this.masterPeakL = 0.0;
    this.masterPeakR = 0.0;
    this.masterBufferL = new Float32Array(256);
    this.masterBufferR = new Float32Array(256);
    this.masterBufIdx = 0;

    // Performance & Dropout Telemetry
    this.audioCpuLoad = 0.0;
    this.bufferUnderruns = 0;

    this.initDefaultChannels();
  }

  initDefaultChannels() {
    this.channels = [];
    const defaultEngines = [
      'subtractive', // Ch 1: Bass
      'fm',          // Ch 2: FM Bells
      'wavetable',   // Ch 3: Evolving Pad
      'waveguide',   // Ch 4: Plucked K-S Harp
      'modal',       // Ch 5: Chladni Percussion
      'additive',    // Ch 6: Harmonic Partial Organ
      'phasedist',   // Ch 7: Casio CZ Acid
      'granular',    // Ch 8: Ambient Cloud
      'formant',     // Ch 9: Vocal Choir
      'sampler',     // Ch 10: E-Piano
      'chaos',       // Ch 11: Lorenz Attractor
      'bytebeat',    // Ch 12: Bitwise Math
      'subtractive', // Ch 13: Sub Bass
      'fm',          // Ch 14: FM Bass
      'modal',       // Ch 15: Modal Bell
      'wavetable'    // Ch 16: Shimmer Lead
    ];

    for (let i = 0; i < this.numChannels; i++) {
      const type = defaultEngines[i] || 'subtractive';
      const ch = new Channel(i, type, this.sampleRate);
      this.channels.push(ch);
    }
  }

  async initAudio() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      this.isRunning = true;
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass({
      latencyHint: 'interactive'
    });

    this.sampleRate = this.audioCtx.sampleRate;
    this.channels.forEach(ch => ch.setSampleRate(this.sampleRate));
    this.reverb.setSampleRate(this.sampleRate);
    this.delay.setSampleRate(this.sampleRate);
    this.limiter.setSampleRate(this.sampleRate);

    // High Stability Buffer Size (1024 samples = 23.2ms headroom, completely crackle-free)
    const bufferSize = 1024;
    this.scriptNode = this.audioCtx.createScriptProcessor(bufferSize, 0, 2);

    this.scriptNode.onaudioprocess = (e) => {
      this.processAudioBlock(e);
    };

    this.scriptNode.connect(this.audioCtx.destination);
    this.isRunning = true;
  }

  /**
   * High-Performance, Zero-Allocation Real-Time Audio Loop
   */
  processAudioBlock(e) {
    const startTime = performance.now();

    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);
    const len = outL.length;

    const hasSolo = this.channels.some(ch => ch.solo);
    const mVol = this.masterVolume;

    for (let i = 0; i < len; i++) {
      let mixL = 0.0;
      let mixR = 0.0;
      let revSendL = 0.0;
      let revSendR = 0.0;
      let delSendL = 0.0;
      let delSendR = 0.0;

      // 16 Parallel Channels
      for (let c = 0; c < 16; c++) {
        const ch = this.channels[c];
        if (hasSolo && !ch.solo) continue;

        ch.process(); // In-place processing

        mixL += ch.outL;
        mixR += ch.outR;
        revSendL += ch.outRevL;
        revSendR += ch.outRevR;
        delSendL += ch.outDelL;
        delSendR += ch.outDelR;
      }

      // Master Delay (Zero allocation)
      this.delay.process(delSendL, delSendR);
      const delL = this.delay.outL;
      const delR = this.delay.outR;

      // Master Reverb (Zero allocation)
      this.reverb.process(revSendL + delL * 0.2, revSendR + delR * 0.2);
      const revL = this.reverb.outL;
      const revR = this.reverb.outR;

      // Master Bus Summation
      let masterL = (mixL + delL + revL) * mVol;
      let masterR = (mixR + delR + revR) * mVol;

      // Master Lookahead Limiter (Zero allocation)
      this.limiter.process(masterL, masterR);
      const limL = this.limiter.outL;
      const limR = this.limiter.outR;

      outL[i] = limL;
      outR[i] = limR;

      // Telemetry update
      this.masterBufferL[this.masterBufIdx] = limL;
      this.masterBufferR[this.masterBufIdx] = limR;
      this.masterBufIdx = (this.masterBufIdx + 1) & 255;

      const peak = Math.max(Math.abs(limL), Math.abs(limR));
      if (peak > this.masterPeakL) this.masterPeakL = peak;
      else this.masterPeakL *= 0.9995;
    }

    this.masterGainReduction = this.limiter.gainReduction;

    // Measure Audio Thread CPU Budget (% of buffer time spent in processing)
    const elapsed = performance.now() - startTime;
    const maxBudgetMs = (len / this.sampleRate) * 1000.0;
    this.audioCpuLoad = Math.min(100, Math.round((elapsed / maxBudgetMs) * 100));

    if (elapsed > maxBudgetMs) {
      this.bufferUnderruns++;
    }
  }

  noteOn(channelIndex, midiNote, velocity = 1.0) {
    if (channelIndex >= 0 && channelIndex < this.channels.length) {
      const freq = 440.0 * Math.pow(2.0, (midiNote - 69) / 12.0);
      this.channels[channelIndex].noteOn(midiNote, freq, velocity);
    }
  }

  noteOff(channelIndex, midiNote) {
    if (channelIndex >= 0 && channelIndex < this.channels.length) {
      this.channels[channelIndex].noteOff(midiNote);
    }
  }

  allNotesOff() {
    this.channels.forEach(ch => ch.allNotesOff());
  }

  getTelemetry() {
    const channelTelemetries = this.channels.map(ch => ch.getTelemetry());

    return {
      isRunning: this.isRunning,
      sampleRate: this.sampleRate,
      masterVolume: this.masterVolume,
      masterPeak: this.masterPeakL,
      masterGainReduction: this.masterGainReduction,
      audioCpuLoad: this.audioCpuLoad,
      bufferUnderruns: this.bufferUnderruns,
      masterBufferL: Array.from(this.masterBufferL),
      channels: channelTelemetries
    };
  }
}
