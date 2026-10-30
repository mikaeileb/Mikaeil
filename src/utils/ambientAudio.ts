/**
 * Ambient Focus Sound Synthesizer for Atomic Habits Daily Planner
 * Uses Web Audio API for 100% offline, zero-dependency, rich nature and ambient focus sounds.
 */

import { AmbientSoundType } from '../types/index.ts';
import { clampVolume } from './ambientSounds.ts';

export type AmbientAudioListener = (state: {
  isPlaying: boolean;
  activeSound: AmbientSoundType | null;
  volume: number;
  activeTaskId?: string | null;
  activeTaskTitle?: string | null;
}) => void;

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSound: AmbientSoundType | null = null;
  private isCurrentlyPlaying = false;
  private currentVolume = 0.65;
  private activeTaskId: string | null = null;
  private activeTaskTitle: string | null = null;

  // Active audio node graph references for cleanup
  private currentSourceNodes: (AudioNode | number)[] = [];
  private activeIntervals: number[] = [];
  private listeners: Set<AmbientAudioListener> = new Set();

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private initMasterGain(ctx: AudioContext): GainNode {
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  /**
   * Generates a 5-second buffer of Pink Noise (1/f)
   */
  private createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Generates a 5-second buffer of Brown Noise (1/f^2)
   */
  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost
    }
    return buffer;
  }

  /**
   * Cleans up all currently playing nodes, timers and oscillators
   */
  private cleanupCurrentNodes() {
    this.activeIntervals.forEach((id) => window.clearInterval(id));
    this.activeIntervals = [];

    this.currentSourceNodes.forEach((node) => {
      try {
        if (typeof node === 'object' && node !== null) {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          if ('disconnect' in node && typeof node.disconnect === 'function') {
            node.disconnect();
          }
        }
      } catch {
        // ignore
      }
    });
    this.currentSourceNodes = [];
  }

  // --- Sound Synthesizers ---

  /**
   * 1. Rain Synthesizer: Continuous pink noise filtered with soft lowpass + rain drops
   */
  private buildRainGraph(ctx: AudioContext, destination: GainNode) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    // Lowpass filter for ambient body of rain
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(850, ctx.currentTime);

    // Subtle highpass to eliminate mud
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(250, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.75, ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(rainGain);
    rainGain.connect(destination);

    noiseSource.start();
    this.currentSourceNodes.push(noiseSource, lowpass, highpass, rainGain);

    // Occasional gentle raindrop clicks on window
    const dropletInterval = window.setInterval(() => {
      if (!this.isCurrentlyPlaying || !this.ctx) return;
      try {
        const dropOsc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        const freq = 1200 + Math.random() * 1600;

        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(freq, now);
        dropOsc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.04);

        dropGain.gain.setValueAtTime(0.04 + Math.random() * 0.05, now);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        dropOsc.connect(dropGain);
        dropGain.connect(destination);
        dropOsc.start(now);
        dropOsc.stop(now + 0.05);
      } catch {
        // ignore
      }
    }, 450);

    this.activeIntervals.push(dropletInterval);
  }

  /**
   * 2. Cafe Murmur & Coffee Cup Clinks Synthesizer
   */
  private buildCafeGraph(ctx: AudioContext, destination: GainNode) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    // Bandpass mimicking human speech chatter spectrum (300Hz - 900Hz)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(500, ctx.currentTime);
    bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

    // LFO to slowly modulate chatter volume
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.2, ctx.currentTime);

    const cafeGain = ctx.createGain();
    cafeGain.gain.setValueAtTime(0.7, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(cafeGain.gain);

    noiseSource.connect(bandpass);
    bandpass.connect(cafeGain);
    cafeGain.connect(destination);

    noiseSource.start();
    lfo.start();
    this.currentSourceNodes.push(noiseSource, bandpass, cafeGain, lfo, lfoGain);

    // Periodic ceramic coffee cup & spoon clinks
    const clinkInterval = window.setInterval(() => {
      if (!this.isCurrentlyPlaying || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const clinkGain = this.ctx.createGain();

        const baseF = 2200 + Math.random() * 600;
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseF, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseF * 1.5, now);

        clinkGain.gain.setValueAtTime(0.04, now);
        clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc1.connect(clinkGain);
        osc2.connect(clinkGain);
        clinkGain.connect(destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
      } catch {
        // ignore
      }
    }, 4200);

    this.activeIntervals.push(clinkInterval);
  }

  /**
   * 3. Forest & Birds Synthesizer: Leaf breeze + procedural melodious bird chirps
   */
  private buildForestGraph(ctx: AudioContext, destination: GainNode) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    // Breeze through trees
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.45, ctx.currentTime);

    noiseSource.connect(bandpass);
    bandpass.connect(windGain);
    windGain.connect(destination);

    noiseSource.start();
    this.currentSourceNodes.push(noiseSource, bandpass, windGain);

    // Procedural bird chirps
    const birdInterval = window.setInterval(() => {
      if (!this.isCurrentlyPlaying || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const birdOsc = this.ctx.createOscillator();
        const birdGain = this.ctx.createGain();

        birdOsc.type = 'sine';
        const startF = 3000 + Math.random() * 800;
        birdOsc.frequency.setValueAtTime(startF, now);
        birdOsc.frequency.linearRampToValueAtTime(startF + 900, now + 0.08);
        birdOsc.frequency.linearRampToValueAtTime(startF + 300, now + 0.15);

        birdGain.gain.setValueAtTime(0.06, now);
        birdGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        birdOsc.connect(birdGain);
        birdGain.connect(destination);

        birdOsc.start(now);
        birdOsc.stop(now + 0.18);
      } catch {
        // ignore
      }
    }, 2800);

    this.activeIntervals.push(birdInterval);
  }

  /**
   * 4. Ocean Waves Synthesizer: Rhythmic swells and receding surf
   */
  private buildWavesGraph(ctx: AudioContext, destination: GainNode) {
    const brownBuffer = this.createBrownNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = brownBuffer;
    noiseSource.loop = true;

    // Dynamic lowpass filter swept by wave cycle
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(400, ctx.currentTime);
    lowpass.Q.setValueAtTime(2.5, ctx.currentTime);

    // Slow LFO for ocean wave periodicity (~7.5s cycle)
    const waveLfo = ctx.createOscillator();
    waveLfo.type = 'sine';
    waveLfo.frequency.setValueAtTime(0.13, ctx.currentTime);

    const waveLfoGain = ctx.createGain();
    waveLfoGain.gain.setValueAtTime(280, ctx.currentTime);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.8, ctx.currentTime);

    waveLfo.connect(waveLfoGain);
    waveLfoGain.connect(lowpass.frequency);

    noiseSource.connect(lowpass);
    lowpass.connect(waveGain);
    waveGain.connect(destination);

    noiseSource.start();
    waveLfo.start();
    this.currentSourceNodes.push(noiseSource, lowpass, waveGain, waveLfo, waveLfoGain);
  }

  /**
   * 5. Fireplace & Crackle Synthesizer: Warm low rumble + random crackle pops
   */
  private buildFireplaceGraph(ctx: AudioContext, destination: GainNode) {
    const brownBuffer = this.createBrownNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = brownBuffer;
    noiseSource.loop = true;

    // Warm deep rumble
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(220, ctx.currentTime);

    const fireGain = ctx.createGain();
    fireGain.gain.setValueAtTime(0.65, ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(fireGain);
    fireGain.connect(destination);

    noiseSource.start();
    this.currentSourceNodes.push(noiseSource, lowpass, fireGain);

    // Frequent random wood crackle pops
    const crackleInterval = window.setInterval(() => {
      if (!this.isCurrentlyPlaying || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // Mini burst of highpass noise
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();

        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(140 + Math.random() * 800, now);
        popOsc.frequency.exponentialRampToValueAtTime(60, now + 0.02);

        popGain.gain.setValueAtTime(0.08 + Math.random() * 0.12, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        popOsc.connect(popGain);
        popGain.connect(destination);

        popOsc.start(now);
        popOsc.stop(now + 0.03);
      } catch {
        // ignore
      }
    }, 180);

    this.activeIntervals.push(crackleInterval);
  }

  /**
   * 6. Brown Noise Synthesizer (Scientific Deep Focus)
   */
  private buildBrownNoiseGraph(ctx: AudioContext, destination: GainNode) {
    const brownBuffer = this.createBrownNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = brownBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(450, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(destination);

    noiseSource.start();
    this.currentSourceNodes.push(noiseSource, lowpass, noiseGain);
  }

  // --- Public Control APIs ---

  /**
   * Play an ambient sound with optional task binding
   */
  play(
    type: AmbientSoundType,
    volume?: number,
    taskId?: string | null,
    taskTitle?: string | null
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    if (volume !== undefined) {
      this.currentVolume = clampVolume(volume);
    }
    if (taskId !== undefined) {
      this.activeTaskId = taskId;
    }
    if (taskTitle !== undefined) {
      this.activeTaskTitle = taskTitle;
    }

    this.cleanupCurrentNodes();
    const master = this.initMasterGain(ctx);
    master.gain.setValueAtTime(this.currentVolume, ctx.currentTime);

    switch (type) {
      case 'rain':
        this.buildRainGraph(ctx, master);
        break;
      case 'cafe':
        this.buildCafeGraph(ctx, master);
        break;
      case 'forest':
        this.buildForestGraph(ctx, master);
        break;
      case 'waves':
        this.buildWavesGraph(ctx, master);
        break;
      case 'fireplace':
        this.buildFireplaceGraph(ctx, master);
        break;
      case 'brown_noise':
        this.buildBrownNoiseGraph(ctx, master);
        break;
      default:
        this.buildRainGraph(ctx, master);
        break;
    }

    this.activeSound = type;
    this.isCurrentlyPlaying = true;
    this.notify();
  }

  /**
   * Toggle play/pause for a sound
   */
  toggle(type?: AmbientSoundType, volume?: number) {
    if (this.isCurrentlyPlaying) {
      // If same sound is playing, pause/stop it
      if (!type || type === this.activeSound) {
        this.stop();
        return;
      }
      // Switch sound directly
      this.play(type, volume);
    } else {
      this.play(type || this.activeSound || 'rain', volume);
    }
  }

  /**
   * Stop ambient playback
   */
  stop() {
    this.cleanupCurrentNodes();
    this.isCurrentlyPlaying = false;
    this.notify();
  }

  /**
   * Update master volume smoothly
   */
  setVolume(volume: number) {
    this.currentVolume = clampVolume(volume);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  /**
   * Bind an active task to focus playback
   */
  setActiveTask(taskId: string | null, taskTitle: string | null) {
    this.activeTaskId = taskId;
    this.activeTaskTitle = taskTitle;
    this.notify();
  }

  // --- Getters & Subscribers ---

  isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  getActiveSound(): AmbientSoundType | null {
    return this.activeSound;
  }

  getVolume(): number {
    return this.currentVolume;
  }

  getActiveTaskId(): string | null {
    return this.activeTaskId;
  }

  getActiveTaskTitle(): string | null {
    return this.activeTaskTitle;
  }

  subscribe(listener: AmbientAudioListener): () => void {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener({
      isPlaying: this.isCurrentlyPlaying,
      activeSound: this.activeSound,
      volume: this.currentVolume,
      activeTaskId: this.activeTaskId,
      activeTaskTitle: this.activeTaskTitle,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = {
      isPlaying: this.isCurrentlyPlaying,
      activeSound: this.activeSound,
      volume: this.currentVolume,
      activeTaskId: this.activeTaskId,
      activeTaskTitle: this.activeTaskTitle,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // ignore
      }
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
