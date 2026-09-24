// Tiny WebAudio synth — no assets needed.
let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let musicStep = 0;
let sfxVol = 0.7;
let musVol = 0.35;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setVolumes(sfx: number, music: number) {
  sfxVol = sfx;
  musVol = music;
  if (musicGain) musicGain.gain.value = musVol * 0.25;
}

type Wave = OscillatorType;

function tone(freq: number, dur: number, type: Wave = "square", vol = 0.3, slideTo?: number) {
  const a = ac();
  if (!a || sfxVol <= 0) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), a.currentTime + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * sfxVol), a.currentTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(g).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur + 0.02);
}

function noise(dur: number, vol = 0.25, filterFreq = 1200) {
  const a = ac();
  if (!a || sfxVol <= 0) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filterFreq;
  const g = a.createGain();
  g.gain.value = vol * sfxVol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  flap: () => tone(620, 0.09, "square", 0.16, 380),
  score: () => {
    tone(880, 0.08, "square", 0.18);
    setTimeout(() => tone(1320, 0.1, "square", 0.15), 55);
  },
  perfect: () => {
    tone(1046, 0.07, "triangle", 0.2);
    setTimeout(() => tone(1318, 0.07, "triangle", 0.2), 50);
    setTimeout(() => tone(1568, 0.12, "triangle", 0.2), 100);
  },
  coin: () => {
    tone(1200, 0.05, "square", 0.14);
    setTimeout(() => tone(1800, 0.08, "square", 0.12), 40);
  },
  power: () => {
    tone(500, 0.1, "sawtooth", 0.16, 1400);
    setTimeout(() => tone(1500, 0.12, "triangle", 0.14), 90);
  },
  hit: () => {
    noise(0.22, 0.4, 900);
    tone(180, 0.25, "sawtooth", 0.25, 60);
  },
  die: () => {
    tone(400, 0.5, "sawtooth", 0.2, 70);
    setTimeout(() => noise(0.35, 0.25, 500), 80);
  },
  shield: () => tone(300, 0.2, "sine", 0.22, 900),
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle", 0.22), i * 95));
  },
  lose: () => {
    [523, 440, 349, 262].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.2), i * 110));
  },
  click: () => tone(760, 0.04, "square", 0.1),
  buy: () => {
    tone(700, 0.08, "square", 0.16);
    setTimeout(() => tone(1050, 0.08, "square", 0.16), 70);
    setTimeout(() => tone(1400, 0.14, "square", 0.16), 140);
  },
  err: () => tone(150, 0.16, "sawtooth", 0.18),
  count: () => tone(900, 0.07, "square", 0.14),
};

const SCALE = [0, 3, 5, 7, 10, 12, 10, 7];
export function startMusic(darkMood = false) {
  const a = ac();
  if (!a || musicTimer !== null) return;
  musicGain = a.createGain();
  musicGain.gain.value = musVol * 0.25;
  musicGain.connect(a.destination);
  const root = darkMood ? 110 : 146.83;
  const tick = () => {
    if (!ctx || !musicGain || musVol <= 0) return;
    const t = ctx.currentTime;
    const n = SCALE[musicStep % SCALE.length];
    const f = root * Math.pow(2, n / 12);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = musicStep % 4 === 0 ? "triangle" : "sine";
    o.frequency.value = f * (musicStep % 8 < 4 ? 1 : 1.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g).connect(musicGain);
    o.start(t);
    o.stop(t + 0.4);
    if (musicStep % 4 === 0) {
      const b = ctx.createOscillator();
      const bg = ctx.createGain();
      b.type = "sine";
      b.frequency.setValueAtTime(root / 2, t);
      bg.gain.setValueAtTime(0.35, t);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      b.connect(bg).connect(musicGain);
      b.start(t);
      b.stop(t + 0.32);
    }
    musicStep++;
  };
  musicTimer = window.setInterval(tick, 260);
}

export function stopMusic() {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  musicGain?.disconnect();
  musicGain = null;
  musicStep = 0;
}

export function unlockAudio() {
  ac();
}
