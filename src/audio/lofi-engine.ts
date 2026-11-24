// Generative lofi via Web Audio. The AudioContext is created only inside start().
export interface LofiEngine {
  start(): Promise<void>;
  stop(): void;
  setVolume(v: number): void;
  readonly playing: boolean;
}

const BPM = 75;
const STEP = 60 / BPM / 4; // 16th note, seconds
const LOOKAHEAD = 0.1;
const FADE = 0.12;
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

// Dm9 -> G13 -> Cmaj9 -> A7(b9), one bar each, as MIDI notes (bass first)
const CHORDS = [
  [38, 53, 57, 60, 64],
  [43, 53, 59, 64],
  [36, 52, 55, 59, 62],
  [45, 55, 58, 61, 64],
];

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0; // pink-ish noise (Paul Kellet, 3-pole)
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  return buf;
}

export function createLofiEngine(): LofiEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let volume = 0.5;
  let playing = false;
  let sources: AudioScheduledSourceNode[] = [];

  const level = (v: number) => v * 0.4; // keep it soft: peak master gain 0.4

  function start(): Promise<void> {
    if (playing) return Promise.resolve();
    const w = window as any;
    const Ctor: typeof AudioContext | undefined = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return Promise.reject(new Error('Web Audio unavailable'));
    const c = new Ctor();
    return c.resume().then(
      () => {
        ctx = c;
        playing = true;
        build(c);
      },
      (e) => {
        c.close().catch(() => {});
        throw e;
      },
    );
  }

  function build(c: AudioContext) {
    const m = (master = c.createGain());
    m.gain.setValueAtTime(0, c.currentTime);
    m.gain.linearRampToValueAtTime(level(volume), c.currentTime + 0.3);
    m.connect(c.destination);

    const pad = c.createBiquadFilter(); // chords go through a low-pass
    pad.type = 'lowpass';
    pad.frequency.value = 1200;
    pad.connect(m);

    const noise = noiseBuffer(c, 3);
    const loop = (type: BiquadFilterType, freq: number, gain: number) => {
      const s = c.createBufferSource();
      s.buffer = noise;
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = c.createGain();
      g.gain.value = gain;
      s.connect(f).connect(g).connect(m);
      s.start();
      sources.push(s);
    };
    loop('highpass', 4000, 0.04); // vinyl
    loop('bandpass', 1800, 0.06); // rain

    const burst = (t: number, type: BiquadFilterType, freq: number, peak: number, dur: number) => {
      const s = c.createBufferSource();
      s.buffer = noise;
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f).connect(g).connect(m);
      s.start(t, Math.random() * 2, dur + 0.02);
    };
    const kick = (t: number) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g).connect(m);
      o.start(t);
      o.stop(t + 0.3);
    };
    const chord = (t: number, notes: number[]) => {
      const len = STEP * 16;
      for (const n of notes) {
        const o = c.createOscillator();
        o.type = 'triangle';
        o.frequency.value = mtof(n);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(n < 40 ? 0.22 : 0.07, t + 0.08);
        g.gain.linearRampToValueAtTime(0.0001, t + len);
        o.connect(g).connect(pad);
        o.start(t);
        o.stop(t + len + 0.05);
      }
    };

    let step = 0;
    let next = c.currentTime + 0.1;
    const tick = () => {
      while (next < c.currentTime + LOOKAHEAD) {
        const i = step % 16;
        if (i === 0) chord(next, CHORDS[Math.floor(step / 16) % 4]);
        if (i === 0 || i === 10) kick(next);
        if (i === 4 || i === 12) burst(next, 'bandpass', 1800, 0.35, 0.15); // snare
        if (i % 2 === 0) burst(next, 'highpass', 7000, i % 4 === 0 ? 0.12 : 0.07, 0.04); // hat
        next += STEP;
        step++;
      }
    };
    tick();
    timer = setInterval(tick, 25);
  }

  function stop() {
    if (!playing || !ctx || !master) return;
    playing = false;
    clearInterval(timer);
    const c = ctx, m = master, src = sources;
    ctx = master = null;
    sources = [];
    m.gain.cancelScheduledValues(c.currentTime);
    m.gain.setValueAtTime(m.gain.value, c.currentTime);
    m.gain.linearRampToValueAtTime(0, c.currentTime + FADE); // fade out first: no click
    setTimeout(() => {
      src.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } });
      c.close().catch(() => {});
    }, FADE * 1000 + 30);
  }

  function setVolume(v: number) {
    volume = Math.min(1, Math.max(0, v));
    if (ctx && master) master.gain.setTargetAtTime(level(volume), ctx.currentTime, 0.02);
  }

  return { start, stop, setVolume, get playing() { return playing; } };
}
