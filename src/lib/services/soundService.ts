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
   * Plays a prize sound when ball lands in a bin.
   * Sound gets louder and more complex based on point value.
   *
   * @param binIndex - Index of the bin (0-based)
   * @param points - Point value of the bin
   */
  playBinLanding(binIndex: number, points: number) {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Calculate prize tier based on points
    // 0 = no prize, 100 = small, 500 = medium, 1000 = large, 10000 = jackpot
    let tier = 0;
    let baseVolume = 0.2;

    if (points === 0) {
      tier = 0;
      baseVolume = 0.15;
    } else if (points <= 100) {
      tier = 1;
      baseVolume = 0.25;
    } else if (points <= 500) {
      tier = 2;
      baseVolume = 0.35;
    } else if (points <= 1000) {
      tier = 3;
      baseVolume = 0.45;
    } else {
      tier = 4; // Jackpot!
      baseVolume = 0.6;
    }

    if (tier === 0) {
      // No prize - sad trombone effect
      this.playNoPrizeSound(now, baseVolume);
    } else if (tier === 4) {
      // Jackpot - special celebration
      this.playJackpotSound(now, baseVolume);
    } else {
      // Prize tiers 1-3 - escalating prize sounds
      this.playPrizeSound(now, tier, baseVolume);
    }
  }

  /**
   * Plays a "no prize" sound for 0-point bins.
   */
  private playNoPrizeSound(startTime: number, volume: number) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Descending "wah wah" effect
    oscillator.frequency.setValueAtTime(200, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, startTime + 0.3);

    gainNode.gain.setValueAtTime(this.masterVolume * volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

    oscillator.type = 'sawtooth';
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  }

  /**
   * Plays prize sound with intensity based on tier (1-3).
   */
  private playPrizeSound(startTime: number, tier: number, volume: number) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Base frequencies for prize chords (major triad)
    const chordFrequencies = [
      [261.63, 329.63, 392.00], // C major (tier 1)
      [293.66, 369.99, 440.00], // D major (tier 2)
      [329.63, 415.30, 493.88], // E major (tier 3)
    ];

    const frequencies = chordFrequencies[tier - 1];
    const noteCount = tier; // Play more notes for higher tiers

    frequencies.slice(0, noteCount).forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      const noteStart = startTime + index * 0.05;
      const noteDuration = 0.4 + tier * 0.1;

      oscillator.frequency.setValueAtTime(frequency, noteStart);

      // Add slight vibrato for richness
      oscillator.frequency.linearRampToValueAtTime(frequency * 1.02, noteStart + noteDuration / 2);
      oscillator.frequency.linearRampToValueAtTime(frequency, noteStart + noteDuration);

      const noteVolume = this.masterVolume * volume * (1 - index * 0.15);
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(noteVolume, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration);

      oscillator.type = 'sine';
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + noteDuration);
    });
  }

  /**
   * Plays jackpot celebration sound (10000 points).
   */
  private playJackpotSound(startTime: number, volume: number) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    // Ascending fanfare with multiple octaves
    const fanfareNotes = [
      261.63, // C4
      329.63, // E4
      392.00, // G4
      523.25, // C5
      659.25, // E5
      783.99, // G5
      1046.50 // C6
    ];

    fanfareNotes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      const noteStart = startTime + index * 0.07;
      const noteDuration = 0.5;

      oscillator.frequency.setValueAtTime(frequency, noteStart);

      const noteVolume = this.masterVolume * volume * (0.7 + index * 0.05);
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(noteVolume, noteStart + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration);

      oscillator.type = 'triangle';
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + noteDuration);
    });

    // Add sparkle effect for jackpot
    for (let i = 0; i < 5; i++) {
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();

      const sparkleStart = startTime + 0.1 + i * 0.08;
      const sparkleFreq = 1500 + Math.random() * 1000;

      sparkleOsc.frequency.setValueAtTime(sparkleFreq, sparkleStart);
      sparkleGain.gain.setValueAtTime(this.masterVolume * volume * 0.15, sparkleStart);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, sparkleStart + 0.15);

      sparkleOsc.type = 'sine';
      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkleOsc.start(sparkleStart);
      sparkleOsc.stop(sparkleStart + 0.15);
    }
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
