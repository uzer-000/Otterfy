/**
 * Otterfy Real-time Sale Audio Synthesizer
 * Uses Web Audio API to produce a crisp, high-end "ka-ching / chime" sound
 * without requiring any external MP3 download or network requests.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays the official Otterfy Sale Ping Chime
 */
export function playSalePingSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master volume gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(ctx.destination);

    // Tone 1: Crisp high bell introductory ding (B5 - 987.77 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    // Slight pitch drop for bell feel
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.22);

    // Tone 2: Triumphant resonance chime (E6 - 1318.51 Hz) starting at +90ms
    const startTime2 = now + 0.09;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, startTime2);
    osc2.frequency.exponentialRampToValueAtTime(1325, startTime2 + 0.6);

    gain2.gain.setValueAtTime(0.85, startTime2);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime2 + 0.75);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc2.start(startTime2);
    osc2.stop(startTime2 + 0.8);

    // Tone 3: Shimmer harmonic sparkle (E7 - 2637 Hz) for luxury metallic finish
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2637.02, startTime2);

    gain3.gain.setValueAtTime(0.25, startTime2);
    gain3.gain.exponentialRampToValueAtTime(0.001, startTime2 + 0.5);

    osc3.connect(gain3);
    gain3.connect(masterGain);

    osc3.start(startTime2);
    osc3.stop(startTime2 + 0.55);
  } catch (err) {
    console.warn('[SalePing] Audio error:', err);
  }
}
