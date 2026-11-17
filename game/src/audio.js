// NEON BASTION — sound, synthesized live with WebAudio. No audio files, no network:
// every effect is a small oscillator/noise burst shaped in code.

NB.Audio = {
  ctx: null,
  muted: false,
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  // A short tone: frequency slide from f0 to f1 over `secs`, with a gain envelope.
  tone(f0, f1, secs, type, vol) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + secs);
    gain.gain.setValueAtTime(vol || 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + secs);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + secs + 0.02);
  },
  // Filtered noise burst (explosions, hits).
  noise(secs, vol, freq) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * secs));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = freq || 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + secs);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(t);
  },
  shoot() { this.tone(880, 320, 0.07, 'square', 0.035); },
  railgun() { this.tone(1400, 90, 0.22, 'sawtooth', 0.09); },
  cannon() { this.noise(0.18, 0.1, 900); this.tone(160, 50, 0.18, 'sine', 0.1); },
  frost() { this.tone(1200, 1800, 0.12, 'sine', 0.04); },
  pop() { this.tone(520, 940, 0.06, 'sine', 0.05); },
  coin() { this.tone(980, 1560, 0.09, 'sine', 0.05); },
  error() { this.tone(220, 140, 0.12, 'square', 0.05); },
  leak() { this.tone(300, 60, 0.4, 'sawtooth', 0.12); this.noise(0.3, 0.08, 500); },
  waveHorn() { this.tone(196, 392, 0.35, 'sawtooth', 0.07); this.tone(294, 392, 0.35, 'sawtooth', 0.05); },
  upgrade() { this.tone(523, 523, 0.08, 'sine', 0.06); this.tone(784, 784, 0.1, 'sine', 0.06); },
  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, f, 0.22, 'triangle', 0.09), i * 130));
  },
  defeat() {
    const notes = [392, 330, 262, 196];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, f * 0.9, 0.3, 'sawtooth', 0.07), i * 170));
  },
};
