/**
 * Hogwarts School of Witchcraft and Wizardry - Procedural Audio Synthesizer
 * Uses Web Audio API to synthesize beautiful magical sound effects
 */

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

/**
 * Checks if sound is muted in localStorage
 */
export const isMuted = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('soundMuted') === 'true';
};

/**
 * Play an enchanting, sparkly wand-casting spell sound effect!
 * Synthesizes a fast "woosh" frequency sweep followed by a high-pitched starry crystal chime arpeggio.
 */
export const playCastSpellSound = () => {
  if (isMuted()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Wave 1: The magical sweep of the wand ("Woosh")
    const oscWoosh = ctx.createOscillator();
    const gainWoosh = ctx.createGain();
    
    oscWoosh.type = 'sine';
    oscWoosh.frequency.setValueAtTime(180, now);
    oscWoosh.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
    
    gainWoosh.gain.setValueAtTime(0.001, now);
    gainWoosh.gain.linearRampToValueAtTime(0.04, now + 0.08);
    gainWoosh.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    
    oscWoosh.connect(gainWoosh);
    gainWoosh.connect(ctx.destination);
    
    oscWoosh.start(now);
    oscWoosh.stop(now + 0.3);
    
    // Wave 2: Sparkling Arpeggio of Pixie Dust/Golden Runes (Chimes)
    // E-major pentatonic arpeggio for warm bright magical chime
    const scale = [
      659.25,   // E5 (Chime 1 - Root)
      830.61,   // G#5 (Chime 2 - Major Third)
      987.77,   // B5 (Chime 3 - Perfect Fifth)
      1318.51,  // E6 (Chime 4 - Octave)
      1661.22,  // G#6 (Chime 5 - Starburst Spark)
    ];
    
    scale.forEach((freq, index) => {
      const oscChime = ctx.createOscillator();
      const gainChime = ctx.createGain();
      
      // Pure sine/triangle blend for glass bell texture
      oscChime.type = index % 2 === 0 ? 'sine' : 'triangle';
      
      const startTime = now + 0.12 + (index * 0.08); // Stagger files
      const duration = 0.5;
      
      oscChime.frequency.setValueAtTime(freq, startTime);
      
      gainChime.gain.setValueAtTime(0.001, startTime);
      gainChime.gain.linearRampToValueAtTime(0.035, startTime + 0.03);
      gainChime.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
      
      // Connect to destination
      oscChime.connect(gainChime);
      gainChime.connect(ctx.destination);
      
      oscChime.start(startTime);
      oscChime.stop(startTime + duration + 0.05);
    });
    
  } catch (error) {
    console.warn("Failed to generate magical audio cast:", error);
  }
};

/**
 * Play a deep resonance bell when opening secrets or gaining special achievements
 */
export const playAncientBellSound = () => {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const notes = [220.00, 329.63, 440.00]; // Classical castle bell frequencies
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.2 + (idx * 0.2));
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 1.5 + (idx * 0.2));
    });
  } catch (e) {}
};

/**
 * Play standard landing sound effects
 */
export const playLandingSound = (type: 'chime' | 'tick' | 'success') => {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    if (type === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.setValueAtTime(600, now + 0.02);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      // Warm E-major chord
      [329.63, 415.30, 493.88, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.03, now + idx * 0.05 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + 0.7);
      });
    }
  } catch (e) {}
};
