/**
 * Handle Sound Effects
 * Use Web Audio API for sound generation
 */

class SoundEffectManager {
    constructor() {
        this.audioContext = null;
        this.soundBuffers = new Map();
        this.enabled = true;
        this.volume = 0.5;
    }

    /**
     * Initialize audio context
     */
    initAudioContext() {
        if (this.audioContext) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;

            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }
        } catch (error) {
            console.warn('Failed to initialize AudioContext:', error);
        }
    }

    /**
     * Generate simple beep sound using oscillator
     */
    generateBeep(frequency, duration) {
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
    async getSoundBuffer(effect) {
        // Check if already loaded
        if (this.soundBuffers.has(effect)) {
            return this.soundBuffers.get(effect) || null;
        }

        // Generate appropriate sound for each effect type
        let buffer = null;

        switch (effect) {
            case 'attack':
                buffer = this.generateBeep(440, 0.1); // A4 note, 100ms
                break;
            case 'combo':
                buffer = this.generateBeep(880, 0.15); // A5 note, 150ms
                break;
            case 'hit':
                buffer = this.generateBeep(330, 0.08); // E4 note, 80ms
                break;
            case 'damage':
                buffer = this.generateBeep(220, 0.2); // A3 note, 200ms
                break;
            case 'heal':
                buffer = this.generateBeep(660, 0.25); // E5 note, 250ms
                break;
            case 'victory':
                buffer = this.generateBeep(1047, 0.3); // C6 note, 300ms
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
    async play(effect) {
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
    updateSettings(settings) {
        if (!settings) return;
        this.enabled = settings.enabled;
        this.volume = settings.volume;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.audioContext = null;
        this.soundBuffers.clear();
    }
}

// Singleton instance
export const soundManager = new SoundEffectManager();

export function playSound(effect, settings) {
    if (settings) {
        soundManager.updateSettings(settings);
    }
    soundManager.play(effect);
}
