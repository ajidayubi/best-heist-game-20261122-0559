// audio.js — tiny WebAudio blips only: pickup chime, beeper beep, laser zap,
// alarm tone and win jingle. No sound files.
const AUDIO = {
  ctx: null,
  muted: false,
};

function ensureAudio() {
  if (!AUDIO.ctx) {
    try {
      AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      AUDIO.ctx = null;
    }
  }
  if (AUDIO.ctx && AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume();
}

function playTone(freq, seconds, type, gain) {
  if (AUDIO.muted) return;
  ensureAudio();
  if (!AUDIO.ctx) return;
  const now = AUDIO.ctx.currentTime;
  const osc = AUDIO.ctx.createOscillator();
  const amp = AUDIO.ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  amp.gain.setValueAtTime(gain || 0.08, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + seconds);
  osc.connect(amp);
  amp.connect(AUDIO.ctx.destination);
  osc.start(now);
  osc.stop(now + seconds);
}

function soundPickup() {
  playTone(880, 0.12, 'sine', 0.09);
  setTimeout(() => playTone(1318, 0.18, 'sine', 0.08), 70);
}

function soundBeeper() {
  playTone(1568, 0.08, 'square', 0.05);
}

function soundZap() {
  playTone(220, 0.2, 'sawtooth', 0.09);
}

function soundAlarm() {
  playTone(440, 0.25, 'sawtooth', 0.1);
  setTimeout(() => playTone(330, 0.3, 'sawtooth', 0.1), 200);
}

function soundWin() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'sine', 0.09), i * 110));
}

function soundHack() {
  [660, 880, 990].forEach((f, i) => setTimeout(() => playTone(f, 0.09, 'triangle', 0.07), i * 60));
}
