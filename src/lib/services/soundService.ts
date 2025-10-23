/**
 * Sound service for Plinko game using Web Audio API.
 * Provides synthesized sound effects without requiring audio files.
 */
class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private masterVolume = 0.3;

  /**
   * Initializes the audio context.
   * Must be called after user interaction (browser autoplay policy).
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Plays a bounce sound when ball hits a pin.
   * Uses a short blip with varying pitch for variety.
   *
   * @param velocity - Collision velocity (0-10) to vary volume/pitch
   */
  playBounce(velocity = 5) {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create oscillator for the "ping" sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Vary frequency based on velocity for more dynamic sound
    const baseFrequency = 200;
    const frequencyVariation = velocity * 50;
    oscillator.frequency.setValueAtTime(baseFrequency + frequencyVariation, now);

    // Quick pitch drop for bounce effect
    oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 0.5, now + 0.05);

    // Volume envelope - quick attack and decay
    const volume = Math.min(velocity / 15, 1) * this.masterVolume * 0.15;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.type = 'sine';
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  /**
   * Plays a sound when ball lands in a bin.
   *
   * @param binIndex - Index of the bin (0-based)
   * @param isHighValue - Whether this is a high-value bin
   */
  playBinLanding(binIndex: number, isHighValue = false) {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (isHighValue) {
      // High value bins get a special celebratory sound
      this.playWinCelebration();
    } else {
      // Regular bin landing - lower pitched thud
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.frequency.setValueAtTime(80, now);
      oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.15);

      gainNode.gain.setValueAtTime(this.masterVolume * 0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      oscillator.type = 'sine';
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.15);
    }
  }

  /**
   * Plays a celebration sound for high-value wins.
   * Creates an ascending arpeggio.
   */
  private playWinCelebration() {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Play a quick ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord

    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      const startTime = now + index * 0.08;
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.type = 'sine';
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  /**
   * Enables or disables all sound effects.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Sets the master volume (0.0 to 1.0).
   */
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Gets current enabled state.
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const soundService = new SoundService();
