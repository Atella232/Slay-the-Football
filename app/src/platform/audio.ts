// Motor de audio sintetizado con Web Audio: sin ficheros, todo generado.
import type { Settings } from './storage'

export type Sfx =
  | 'whistle'
  | 'whistleLong'
  | 'whistleTriple'
  | 'kick'
  | 'swish'
  | 'draw'
  | 'block'
  | 'parada'
  | 'hit'
  | 'goal'
  | 'concede'
  | 'coin'
  | 'click'
  | 'hover'
  | 'tick'
  | 'net'
  | 'error'
  | 'buff'
  | 'debuff'
  | 'shuffle'
  | 'card'
  | 'victory'
  | 'defeat'

class AudioEngine {
  ctx: AudioContext | null = null
  master!: GainNode
  sfx!: GainNode
  crowd!: GainNode
  music!: GainNode
  noise: Record<'white' | 'pink' | 'brown', AudioBuffer> | null = null
  crowdSrc: AudioBufferSourceNode | null = null
  crowdGain: GainNode | null = null
  crowdFilter: BiquadFilterNode | null = null
  settings: Settings | null = null
  musicTimer: number | null = null
  musicStep = 0
  musicTheme: 'none' | 'menu' | 'map' | 'match' = 'none'

  ensure(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return true
    }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return false
      this.ctx = new AC()
    } catch {
      return false
    }
    const c = this.ctx
    this.master = c.createGain()
    this.master.connect(c.destination)
    this.sfx = c.createGain()
    this.crowd = c.createGain()
    this.music = c.createGain()
    this.sfx.connect(this.master)
    this.crowd.connect(this.master)
    this.music.connect(this.master)
    this.noise = { white: this.makeNoise('white'), pink: this.makeNoise('pink'), brown: this.makeNoise('brown') }
    if (this.settings) this.apply(this.settings)
    return true
  }

  apply(s: Settings): void {
    this.settings = s
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(s.master, t, 0.05)
    this.sfx.gain.setTargetAtTime(s.sfx, t, 0.05)
    this.crowd.gain.setTargetAtTime(s.crowd, t, 0.05)
    this.music.gain.setTargetAtTime(s.music * 0.5, t, 0.05)
  }

  private makeNoise(kind: 'white' | 'pink' | 'brown'): AudioBuffer {
    const c = this.ctx!
    const len = c.sampleRate * 2
    const buf = c.createBuffer(1, len, c.sampleRate)
    const d = buf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'white') d[i] = w
      else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856
        b4 = 0.55 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
        b6 = w * 0.115926
      } else {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      }
    }
    return buf
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number): void {
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a)
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, at = 0, slideTo?: number, dest?: AudioNode): void {
    const c = this.ctx!
    const t = c.currentTime + at
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    this.env(g, t, 0.005, vol, dur)
    o.connect(g)
    g.connect(dest ?? this.sfx)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  private noiseBurst(kind: 'white' | 'pink' | 'brown', dur: number, vol: number, filter: { type: BiquadFilterType; f: number; q?: number; to?: number }, at = 0, dest?: AudioNode): void {
    const c = this.ctx!
    const t = c.currentTime + at
    const src = c.createBufferSource()
    src.buffer = this.noise![kind]
    const f = c.createBiquadFilter()
    f.type = filter.type
    f.frequency.setValueAtTime(filter.f, t)
    if (filter.to) f.frequency.exponentialRampToValueAtTime(filter.to, t + dur)
    f.Q.value = filter.q ?? 1
    const g = c.createGain()
    this.env(g, t, Math.min(0.02, dur / 4), vol, dur)
    src.connect(f)
    f.connect(g)
    g.connect(dest ?? this.sfx)
    src.start(t, Math.random() * 1.5)
    src.stop(t + dur + 0.1)
  }

  private whistle(at: number, dur: number): void {
    const c = this.ctx!
    const t = c.currentTime + at
    const o1 = c.createOscillator()
    const o2 = c.createOscillator()
    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    const g = c.createGain()
    o1.frequency.value = 2850
    o2.frequency.value = 2905
    lfo.frequency.value = 28
    lfoGain.gain.value = 60
    lfo.connect(lfoGain)
    lfoGain.connect(o1.frequency)
    lfoGain.connect(o2.frequency)
    o1.type = 'sine'
    o2.type = 'sine'
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.02)
    g.gain.setValueAtTime(0.09, t + dur - 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o1.connect(g)
    o2.connect(g)
    g.connect(this.sfx)
    for (const o of [o1, o2, lfo]) {
      o.start(t)
      o.stop(t + dur + 0.05)
    }
  }

  play(s: Sfx): void {
    if (!this.ensure() || !this.ctx) return
    switch (s) {
      case 'whistle':
        this.whistle(0, 0.35)
        break
      case 'whistleLong':
        this.whistle(0, 0.9)
        break
      case 'whistleTriple':
        this.whistle(0, 0.3)
        this.whistle(0.42, 0.3)
        this.whistle(0.84, 0.9)
        break
      case 'kick':
        this.tone(140, 0.12, 'sine', 0.6, 0, 45)
        this.noiseBurst('white', 0.04, 0.25, { type: 'highpass', f: 2500 })
        break
      case 'swish':
      case 'card':
        this.noiseBurst('white', 0.18, 0.18, { type: 'bandpass', f: 900, q: 1.2, to: 3500 })
        break
      case 'draw':
        this.noiseBurst('white', 0.05, 0.08, { type: 'bandpass', f: 3000, q: 2 })
        break
      case 'shuffle':
        for (let i = 0; i < 6; i++) this.noiseBurst('white', 0.04, 0.07, { type: 'bandpass', f: 2500 + i * 200, q: 2 }, i * 0.045)
        break
      case 'block':
        this.tone(110, 0.14, 'triangle', 0.35, 0, 70)
        this.noiseBurst('brown', 0.1, 0.4, { type: 'lowpass', f: 600 })
        break
      case 'parada':
        this.tone(330, 0.12, 'square', 0.12, 0, 220)
        this.noiseBurst('pink', 0.5, 0.25, { type: 'bandpass', f: 700, q: 0.8 }, 0.05, this.crowd)
        break
      case 'hit':
        this.tone(90, 0.2, 'sawtooth', 0.25, 0, 50)
        this.noiseBurst('brown', 0.18, 0.5, { type: 'lowpass', f: 400 })
        break
      case 'goal': {
        this.noiseBurst('white', 0.08, 0.3, { type: 'highpass', f: 1800 })
        this.tone(170, 0.15, 'sine', 0.5, 0, 60)
        // rugido de la grada
        const c = this.ctx
        const t = c.currentTime
        const src = c.createBufferSource()
        src.buffer = this.noise!.pink
        src.loop = true
        const f = c.createBiquadFilter()
        f.type = 'bandpass'
        f.Q.value = 0.7
        f.frequency.setValueAtTime(500, t)
        f.frequency.linearRampToValueAtTime(1400, t + 0.6)
        f.frequency.linearRampToValueAtTime(900, t + 2.6)
        const g = c.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.9, t + 0.35)
        g.gain.setValueAtTime(0.9, t + 1.4)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
        src.connect(f)
        f.connect(g)
        g.connect(this.crowd)
        src.start(t)
        src.stop(t + 3.3)
        this.whistle(0.15, 0.25)
        break
      }
      case 'concede':
        for (let i = 0; i < 3; i++) this.tone(150 - i * 18, 0.9, 'sawtooth', 0.04, i * 0.05, 90 - i * 10, this.crowd)
        this.noiseBurst('brown', 1.2, 0.35, { type: 'lowpass', f: 500, to: 200 }, 0, this.crowd)
        break
      case 'coin':
        this.tone(1320, 0.08, 'square', 0.08)
        this.tone(1760, 0.18, 'square', 0.08, 0.07)
        break
      case 'click':
        this.tone(900, 0.03, 'square', 0.06)
        break
      case 'hover':
        this.tone(1400, 0.02, 'sine', 0.03)
        break
      case 'tick':
        this.tone(2200, 0.02, 'square', 0.05)
        break
      case 'net':
        this.noiseBurst('white', 0.35, 0.3, { type: 'bandpass', f: 1200, q: 0.6, to: 400 })
        break
      case 'error':
        this.tone(220, 0.12, 'square', 0.08)
        this.tone(180, 0.15, 'square', 0.08, 0.1)
        break
      case 'buff':
        this.tone(520, 0.1, 'triangle', 0.12)
        this.tone(780, 0.16, 'triangle', 0.12, 0.08)
        break
      case 'debuff':
        this.tone(400, 0.12, 'triangle', 0.12, 0, 260)
        break
      case 'victory':
        ;[523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.14, i * 0.12, undefined, this.music))
        this.play('whistleTriple')
        break
      case 'defeat':
        ;[392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.12, i * 0.16, undefined, this.music))
        break
    }
  }

  /** Ambiente de grada continuo; intensidad 0..1. */
  crowdBed(on: boolean, intensity = 0.3): void {
    if (!this.ensure() || !this.ctx) return
    const c = this.ctx
    const t = c.currentTime
    if (on && !this.crowdSrc) {
      const src = c.createBufferSource()
      src.buffer = this.noise!.brown
      src.loop = true
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 450
      f.Q.value = 0.5
      const g = c.createGain()
      g.gain.value = 0.0001
      src.connect(f)
      f.connect(g)
      g.connect(this.crowd)
      src.start()
      this.crowdSrc = src
      this.crowdGain = g
      this.crowdFilter = f
    }
    if (!on && this.crowdSrc) {
      this.crowdGain!.gain.setTargetAtTime(0.0001, t, 0.3)
      const s = this.crowdSrc
      setTimeout(() => s.stop(), 1500)
      this.crowdSrc = null
      return
    }
    if (this.crowdGain && this.crowdFilter) {
      this.crowdGain.gain.setTargetAtTime(0.05 + intensity * 0.25, t, 0.4)
      this.crowdFilter.frequency.setTargetAtTime(350 + intensity * 500, t, 0.4)
    }
  }

  /** Música procedural muy sencilla: bajo + acordes por tema. */
  setMusic(theme: 'none' | 'menu' | 'map' | 'match', intensity = 0): void {
    if (theme === this.musicTheme && theme !== 'match') return
    this.musicTheme = theme
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }
    if (theme === 'none' || !this.ensure()) return
    const prog: Record<string, number[][]> = {
      menu: [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 294]],
      map: [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]],
      match: [[147, 175, 220], [131, 165, 196], [117, 147, 175], [131, 165, 196]],
    }
    const chords = prog[theme]
    const stepMs = theme === 'match' ? 230 - intensity * 40 : 300
    this.musicStep = 0
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return
      const bar = Math.floor(this.musicStep / 8) % chords.length
      const beat = this.musicStep % 8
      const ch = chords[bar]
      if (beat === 0 || beat === 4) this.tone(ch[0] / 2, 0.35, 'triangle', 0.18, 0, undefined, this.music)
      if (beat === 2 || beat === 6) ch.forEach(f => this.tone(f, 0.18, 'sine', 0.05, 0, undefined, this.music))
      if (theme === 'match' && beat % 2 === 1) this.noiseBurst('white', 0.03, 0.03 + intensity * 0.04, { type: 'highpass', f: 6000 }, 0, this.music)
      this.musicStep++
    }, stepMs)
  }
}

export const audio = new AudioEngine()
