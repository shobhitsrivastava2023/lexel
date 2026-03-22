/**
 * Schedules mono s16le PCM chunks for gapless-ish playback via Web Audio.
 * Carries incomplete trailing bytes across chunks so split frames don't corrupt audio.
 */
export class PcmStreamPlayer {
  private ctx: AudioContext | null = null;
  private nextTime = 0;
  private sampleRate = 24_000;
  /** Leftover bytes when a chunk length isn't a multiple of 2. */
  private pcmCarry: Uint8Array<ArrayBufferLike> = new Uint8Array(0);

  setSampleRate(sr: number) {
    if (sr > 0) this.sampleRate = sr;
  }

  async ensureRunning() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  pushPcmBytes(u8: Uint8Array) {
    if (!this.ctx || u8.length === 0) return;

    let combined: Uint8Array;
    if (this.pcmCarry.length === 0) {
      combined = u8;
    } else {
      combined = new Uint8Array(this.pcmCarry.length + u8.length);
      combined.set(this.pcmCarry, 0);
      combined.set(u8, this.pcmCarry.length);
      this.pcmCarry = new Uint8Array(0);
    }

    const evenLen = combined.length & ~1;
    if (evenLen === 0) {
      this.pcmCarry = combined;
      return;
    }

    if (evenLen < combined.length) {
      this.pcmCarry = new Uint8Array(combined.subarray(evenLen));
    }

    const frame = new Uint8Array(combined.subarray(0, evenLen));
    const samples = frame.length >> 1;
    const view = new DataView(
      frame.buffer,
      frame.byteOffset,
      frame.byteLength,
    );
    const buffer = this.ctx.createBuffer(1, samples, this.sampleRate);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      ch[i] = view.getInt16(i * 2, true) / 32768;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    const startAt = Math.max(now, this.nextTime);
    src.start(startAt);
    this.nextTime = startAt + buffer.duration;
  }

  flushSchedule() {
    this.pcmCarry = new Uint8Array(0);
    if (this.ctx) {
      this.nextTime = this.ctx.currentTime;
    } else {
      this.nextTime = 0;
    }
  }

  async dispose() {
    this.nextTime = 0;
    this.pcmCarry = new Uint8Array(0);
    if (this.ctx) {
      await this.ctx.close();
      this.ctx = null;
    }
  }
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}
