/**
 * Ambiance sonore générée par Web Audio API.
 * Aucun fichier audio, aucune requête réseau, aucun démarrage avant une
 * interaction utilisateur. Le contexte est créé au premier geste.
 */

export class AudioEngine {
  constructor({ volume = 0.45, enabled = true } = {}) {
    this.volume = Math.min(1, Math.max(0, volume));
    this.enabled = Boolean(enabled);
    this.context = null;
    this.master = null;
    this.ambient = null;
    this.unlocked = false;
    this.ambientRequested = false;
    this.disposed = false;
  }

  get supported() {
    return typeof window !== "undefined" && Boolean(window.AudioContext || window.webkitAudioContext);
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, Number(value) || 0));
    if (this.master) {
      this.master.gain.setTargetAtTime(this.enabled ? this.volume * 0.6 : 0, this.context.currentTime, 0.05);
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.stopAmbient();
      if (this.master) this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.05);
    } else {
      this.unlock();
      if (this.master) this.master.gain.setTargetAtTime(this.volume * 0.6, this.context.currentTime, 0.05);
      if (this.ambientRequested) this.startAmbient();
    }
  }

  unlock() {
    if (this.unlocked || !this.supported || this.disposed) return this.context;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? this.volume * 0.6 : 0;
      this.master.connect(this.context.destination);
      this.unlocked = true;
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
      if (this.ambientRequested) this.startAmbient();
      return this.context;
    } catch (error) {
      console.warn("Audio indisponible", error);
      return null;
    }
  }

  /** Branche le déverrouillage sur le premier geste utilisateur. */
  attachUnlock(target = document) {
    if (!this.supported) return () => {};
    const handler = () => {
      this.unlock();
      target.removeEventListener("pointerdown", handler, true);
      target.removeEventListener("keydown", handler, true);
    };
    target.addEventListener("pointerdown", handler, true);
    target.addEventListener("keydown", handler, true);
    return () => {
      target.removeEventListener("pointerdown", handler, true);
      target.removeEventListener("keydown", handler, true);
    };
  }

  startAmbient() {
    this.ambientRequested = true;
    if (!this.enabled || !this.supported) return;
    if (!this.unlocked) {
      this.unlock();
      return;
    }
    if (!this.context || this.ambient) return;

    const ctx = this.context;
    const bus = ctx.createGain();
    bus.gain.value = 0.055;
    bus.connect(this.master);

    const low = ctx.createOscillator();
    low.type = "sine";
    low.frequency.value = 54;
    const lowGain = ctx.createGain();
    lowGain.gain.value = 0.35;
    low.connect(lowGain).connect(bus);

    const high = ctx.createOscillator();
    high.type = "triangle";
    high.frequency.value = 81;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.08;
    high.connect(highGain).connect(bus);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(bus.gain);

    // Souffle filtré, très bas, pour éviter un bourdon trop électronique.
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(filter).connect(noiseGain).connect(bus);

    low.start();
    high.start();
    lfo.start();
    noise.start();

    this.ambient = { bus, low, high, lfo, noise };
  }

  stopAmbient() {
    this.ambientRequested = false;
    if (!this.ambient || !this.context) return;
    const { bus, low, high, lfo, noise } = this.ambient;
    const now = this.context.currentTime;
    try {
      bus.gain.cancelScheduledValues(now);
      bus.gain.setTargetAtTime(0, now, 0.15);
      low.stop(now + 0.8);
      high.stop(now + 0.8);
      lfo.stop(now + 0.8);
      noise.stop(now + 0.8);
    } catch {
      // Les nœuds peuvent déjà être arrêtés.
    }
    this.ambient = null;
  }

  _tone({ frequency = 440, type = "sine", duration = 0.12, gain = 0.08, slide = null, delay = 0 }) {
    if (!this.enabled || !this.unlocked || !this.context || !this.master) return;
    const ctx = this.context;
    const now = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slide), now + duration);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(gain, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  play(name) {
    if (!this.enabled) return;
    this.unlock();
    switch (name) {
      case "click":
        this._tone({ frequency: 620, type: "triangle", duration: 0.06, gain: 0.035, slide: 420 });
        break;
      case "open":
        this._tone({ frequency: 220, type: "sine", duration: 0.35, gain: 0.05, slide: 330 });
        break;
      case "success":
        this._tone({ frequency: 523.25, duration: 0.18, gain: 0.055 });
        this._tone({ frequency: 783.99, duration: 0.32, gain: 0.05, delay: 0.12 });
        break;
      case "error":
        this._tone({ frequency: 132, type: "sawtooth", duration: 0.22, gain: 0.045, slide: 98 });
        break;
      case "achievement":
        this._tone({ frequency: 659.25, duration: 0.18, gain: 0.05 });
        this._tone({ frequency: 880, duration: 0.18, gain: 0.045, delay: 0.1 });
        this._tone({ frequency: 1046.5, duration: 0.4, gain: 0.04, delay: 0.2 });
        break;
      case "reveal":
        this._tone({ frequency: 330, type: "triangle", duration: 0.5, gain: 0.04, slide: 660 });
        break;
      case "glitch":
        this._tone({ frequency: 90, type: "square", duration: 0.08, gain: 0.035 });
        this._tone({ frequency: 140, type: "square", duration: 0.06, gain: 0.03, delay: 0.09 });
        break;
      default:
        break;
    }
  }

  suspend() {
    if (this.context && this.context.state === "running") this.context.suspend().catch(() => {});
  }

  resume() {
    if (this.context && this.context.state === "suspended" && this.enabled) this.context.resume().catch(() => {});
  }

  dispose() {
    this.disposed = true;
    this.stopAmbient();
    if (this.context && this.context.state !== "closed") this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }
}
