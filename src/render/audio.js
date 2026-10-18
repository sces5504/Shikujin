// Original procedural score: no downloaded music or copyrighted sound samples.
export class Audio {
  constructor() {
    this.enabled = true;
    this.music = true;
    this.context = null;
    this.last = 0;
    this.scene = "hangar";
    this.boss = false;
    this.step = 0;
    this.next = 0;
    this.timer = null;
  }
  unlock() {
    try {
      this.context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (!this.master) {
        this.master = this.context.createGain();
        this.master.gain.value = 0.65;
        this.master.connect(this.context.destination);
      }
      this.context.resume().catch(() => {});
      if (!this.timer) this.timer = setInterval(() => this.schedule(), 100);
    } catch {}
  }
  note(freq, start, duration, type, volume, slide = 1) {
    if (!this.context || !this.master) return;
    const a = this.context,
      o = a.createOscillator(),
      g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slide !== 1)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(25, freq * slide),
        start + duration,
      );
    g.gain.setValueAtTime(0.001, start);
    g.gain.linearRampToValueAtTime(volume, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    o.connect(g).connect(this.master);
    o.start(start);
    o.stop(start + duration + 0.01);
  }
  tone(freq, duration = 0.1, type = "sine", volume = 0.04) {
    if (!this.enabled || !this.context) return;
    this.note(freq, this.context.currentTime, duration, type, volume, 0.5);
  }
  schedule() {
    if (!this.context || this.context.state !== "running") return;
    this.master.gain.setTargetAtTime(
      this.enabled ? 0.65 : 0,
      this.context.currentTime,
      0.04,
    );
    if (!this.enabled || !this.music || document.hidden) {
      this.next = this.context.currentTime;
      return;
    }
    if (this.next < this.context.currentTime)
      this.next = this.context.currentTime;
    const interval =
      this.scene === "battle" ? (this.boss ? 0.13 : 0.155) : 0.22;
    while (this.next < this.context.currentTime + 0.22) {
      const n = this.step++,
        bar = Math.floor(n / 16) % 4,
        root = [110, 87.307, 130.813, 97.999][bar],
        scale = [0, 7, 12, 14, 19, 14, 12, 7],
        melody = root * Math.pow(2, scale[n % 8] / 12);
      this.note(melody * 2, this.next, 0.35, "sine", 0.012);
      if (n % 4 === 0) this.note(root / 2, this.next, 0.5, "triangle", 0.028);
      if (n % 16 === 0) {
        this.note(root * 2, this.next, 2.5, "sine", 0.018);
        this.note(root * 2 * 1.498, this.next, 2.5, "sine", 0.012);
      }
      if (this.scene === "battle") {
        if (n % 4 === 0) this.note(100, this.next, 0.15, "sine", 0.07, 0.35);
        if (n % 8 === 4)
          this.note(180, this.next, 0.075, "triangle", 0.018, 0.3);
        if (n % 2 === 0)
          this.note(3300, this.next, 0.025, "square", 0.002, 0.6);
      }
      this.next += interval;
    }
  }
  shoot() {
    const now = performance.now();
    if (now - this.last < 90) return;
    this.last = now;
    this.tone(650, 0.055, "triangle", 0.018);
  }
}
