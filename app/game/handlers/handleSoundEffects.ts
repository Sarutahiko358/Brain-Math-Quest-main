/**
 * Handle Sound Effects
 *
 * Pure handler for playing sound effects with volume control.
 * Uses Web Audio API for better control and performance.
 */

import { Settings } from '../../lib/settings';

/**
 * Sound effect types
 */
export type SoundEffect =
  | 'attack'      // 攻撃音
  | 'combo'       // コンボ音
  | 'hit'         // ヒット音
  | 'damage'      // ダメージ音
  | 'heal'        // 回復音
  | 'victory';    // 勝利音

/**
 * Audio context singleton for managing sound effects
 */
class SoundEffectManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<SoundEffect, AudioBuffer> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  /**
   * Initialize audio context
   */
  private initAudioContext(): void {
    if (this.audioContext) return;

    try {
      const AudioContextClass = typeof window !== 'undefined'
        ? (window.AudioContext || (window as any).webkitAudioContext)
        : null;

      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Generate simple beep sound using oscillator
   * This is a fallback when audio files are not available
   */
  private async generateBeep(frequency: number, duration: number): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate sine wave with envelope
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8); // Exponential decay
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }

    return buffer;
  }

  /**
   * Get or generate sound buffer for a specific effect
   */
  private async getSoundBuffer(effect: SoundEffect): Promise<AudioBuffer | null> {
    // Check if already loaded
    if (this.soundBuffers.has(effect)) {
      return this.soundBuffers.get(effect) || null;
    }

    // Generate appropriate sound for each effect type
    let buffer: AudioBuffer | null = null;

    switch (effect) {
      case 'attack':
        buffer = await this.generateBeep(440, 0.1); // A4 note, 100ms
        break;
      case 'combo':
        buffer = await this.generateBeep(880, 0.15); // A5 note, 150ms
        break;
      case 'hit':
        buffer = await this.generateBeep(330, 0.08); // E4 note, 80ms
        break;
      case 'damage':
        buffer = await this.generateBeep(220, 0.2); // A3 note, 200ms
        break;
      case 'heal':
        buffer = await this.generateBeep(660, 0.25); // E5 note, 250ms
        break;
      case 'victory':
        buffer = await this.generateBeep(1047, 0.3); // C6 note, 300ms
        break;
    }

    if (buffer) {
      this.soundBuffers.set(effect, buffer);
    }

    return buffer;
  }

  /**
   * Play a sound effect
   */
  async play(effect: SoundEffect): Promise<void> {
    if (!this.enabled) return;

    try {
      this.initAudioContext();

      if (!this.audioContext) return;

      const buffer = await this.getSoundBuffer(effect);
      if (!buffer) return;

      // Create audio nodes
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      // Configure nodes
      source.buffer = buffer;
      gainNode.gain.value = this.volume;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play sound
      source.start(0);
    } catch (error) {
      console.warn('Failed to play sound effect:', error);
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings: Settings['soundEffects']): void {
    this.enabled = settings.enabled;
    this.volume = settings.volume;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.soundBuffers.clear();
  }
}

// Singleton instance
const soundEffectManager = new SoundEffectManager();

/**
 * Play a sound effect
 *
 * @param effect - Type of sound effect to play
 * @param settings - Sound effect settings from game settings
 */
export function playSoundEffect(
  effect: SoundEffect,
  settings: Settings['soundEffects']
): void {
  soundEffectManager.updateSettings(settings);
  soundEffectManager.play(effect);
}

/**
 * Update sound effect settings
 *
 * @param settings - New sound effect settings
 */
export function updateSoundSettings(settings: Settings['soundEffects']): void {
  soundEffectManager.updateSettings(settings);
}

/**
 * Clean up sound effect resources
 */
export function cleanupSoundEffects(): void {
  soundEffectManager.cleanup();
}
