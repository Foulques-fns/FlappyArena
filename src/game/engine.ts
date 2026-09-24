import { MAPS, POWER_INFO, SKINS, TRAILS, type GameMap, type LevelMods, type PowerKind, type Skin, type TrailKind } from "./data";
import { drawBackground, drawCreature, roundRect } from "./render";
import { sfx } from "./audio";
import type { Settings } from "./store";

export type Mode = "classic" | "level" | "duel" | "time" | "chaos" | "online";
export type Phase = "ready" | "countdown" | "running" | "over" | "paused";

export const W = 480;
export const H = 720;
const GROUND = 86;
const BASE_GRAV = 1750;
const BASE_FLAP = -520;
const BASE_SPEED = 190;
const BASE_GAP = 196;
const BASE_SPACING = 268;
const BIRD_R = 17;

export interface PlayerCfg {
  skinId: string;
  trailId: TrailKind;
  name: string;
  ai?: boolean;
  aiLevel?: number;
  color: string;
}

export interface EngineOpts {
  mode: Mode;
  mapId: string;
  settings: Settings;
  players: PlayerCfg[];
  mods?: LevelMods;
  goldTarget?: number;   // level end score
  duration?: number;     // time attack seconds
  silent?: boolean;      // no sound (attract mode)
  auto?: boolean;        // start immediately (attract mode)
  startScore?: number;   // score offset when joining mid-round (netplay)
  onTick: (s: Snapshot) => void;
  onEnd: (r: Result) => void;
}

export interface Snapshot {
  phase: Phase;
  countdown: number;
  timeLeft: number;
  players: {
    score: number;
    coins: number;
    alive: boolean;
    powers: { kind: PowerKind; left: number }[];
    combo: number;
  }[];
  chaosLabel: string;
  fps: number;
}

export interface Result {
  scores: number[];
  coins: number[];
  winner: number;
  best: number;
  perfects: number;
  powerUsed: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  kind: "dot" | "square" | "star" | "heart" | "ring" | "bolt" | "leaf" | "rune" | "line" | "linto" | "glowsq" | "glowdot" | "glyph";
  grav: number;
  glyph?: string;
}

interface FloatText {
  x: number; y: number; vy: number; life: number; text: string; color: string; size: number;
}

interface Obstacle {
  id: number;
  x: number;
  w: number;
  gapY: number;
  gap: number;
  kind: "pipe" | "laser";
  baseY: number;
  amp: number;
  mspeed: number;
  phase: number;
  saw: boolean;
  sawAng: number;
  invisible: boolean;
  laserT: number;
  scored: boolean[];
}

interface Pickup {
  x: number; y: number; kind: "coin" | PowerKind; taken: boolean; t: number; vy: number;
}

interface Bird {
  cfg: PlayerCfg;
  skin: Skin;
  ctrl?: { setTarget: (y: number) => void; flap: () => void };
  x: number; y: number; vy: number; rot: number;
  alive: boolean;
  dyingT: number;
  score: number;
  coins: number;
  combo: number;
  gdir: 1 | -1;
  flapPhase: number;
  r: number;
  powers: Map<PowerKind, number>;
  shield: boolean;
  aiCool: number;
  aiBias: number;
  trailT: number;
  perfects: number;
  powerUsed: number;
  dead0: number;
  y0: number;
  index: number;
  ctrlY: number;
}

const CHAOS_LIST = [
  { id: "speed", label: "⚡ VITESSE x1.4" },
  { id: "tiny", label: "🔻 MINI OISEAU" },
  { id: "giant", label: "🔺 GÉANT" },
  { id: "moon", label: "🌙 GRAVITÉ LUNAIRE" },
  { id: "heavy", label: "🪨 GRAVITÉ LOURDE" },
  { id: "flip", label: "🔄 GRAVITÉ INVERSÉE" },
  { id: "wind", label: "🌪️ VENT VIOLENT" },
  { id: "narrow", label: "🚪 PASSAGE ÉTROIT" },
  { id: "ghost", label: "👻 TUYAUX INVISIBLES" },
  { id: "saws", label: "🪚 SCIES PARTOUT" },
  { id: "laser", label: "🔴 LASERS" },
  { id: "coinrain", label: "🪙 PLUIE DE PIÈCES" },
];

export class FlappyEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private opts: EngineOpts;
  private map: GameMap;
  private raf = 0;
  private lastT = 0;
  private acc = 0;
  private time = 0;
  private scroll = 0;
  private obstacles: Obstacle[] = [];
  private pickups: Pickup[] = [];
  private parts: Particle[] = [];
  private texts: FloatText[] = [];
  private weather: { x: number; y: number; v: number; s: number; a: number }[] = [];
  private birds: Bird[] = [];
  private nextId = 1;
  /** world-relative offset of next spawned obstacle (used for netplay sync) */
  spawnX = 0;
  phase: Phase = "ready";
  private countdown = 0;
  private timeLeft = 0;
  private shake = 0;
  private flash = 0;
  private flashColor = "255,255,255";
  private tickAcc = 0;
  private fps = 60;
  private fpsAcc = 0;
  private fpsN = 0;
  private chaos: string[] = [];
  private chaosLabel = "";
  private chaosNext = 8;
  private ended = false;
  private destroyed = false;
  private lightning = 0;
  private snd: typeof sfx;
  private startScore = 0;
  /** guest netcode: world is driven remotely */
  netPuppet = false;
  /** treat engine logic as "online" mode automatically */
  isOnlineMode = false;

  constructor(canvas: HTMLCanvasElement, opts: EngineOpts) {
    this.canvas = canvas;
    this.opts = opts;
    const noop = () => {};
    this.snd = opts.silent
      ? (new Proxy({}, { get: () => noop }) as unknown as typeof sfx)
      : sfx;
    this.map = MAPS.find((m) => m.id === opts.mapId) ?? MAPS[0];
    this.isOnlineMode = opts.mode === "online";
    const c = canvas.getContext("2d", { alpha: false });
    if (!c) throw new Error("no 2d context");
    this.ctx = c;
    this.resize();
    this.reset();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ------------------------------------------------------------ lifecycle
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
  }

  reset() {
    const s = this.opts.settings;
    this.obstacles = [];
    this.pickups = [];
    this.parts = [];
    this.texts = [];
    this.time = 0;
    this.scroll = 0;
    this.spawnX = W + 120;
    this.startScore = this.opts.startScore ?? 0;
    this.ended = false;
    this.chaos = [];
    this.chaosLabel = "";
    this.chaosNext = 6;
    this.timeLeft = this.opts.duration ?? 0;
    this.shake = 0;
    this.flash = 0;
    this.birds = this.opts.players.map((cfg, i) => ({
      cfg,
      skin: SKINS.find((k) => k.id === cfg.skinId) ?? SKINS[0],
      x: W * 0.28,
      y: H / 2 - 40 + (this.opts.players.length > 1 ? (i === 0 ? -42 : 42) : 0),
      vy: 0,
      rot: 0,
      alive: true,
      dyingT: 0,
      score: 0,
      coins: 0,
      combo: 0,
      gdir: 1,
      flapPhase: 0,
      r: BIRD_R,
      powers: new Map(),
      shield: false,
      aiCool: 0,
      aiBias: (Math.random() - 0.5) * 20,
      trailT: 0,
      perfects: 0,
      powerUsed: 0,
      dead0: 0,
      y0: H / 2 - 40 + (this.opts.players.length > 1 ? (i === 0 ? -42 : 42) : 0),
      index: i,
      ctrlY: H / 2,
    }));
    this.weather = [];
    const wn = s.particles ? 60 : 0;
    for (let i = 0; i < wn; i++) {
      this.weather.push({ x: Math.random() * W, y: Math.random() * H, v: 40 + Math.random() * 120, s: 1 + Math.random() * 2.4, a: 0.2 + Math.random() * 0.6 });
    }
    this.phase = this.opts.auto ? "running" : this.opts.mode === "duel" || this.opts.mode === "online" ? "countdown" : "ready";
    this.countdown = 3.2;
    // pre-generate a couple of obstacles for the ready screen
    for (let i = 0; i < 3; i++) this.spawnObstacle();
  }

  restart() {
    this.reset();
  }

  /** Attach an external controller to a bird (netplay). */
  setController(index: number, c: { setTarget: (y: number) => void; flap: () => void } | undefined) {
    const b = this.birds[index];
    if (b) b.ctrl = c;
  }

  /** Read a player state (netplay sync). */
  getPlayerState(index: number) {
    const b = this.birds[index];
    if (!b) return null;
    return { x: b.x, y: b.y, vy: b.vy, rot: b.rot, score: b.score, coins: b.coins, alive: b.alive, flapPhase: b.flapPhase };
  }

  /** Snapshot of world obstacles + pickups (host -> guest netcode). */
  getNetWorld() {
    return {
      o: this.obstacles.map((o) => ({
        i: o.id, x: Math.round(o.x), w: o.w, gY: Math.round(o.gapY), g: Math.round(o.gap),
        k: o.kind, b: Math.round(o.baseY), a: Math.round(o.amp), ms: +o.mspeed.toFixed(2),
        p: +o.phase.toFixed(2), s: o.saw, inv: o.invisible, lT: +o.laserT.toFixed(2),
      })),
      p: this.pickups.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), k: p.kind, t: p.taken })),
      s: Math.round(this.scroll),
      n: this.spawnX,
    };
  }

  /** Apply host world snapshot (guest netcode). */
  applyNetWorld(w: ReturnType<FlappyEngine["getNetWorld"]>) {
    this.obstacles = w.o.map((o) => ({
      id: o.i, x: o.x, w: o.w, gapY: o.gY, gap: o.g, kind: o.k as Obstacle["kind"],
      baseY: o.b, amp: o.a, mspeed: o.ms, phase: o.p, saw: o.s, sawAng: 0,
      invisible: o.inv, laserT: o.lT,
      scored: this.birds.map(() => false),
    }));
    const nextId = Math.max(0, ...w.o.map((o) => o.i)) + 1;
    this.nextId = Math.max(this.nextId, nextId);
    this.scroll = w.s;
    this.spawnX = w.n;
    const prevP = new Map<string, number>();
    for (const p of this.pickups) prevP.set(`${Math.round(p.x / 8)}:${p.kind}`, p.t);
    this.pickups = w.p.map((p) => ({
      x: p.x, y: p.y, kind: p.k as Pickup["kind"], taken: p.t, t: prevP.get(`${Math.round(p.x / 8)}:${p.k}`) ?? 0, vy: 0,
    }));
  }

  /** Force round end (disconnect handling). */
  abortRound() {
    this.birds.forEach((b) => {
      b.alive = false;
      b.dyingT = Math.max(b.dyingT, 1);
    });
    this.finish();
  }

  /** Live-update gameplay settings (used by the in-game quick options). */
  setSettings(s: Settings) {
    this.opts.settings = s;
  }

  pause() {
    if (this.phase === "running" || this.phase === "countdown") this.phase = "paused";
  }

  resume() {
    if (this.phase === "paused") this.phase = this.opts.mode === "duel" || this.opts.mode === "online" ? "countdown" : "running";
    if (this.countdown <= 0) this.countdown = 2.2;
  }

  // ------------------------------------------------------------ input
  flap(index = 0) {
    const b = this.birds[index];
    if (!b || b.cfg.ai) return;
    if (this.phase === "ready") {
      this.phase = "running";
    }
    if (this.phase !== "running" || !b.alive) return;
    this.doFlap(b);
  }

  private doFlap(b: Bird) {
    const s = this.opts.settings;
    const mods = this.opts.mods;
    const mul = s.flap * (mods ? 1 : 1);
    b.vy = BASE_FLAP * mul * b.gdir * (this.chaos.includes("moon") ? 0.82 : 1);
    b.flapPhase = 0;
    b.rot = -0.5 * b.gdir;
    this.snd.flap();
    if (s.particles) {
      for (let i = 0; i < 4; i++) {
        this.parts.push({
          x: b.x - 10, y: b.y + 8 * b.gdir, vx: -60 - Math.random() * 90, vy: (Math.random() - 0.5) * 70,
          life: 0.4, max: 0.4, size: 2 + Math.random() * 3, color: "rgba(255,255,255,.75)", kind: "dot", grav: 0,
        });
      }
    }
  }

  // ------------------------------------------------------------ helpers
  private get speedMul() {
    const s = this.opts.settings;
    const m = this.opts.mods;
    let v = s.speed * (this.map.speedMul ?? 1) * (m?.speed ?? 1);
    if (this.chaos.includes("speed")) v *= 1.4;
    // progressive difficulty in endless modes
    if (this.opts.mode === "classic" || this.opts.mode === "time" || this.opts.mode === "chaos") {
      const sc = Math.max(...this.birds.map((b) => b.score), 0);
      v *= 1 + Math.min(0.55, sc * 0.012);
    }
    const slowed = this.birds.some((b) => b.alive && b.powers.has("slow"));
    if (slowed) v *= 0.55;
    return v;
  }

  private get gravMul() {
    const s = this.opts.settings;
    const m = this.opts.mods;
    let v = s.gravity * (this.map.gravityMul ?? 1) * (m?.gravity ?? 1);
    if (this.chaos.includes("moon")) v *= 0.6;
    if (this.chaos.includes("heavy")) v *= 1.45;
    return v;
  }

  private get gapSize() {
    const s = this.opts.settings;
    const m = this.opts.mods;
    let g = BASE_GAP * s.gap * (m?.gap ?? 1);
    if (this.chaos.includes("narrow")) g *= 0.78;
    if (this.chaos.includes("giant")) g *= 1.15;
    if (m?.narrow || this.opts.mode === "classic") {
      const sc = Math.max(...this.birds.map((b) => b.score), 0);
      const shrink = m?.narrow ? Math.min(52, sc * 2.2) : Math.min(26, sc * 0.7);
      g -= shrink;
    }
    if (this.birds.length > 1) g *= 1.12;
    return Math.max(104, g);
  }

  private get windForce() {
    const m = this.opts.mods;
    let w = (this.map.wind ?? 0) + (m?.wind ?? 0);
    if (this.chaos.includes("wind")) w += Math.sin(this.time * 0.6) * 42;
    return w;
  }

  private rnd() {
    return Math.random();
  }

  private spawnObstacle() {
    const m = this.opts.mods;
    const gap = this.gapSize;
    const margin = 76;
    const playable = H - GROUND - margin * 2 - gap;
    const gapY = margin + gap / 2 + this.rnd() * Math.max(20, playable);
    const isLaser = this.rnd() < ((m?.lasers ?? 0) + (this.chaos.includes("laser") ? 0.5 : 0));
    const moving = !isLaser && this.rnd() < ((m?.moving ?? 0) + (this.opts.mode === "classic" ? 0.1 : 0) + (this.chaos.includes("speed") ? 0.15 : 0));
    const saw = !isLaser && this.rnd() < ((m?.saws ?? 0) + (this.chaos.includes("saws") ? 0.7 : 0));
    const invisible = this.rnd() < ((m?.invisible ?? 0) + (this.chaos.includes("ghost") ? 0.7 : 0));
    const o: Obstacle = {
      id: this.nextId++,
      x: this.spawnX,
      w: isLaser ? 26 : 62,
      gapY,
      gap,
      kind: isLaser ? "laser" : "pipe",
      baseY: gapY,
      amp: moving ? 28 + this.rnd() * 44 : 0,
      mspeed: 0.7 + this.rnd() * 0.9,
      phase: this.rnd() * Math.PI * 2,
      saw,
      sawAng: 0,
      invisible,
      laserT: this.rnd() * 2,
      scored: this.birds.map(() => false),
    };
    this.obstacles.push(o);

    const sp = BASE_SPACING * (this.birds.length > 1 ? 1.12 : 1) * (this.opts.mode === "chaos" ? 1.05 : 1);
    this.spawnX += sp;

    // pickups
    const s = this.opts.settings;
    if (s.coinsOn && this.rnd() < (this.chaos.includes("coinrain") ? 1 : 0.55)) {
      const n = this.chaos.includes("coinrain") ? 3 : 1;
      // static pipes: coin inside the gap (risk/reward) — moving pipes: coin between pipes
      const inGap = o.amp === 0 && o.kind === "pipe";
      const cx = inGap ? o.x + o.w / 2 : o.x + sp * 0.5;
      const cy = inGap ? gapY + (this.rnd() - 0.5) * gap * 0.35 : 110 + this.rnd() * (H - GROUND - 220);
      for (let i = 0; i < n; i++) {
        this.pickups.push({ x: cx + (i - (n - 1) / 2) * 34, y: cy, kind: "coin", taken: false, t: this.rnd() * 6, vy: 0 });
      }
    }
    if (s.powerups && this.rnd() < 0.19) {
      const kinds: PowerKind[] = ["shield", "slow", "magnet", "double", "shrink"];
      const k = kinds[Math.floor(this.rnd() * kinds.length)];
      this.pickups.push({ x: o.x + BASE_SPACING * 0.5, y: 120 + this.rnd() * (H - GROUND - 240), kind: k, taken: false, t: 0, vy: 0 });
    }
  }

  // ------------------------------------------------------------ update
  private step(dt: number) {
    this.time += dt;
    const s = this.opts.settings;
    const speed = BASE_SPEED * this.speedMul;

    if (this.phase === "countdown") {
      this.countdown -= dt;
      if (this.countdown <= 0) this.phase = "running";
    }

    const running = this.phase === "running" && !this.netPuppet;
    const anyAlive = this.birds.some((b) => b.alive);

    if (running) {
      this.scroll += speed * dt;
      // move world
      for (const o of this.obstacles) o.x -= speed * dt;
      for (const p of this.pickups) p.x -= speed * dt;
      this.spawnX -= speed * dt;
      while (this.spawnX < W + 200) this.spawnObstacle();
      this.obstacles = this.obstacles.filter((o) => o.x > -180);
      this.pickups = this.pickups.filter((p) => p.x > -60 && !p.taken);

      if (this.opts.mode === "time") {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.finish();
        }
      }
      // chaos modifier rotation
      if (this.opts.mode === "chaos") {
        const sc = Math.max(...this.birds.map((b) => b.score));
        if (sc >= this.chaosNext) {
          this.chaosNext = sc + 7;
          const pick = CHAOS_LIST[Math.floor(Math.random() * CHAOS_LIST.length)];
          this.chaos = [pick.id];
          this.chaosLabel = pick.label;
          this.texts.push({ x: W / 2, y: H * 0.3, vy: -22, life: 2.2, text: pick.label, color: "#fde047", size: 26 });
          this.flashNow("253,224,71", 0.35);
          this.snd.power();
        }
      }
    }

    // obstacle animation
    for (const o of this.obstacles) {
      if (o.amp) o.gapY = o.baseY + Math.sin(this.time * o.mspeed + o.phase) * o.amp;
      if (o.saw) o.sawAng += dt * 7;
      if (o.kind === "laser") o.laserT += dt;
    }

    // pickups anim
    for (const p of this.pickups) p.t += dt;

    // birds
    for (const b of this.birds) {
      if (!b.alive) {
        b.dyingT += dt;
        if (b.dyingT < 2.4) {
          b.vy += BASE_GRAV * 1.1 * dt;
          b.y += b.vy * dt;
          b.rot = Math.min(Math.PI / 2, b.rot + dt * 5);
          if (b.y > H - GROUND - b.r) {
            b.y = H - GROUND - b.r;
            b.vy = 0;
          }
        }
        continue;
      }
      // powers tick
      for (const [k, v] of b.powers) {
        const nv = v - dt;
        if (nv <= 0) b.powers.delete(k);
        else b.powers.set(k, nv);
      }
      b.r = BIRD_R * (b.powers.has("shrink") ? 0.62 : 1) * (this.chaos.includes("tiny") ? 0.62 : 1) * (this.chaos.includes("giant") ? 1.5 : 1);

      if (this.phase === "ready" || this.phase === "countdown") {
        b.y = b.y0 + Math.sin(this.time * 3 + b.y0) * 9;
        b.rot = Math.sin(this.time * 3) * 0.12;
        b.flapPhase += dt * 9;
        continue;
      }
      if (!running) continue;

      // AI / external controllers
      if (b.cfg.ai) this.aiThink(b, dt, speed);
      if (b.ctrl && this.phase === "running") {
        b.y += (b.ctrlY - b.y) * Math.min(1, dt * 13);
        b.x = W * 0.28 + (b.index === 0 ? 0 : 0);
        b.flapPhase += dt * 8;
      }

      const targetRot = b.ctrl ? Math.max(-0.6, Math.min(1.35, ((b.ctrlY - b.y) / 60) * 0.6)) : 0;
      if (b.ctrl) {
        b.rot += (targetRot - b.rot) * Math.min(1, dt * 9);
      } else {
        const g = BASE_GRAV * this.gravMul * b.gdir;
        b.vy += g * dt;
        const maxFall = 780 * (this.chaos.includes("moon") ? 0.75 : 1);
        b.vy = Math.max(-820, Math.min(maxFall, b.vy));
        b.y += b.vy * dt;
        b.flapPhase += dt * (10 + Math.abs(b.vy) * 0.008);

        // wind drift
        const wf = this.windForce;
        if (wf) {
          b.x += wf * dt * 0.55;
        }
        const home = W * 0.28;
        b.x += (home - b.x) * Math.min(1, dt * 1.1);
        b.x = Math.max(W * 0.12, Math.min(W * 0.52, b.x));

        const rt = Math.max(-0.6, Math.min(1.35, (b.vy / 620) * 1.25)) * b.gdir;
        b.rot += (rt - b.rot) * Math.min(1, dt * 9);
      }

      // ceiling / floor
      if (b.y < b.r + 2) {
        b.y = b.r + 2;
        if (b.gdir === -1) this.kill(b, "ceiling");
        else b.vy = Math.max(b.vy, 40);
      }
      if (b.y > H - GROUND - b.r) {
        b.y = H - GROUND - b.r;
        if (b.gdir === 1) this.kill(b, "ground");
        else b.vy = Math.min(b.vy, -40);
      }

      // trail particles
      b.trailT -= dt;
      const tid: TrailKind = b.cfg.trailId;
      if (s.particles && tid !== "none" && b.trailT <= 0) {
        b.trailT = tid === "lightning" ? 0.025 : 0.03;
        const tr = TRAILS.find((t) => t.id === tid)!;
        const col = tr.colors[Math.floor(Math.random() * tr.colors.length)];
        const kind: Particle["kind"] =
          tid === "stars" || tid === "galaxy" ? "star"
          : tid === "hearts" ? "heart"
          : tid === "bubbles" || tid === "ice" ? "ring"
          : tid === "lightning" ? "bolt"
          : tid === "leaves" ? "leaf"
          : tid === "runes" ? "rune"
          : tid === "data" || tid === "neon" || tid === "plasma" ? "square"
          : "dot";
        const px = b.x - b.r * 0.95;
        const py = b.y + (Math.random() - 0.5) * b.r * 0.9;
        if (tid === "plasma") {
          this.parts.push({ x: px, y: b.y, vx: -speed * 0.55, vy: Math.sin(this.time * 30 + b.index) * 60, life: 0.42, max: 0.42, size: 4.5 + Math.random() * 3, color: col, kind: "line", grav: 0 });
        } else if (tid === "lightning") {
          let bx = px, by = py;
          for (let i = 0; i < 4; i++) {
            const nx2 = bx - 9 - Math.random() * 8;
            const ny2 = by + (Math.random() - 0.5) * 22;
            this.parts.push({ x: bx, y: by, vx: nx2 - bx, vy: ny2 - by, life: 0.16, max: 0.16, size: 1.8, color: i === 0 ? "#ffffff" : col, kind: "linto", grav: 0 });
            bx = nx2; by = ny2;
          }
        } else if (tid === "neon") {
          this.parts.push({ x: px, y: py, vx: -speed * 0.62, vy: 0, life: 0.7, max: 0.7, size: 3.2 + Math.random() * 2.6, color: col, kind: "glowsq", grav: 0 });
        } else if (tid === "galaxy") {
          this.parts.push({ x: px, y: py, vx: -speed * 0.3 - Math.random() * 30, vy: (Math.random() - 0.5) * 36, life: 0.8, max: 0.8, size: 1.5 + Math.random() * 3.5, color: col, kind: "glowdot", grav: 0 });
        } else if (tid === "runes") {
          const glyphs = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᛟ", "✧", "◆", "☽", "◬", "Ω", "∆"];
          this.parts.push({ x: px, y: py, vx: -speed * 0.28 - Math.random() * 24, vy: -30 - Math.random() * 40, life: 0.95, max: 0.95, size: 9 + Math.random() * 5, color: col, kind: "rune", grav: 0, glyph: glyphs[Math.floor(Math.random() * glyphs.length)] });
        } else if (tid === "data") {
          this.parts.push({ x: px, y: py, vx: -speed * 0.5, vy: (Math.random() - 0.5) * 30, life: 0.7, max: 0.7, size: 3 + Math.random() * 3, color: col, kind: "glowsq", grav: 0 });
          if (Math.random() < 0.3) this.parts.push({ x: px, y: py + 8, vx: -speed * 0.45, vy: 0, life: 0.5, max: 0.5, size: 8, color: col, kind: "glyph", grav: 0, glyph: Math.random() < 0.5 ? "0" : "1" });
        } else if (tid === "leaves") {
          this.parts.push({ x: px, y: py, vx: -speed * 0.3 - Math.random() * 40, vy: 20 + Math.random() * 40, life: 0.9, max: 0.9, size: 3.5 + Math.random() * 3, color: col, kind: "leaf", grav: 60 });
        } else if (tid === "fire") {
          this.parts.push({ x: px, y: py - 2, vx: -speed * 0.35 - Math.random() * 40, vy: -70 - Math.random() * 60, life: 0.5, max: 0.5, size: 3 + Math.random() * 5, color: col, kind: "glowdot", grav: -160 });
        } else {
          const legacy: Particle["kind"] = kind === "star" || kind === "heart" ? kind : kind === "ring" ? "ring" : "dot";
          this.parts.push({
            x: px, y: py,
            vx: -speed * 0.35 - Math.random() * 40, vy: (Math.random() - 0.5) * 50 - (tid === "bubbles" ? 20 : 0),
            life: 0.55, max: 0.55, size: 3 + Math.random() * 4, color: col, kind: legacy, grav: tid === "bubbles" ? -60 : 0,
          });
        }
      }
      if (s.particles && tid === "neon" && Math.random() < 0.15) {
        const tr = TRAILS.find((t) => t.id === "neon")!;
        this.parts.push({ x: b.x - b.r, y: b.y + (Math.random() - 0.5) * b.r * 2, vx: -speed * 0.6, vy: 0, life: 0.9, max: 0.9, size: 1.6, color: tr.colors[Math.floor(Math.random() * 3)], kind: "glowdot", grav: 0 });
      }

      // collisions & scoring
      this.collide(b);
    }

    // particles
    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
    }
    if (this.parts.length > 420) this.parts.splice(0, this.parts.length - 420);
    this.parts = this.parts.filter((p) => p.life > 0);

    for (const t of this.texts) {
      t.life -= dt;
      t.y += t.vy * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);

    // weather
    const wdir = this.map.weather;
    for (const w of this.weather) {
      if (wdir === "bubbles") {
        w.y -= w.v * dt * 0.5;
        w.x += Math.sin(this.time * 2 + w.y * 0.02) * 12 * dt;
        if (w.y < -10) { w.y = H + 10; w.x = Math.random() * W; }
      } else if (wdir === "stars") {
        w.x -= w.v * dt * 0.12;
        if (w.x < -6) { w.x = W + 6; w.y = Math.random() * H; }
      } else if (wdir === "meteors") {
        w.x -= w.v * dt * 2.2;
        w.y += w.v * dt * 1.1;
        if (w.x < -30 || w.y > H + 30) { w.x = W + Math.random() * 200; w.y = -20 - Math.random() * 100; w.s = 1 + Math.random() * 2.6; }
      } else if (wdir === "cherry") {
        w.x += Math.sin(this.time * 1.4 + w.y * 0.03) * 34 * dt - w.v * dt * 0.25;
        w.y += w.v * dt * 0.55;
        w.a += dt * 3;
        if (w.y > H + 10 || w.x < -14) { w.y = -10 - Math.random() * 60; w.x = Math.random() * (W + 40); }
      } else {
        const vx = wdir === "snow" ? Math.sin(this.time + w.y * 0.02) * 26 : wdir === "sand" ? -190 : wdir === "rain" ? -70 : -26;
        w.x += vx * dt;
        w.y += w.v * dt * (wdir === "rain" ? 4.2 : wdir === "snow" ? 0.7 : wdir === "embers" ? -1.1 : 1.1);
        if (w.y > H + 12 || w.y < -12 || w.x < -12) { w.y = wdir === "embers" ? H + 10 : -10; w.x = Math.random() * (W + 120); }
      }
    }

    if (this.map.weather === "rain" && Math.random() < dt * 0.35) {
      this.lightning = 0.32;
    }
    this.lightning = Math.max(0, this.lightning - dt);
    this.shake = Math.max(0, this.shake - dt * 2.6);
    this.flash = Math.max(0, this.flash - dt * 2.2);

    // end condition
    if (running && !anyAlive && !this.ended) {
      const allDown = this.birds.every((b) => !b.alive && b.dyingT > 0.85);
      if (allDown) this.finish();
    }
  }

  private aiThink(b: Bird, dt: number, speed: number) {
    b.aiCool -= dt;
    const lvl = b.cfg.aiLevel ?? 1;
    const skill = [0.55, 0.78, 0.92, 1][Math.max(0, Math.min(3, lvl))];
    // find next obstacle
    let target = H / 2;
    let dist = 9999;
    for (const o of this.obstacles) {
      const right = o.x + o.w;
      if (right > b.x - 10) {
        const d = o.x - b.x;
        if (d < dist) { dist = d; target = o.gapY; }
      }
    }
    // coin greed
    if (skill > 0.7) {
      for (const p of this.pickups) {
        if (p.x > b.x && p.x - b.x < 120 && Math.abs(p.y - target) < 70) target = target * 0.6 + p.y * 0.4;
      }
    }
    const noise = (1 - skill) * 70;
    const aim = target + b.aiBias * (1 - skill) + Math.sin(this.time * 3.1) * noise * 0.4;
    const lead = Math.max(0, dist) / Math.max(60, speed);
    const predicted = b.y + b.vy * Math.min(0.28, lead) * 0.9;
    const threshold = 6 + (1 - skill) * 40;
    if (b.aiCool <= 0 && predicted > aim + threshold && b.vy * b.gdir > -120) {
      this.doFlap(b);
      b.aiCool = 0.1 + (1 - skill) * 0.16;
      if (Math.random() < (1 - skill) * 0.06) b.aiBias = (Math.random() - 0.5) * 60;
    }
  }

  private circleRect(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  private collide(b: Bird) {
    const idx = this.birds.indexOf(b);
    const hitR = b.r * 0.86;
    if (b.ctrl) {
      // network-controlled bird: score-only logic is skipped; nothing to do
      return;
    }
    for (const o of this.obstacles) {
      // scoring
      if (!o.scored[idx] && o.x + o.w < b.x - b.r * 0.4) {
        o.scored[idx] = true;
        if (this.startScore > 0) {
          b.score += this.startScore;
          this.startScore = 0;
        }
        const dbl = b.powers.has("double") ? 2 : 1;
        b.score += dbl;
        const off = Math.abs(b.y - o.gapY);
        if (off < o.gap * 0.14) {
          b.score += 1;
          b.perfects++;
          b.combo++;
          this.snd.perfect();
          this.texts.push({ x: b.x + 40, y: b.y - 26, vy: -48, life: 0.9, text: "PARFAIT +1", color: "#fde047", size: 17 });
          this.burst(b.x, b.y, 12, "#fde047");
        } else {
          b.combo = 0;
          this.snd.score();
        }
        if (this.opts.mods?.flip) {
          b.gdir = b.gdir === 1 ? -1 : 1;
          b.vy = 0;
          this.flashNow("167,139,250", 0.3);
        } else if (this.chaos.includes("flip")) {
          b.gdir = b.gdir === 1 ? -1 : 1;
          b.vy = 0;
        }
        if (this.opts.mode === "time") {
          this.timeLeft += 0.55;
        }
        if (this.opts.goldTarget && b.score >= this.opts.goldTarget) {
          this.texts.push({ x: W / 2, y: H * 0.34, vy: -20, life: 1.6, text: "CLEAR !", color: "#4ade80", size: 34 });
          this.finish();
          return;
        }
      }
      if (o.x > b.x + 90 || o.x + o.w < b.x - 90) continue;
      if (o.kind === "laser") {
        const on = Math.sin(o.laserT * 2.6) > -0.25;
        if (!on) continue;
        if (this.circleRect(b.x, b.y, hitR, o.x, 0, o.w, o.gapY - o.gap / 2)) return this.kill(b, "laser");
        if (this.circleRect(b.x, b.y, hitR, o.x, o.gapY + o.gap / 2, o.w, H)) return this.kill(b, "laser");
      } else {
        if (this.circleRect(b.x, b.y, hitR, o.x, -200, o.w, o.gapY - o.gap / 2 + 200)) return this.kill(b, "pipe");
        if (this.circleRect(b.x, b.y, hitR, o.x, o.gapY + o.gap / 2, o.w, H)) return this.kill(b, "pipe");
        if (o.saw) {
          const sy = o.gapY - o.gap / 2;
          const sy2 = o.gapY + o.gap / 2;
          const sx = o.x + o.w / 2;
          const sr = 17;
          if ((b.x - sx) ** 2 + (b.y - sy) ** 2 < (sr + hitR) ** 2) return this.kill(b, "saw");
          if ((b.x - sx) ** 2 + (b.y - sy2) ** 2 < (sr + hitR) ** 2) return this.kill(b, "saw");
        }
      }
    }
    // pickups
    const magnet = b.powers.has("magnet");
    for (const p of this.pickups) {
      if (p.taken) continue;
      if (magnet && p.kind === "coin") {
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < 170) {
          p.x += ((b.x - p.x) / d) * 320 * 0.016;
          p.y += ((b.y - p.y) / d) * 320 * 0.016;
        }
      }
      const rr = p.kind === "coin" ? 13 : 17;
      if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < (rr + b.r) ** 2) {
        p.taken = true;
        if (p.kind === "coin") {
          b.coins++;
          this.snd.coin();
          this.burst(p.x, p.y, 8, "#fbbf24");
          if (this.opts.mode === "time") this.timeLeft += 1;
        } else {
          b.powerUsed++;
          const info = POWER_INFO[p.kind];
          if (p.kind === "shield") {
            b.shield = true;
            this.snd.shield();
          } else {
            b.powers.set(p.kind, info.dur);
            this.snd.power();
          }
          this.texts.push({ x: p.x, y: p.y - 10, vy: -50, life: 1.1, text: info.name.toUpperCase(), color: info.color, size: 18 });
          this.burst(p.x, p.y, 16, info.color);
          this.flashNow("255,255,255", 0.22);
        }
      }
    }
  }

  private kill(b: Bird, _reason: string) {
    if (!b.alive) return;
    if (b.shield) {
      b.shield = false;
      b.vy = BASE_FLAP * 0.75 * b.gdir;
      this.burst(b.x, b.y, 26, "#38bdf8");
      this.flashNow("56,189,248", 0.5);
      this.shake = 0.5;
      this.snd.shield();
      this.texts.push({ x: b.x, y: b.y - 34, vy: -40, life: 1, text: "BOUCLIER !", color: "#38bdf8", size: 18 });
      // brief invulnerability by nudging bird out of pipe
      const o = this.obstacles.find((ob) => ob.x < b.x + 60 && ob.x + ob.w > b.x - 60);
      if (o) b.y = o.gapY;
      return;
    }
    b.alive = false;
    b.dyingT = 0;
    b.dead0 = this.time;
    b.vy = -180 * b.gdir;
    this.shake = this.opts.settings.shake ? 0.85 : 0;
    this.flashNow("255,80,80", 0.55);
    this.burst(b.x, b.y, 28, b.skin.body);
    this.snd.hit();
    setTimeout(() => this.snd.die(), 120);
  }

  private burst(x: number, y: number, n: number, color: string) {
    if (!this.opts.settings.particles) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 260;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6 + Math.random() * 0.4, max: 1, size: 2 + Math.random() * 4, color, kind: "dot", grav: 420 });
    }
  }

  private flashNow(color: string, amt: number) {
    if (!this.opts.settings.particles) return;
    this.flashColor = color;
    this.flash = amt;
  }

  /** Set countdown directly (netcode onboarding). */
  setCountdown(v: number) {
    this.phase = "countdown";
    this.countdown = v;
  }

  get playerCount() {
    return this.birds.length;
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    this.phase = "over";
    const scores = this.birds.map((b) => b.score);
    let winner = 0;
    if (this.birds.length > 1) {
      if (scores[0] === scores[1]) {
        // tie-break: survivor
        winner = this.birds[0].dead0 === this.birds[1].dead0 ? -1 : this.birds[0].dead0 > this.birds[1].dead0 ? 0 : 1;
      } else winner = scores[0] > scores[1] ? 0 : 1;
    }
    this.opts.onEnd({
      scores,
      coins: this.birds.map((b) => b.coins),
      winner,
      best: Math.max(...scores),
      perfects: this.birds.reduce((a, b) => a + b.perfects, 0),
      powerUsed: this.birds.reduce((a, b) => a + b.powerUsed, 0),
    });
  }

  // ------------------------------------------------------------ draw
  private draw() {
    const ctx = this.ctx;
    const s = this.opts.settings;
    ctx.save();
    if (this.shake > 0 && s.shake) {
      const m = this.shake * 12;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    drawBackground(ctx, this.map, W, H, this.scroll, this.time, s.parallax);

    if (this.lightning > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.lightning})`;
      ctx.fillRect(0, 0, W, H);
    }

    // weather
    if (s.particles && this.map.weather !== "none") {
      const wk = this.map.weather;
      for (const w of this.weather) {
        ctx.globalAlpha = w.a;
        if (wk === "rain") {
          ctx.strokeStyle = "#bae6fd";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(w.x, w.y);
          ctx.lineTo(w.x - 5, w.y + 16);
          ctx.stroke();
        } else if (wk === "matrix") {
          ctx.fillStyle = "#22d3ee";
          ctx.fillRect(w.x, w.y, 2, 12);
        } else if (wk === "embers") {
          ctx.fillStyle = "#fb923c";
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.s, 0, Math.PI * 2);
          ctx.fill();
        } else if (wk === "bubbles") {
          ctx.strokeStyle = "rgba(255,255,255,.8)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.s * 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (wk === "leaves") {
          ctx.fillStyle = "#fb923c";
          ctx.save();
          ctx.translate(w.x, w.y);
          ctx.rotate(this.time * 2 + w.x);
          ctx.fillRect(-w.s, -w.s / 2, w.s * 2, w.s);
          ctx.restore();
        } else if (wk === "sand") {
          ctx.fillStyle = "#fde68a";
          ctx.fillRect(w.x, w.y, w.s * 3, 1.4);
        } else if (wk === "meteors") {
          // head glow + tail
          const mvx = -w.v * 2.2 * 0.016, mvy = w.v * 1.1 * 0.016;
          const ln = Math.hypot(mvx, mvy) || 1;
          const ux = mvx / ln, uy = mvy / ln;
          const tail = 26 + w.s * 10;
          const tg = ctx.createLinearGradient(w.x, w.y, w.x - ux * tail, w.y - uy * tail);
          tg.addColorStop(0, "rgba(255,255,255,.9)");
          tg.addColorStop(0.3, "rgba(167,139,250,.6)");
          tg.addColorStop(1, "rgba(167,139,250,0)");
          ctx.strokeStyle = tg;
          ctx.lineWidth = w.s;
          ctx.beginPath();
          ctx.moveTo(w.x, w.y);
          ctx.lineTo(w.x - ux * tail, w.y - uy * tail);
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.s, 0, Math.PI * 2);
          ctx.fill();
        } else if (wk === "cherry") {
          ctx.fillStyle = "#fecdd3";
          ctx.save();
          ctx.translate(w.x, w.y);
          ctx.rotate(w.a);
          ctx.beginPath();
          ctx.ellipse(0, 0, w.s * 1.5, w.s * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(251,113,133,.65)";
          ctx.beginPath();
          ctx.ellipse(w.s * 0.4, 0, w.s * 0.32, w.s * 0.22, 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // obstacles
    for (const o of this.obstacles) this.drawObstacle(o);

    // pickups
    for (const p of this.pickups) this.drawPickup(p);

    // particles
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      switch (p.kind) {
        case "ring": {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case "star": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 6);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const ang = (Math.PI / 5) * i - Math.PI / 2;
            const rad = i % 2 === 0 ? p.size : p.size * 0.45;
            ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(ang) * rad, Math.sin(ang) * rad);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case "heart": {
          ctx.save();
          ctx.translate(p.x, p.y);
          const hs = p.size;
          ctx.beginPath();
          ctx.moveTo(0, hs * 0.6);
          ctx.bezierCurveTo(-hs * 1.2, -hs * 0.2, -hs * 0.5, -hs, 0, -hs * 0.35);
          ctx.bezierCurveTo(hs * 0.5, -hs, hs * 1.2, -hs * 0.2, 0, hs * 0.6);
          ctx.fill();
          ctx.restore();
          break;
        }
        case "glowdot": {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.4);
          g.addColorStop(0, p.color);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.globalAlpha = a * 0.9;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.globalAlpha = a * 0.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.8, p.size * 0.42), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "glowsq": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 5);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;
        }
        case "line": {
          // plasma: trailing sine segment looking backward
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          for (let k = 1; k <= 4; k++) {
            ctx.lineTo(p.x - k * 7, p.y + Math.sin(this.time * 26 - k * 1.5) * (3 + k * 1.8));
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;
        }
        case "linto": {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.shadowColor = "#fef08a";
          ctx.shadowBlur = 9;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx, p.y + p.vy);
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;
        }
        case "bolt":
          break;
        case "leaf": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(this.time * 4 + p.x * 0.05);
          ctx.globalAlpha = a * 0.95;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a * 0.6;
          ctx.strokeStyle = "rgba(0,0,0,.3)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(p.size, 0);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case "rune": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(this.time * 3 + p.x) * 0.5);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.font = `bold ${p.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.glyph ?? "✧", 0, 0);
          ctx.restore();
          ctx.textBaseline = "alphabetic";
          break;
        }
        case "glyph": {
          ctx.save();
          ctx.font = `bold ${p.size}px monospace`;
          ctx.textAlign = "center";
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.fillText(p.glyph ?? "1", p.x, p.y);
          ctx.restore();
          break;
        }
        case "square": {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 4);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;
        }
        default: {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // ground
    this.drawGround();

    // birds
    for (const b of this.birds) {
      if (b.powers.has("magnet")) {
        ctx.strokeStyle = "rgba(244,63,94,.28)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 170 * (0.9 + 0.1 * Math.sin(this.time * 6)), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.save();
      if (b.gdir === -1) {
        ctx.translate(b.x, b.y);
        ctx.scale(1, -1);
        ctx.translate(-b.x, -b.y);
      }
      drawCreature(ctx, b.skin, b.x, b.y, b.r, b.rot, b.flapPhase, !b.alive, this.time);
      ctx.restore();
      if (b.shield) {
        ctx.strokeStyle = `rgba(56,189,248,${0.6 + 0.3 * Math.sin(this.time * 8)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(56,189,248,.12)";
        ctx.fill();
      }
      if (s.showHitbox) {
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.86, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (this.birds.length > 1) {
        ctx.fillStyle = b.cfg.color;
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(b.cfg.name, b.x, b.y - b.r - 14);
        ctx.beginPath();
        ctx.arc(b.x, b.y - b.r - 24, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // floating texts
    ctx.textAlign = "center";
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 1.6);
      ctx.font = `bold ${t.size}px system-ui, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,.45)";
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    if (!this.opts.auto) this.drawHud();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(${this.flashColor},${this.flash * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, this.map.dark ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.28)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  private drawObstacle(o: Obstacle) {
    const ctx = this.ctx;
    const m = this.map;
    const topH = o.gapY - o.gap / 2;
    const botY = o.gapY + o.gap / 2;
    const botH = H - GROUND - botY;
    let alpha = 1;
    if (o.invisible) {
      const d = Math.abs(o.x - W * 0.28);
      alpha = Math.max(0.12, Math.min(1, d / 200));
    }
    ctx.globalAlpha = alpha;

    if (o.kind === "laser") {
      const on = Math.sin(o.laserT * 2.6) > -0.25;
      const warn = !on && Math.sin(o.laserT * 2.6) > -0.5;
      const col = on ? "#f43f5e" : warn ? "#fbbf24" : "#475569";
      const draw = (y: number, h: number) => {
        if (h <= 0) return;
        ctx.fillStyle = "#1e293b";
        roundRect(ctx, o.x, y, o.w, h, 4);
        ctx.fill();
        if (on || warn) {
          const g = ctx.createLinearGradient(o.x, 0, o.x + o.w, 0);
          g.addColorStop(0, "rgba(255,255,255,0)");
          g.addColorStop(0.5, col);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.globalAlpha = alpha * (on ? 0.95 : 0.4);
          ctx.fillRect(o.x, y, o.w, h);
          ctx.globalAlpha = alpha;
        }
        ctx.fillStyle = col;
        ctx.fillRect(o.x - 5, y + h - 10, o.w + 10, 10);
        ctx.fillRect(o.x - 5, y, o.w + 10, 10);
      };
      draw(0, topH);
      draw(botY, botH);
      ctx.globalAlpha = 1;
      return;
    }

    const grad = ctx.createLinearGradient(o.x, 0, o.x + o.w, 0);
    grad.addColorStop(0, m.pipeB);
    grad.addColorStop(0.32, m.pipeA);
    grad.addColorStop(0.68, m.pipeA);
    grad.addColorStop(1, m.pipeB);

    const cap = (y: number) => {
      ctx.fillStyle = grad;
      roundRect(ctx, o.x - 6, y, o.w + 12, 24, 5);
      ctx.fill();
      ctx.strokeStyle = m.pipeEdge;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };
    ctx.fillStyle = grad;
    ctx.strokeStyle = m.pipeEdge;
    ctx.lineWidth = 2.5;
    if (topH > 0) {
      ctx.fillRect(o.x, -20, o.w, topH + 20);
      ctx.strokeRect(o.x, -20, o.w, topH + 20);
      cap(topH - 24);
    }
    if (botH > 0) {
      ctx.fillRect(o.x, botY, o.w, botH);
      ctx.strokeRect(o.x, botY, o.w, botH);
      cap(botY);
    }
    // highlight
    ctx.fillStyle = "rgba(255,255,255,.18)";
    if (topH > 0) ctx.fillRect(o.x + 8, 0, 8, topH - 24);
    if (botH > 0) ctx.fillRect(o.x + 8, botY + 24, 8, botH - 24);

    if (o.saw) {
      const sx = o.x + o.w / 2;
      for (const sy of [o.gapY - o.gap / 2, o.gapY + o.gap / 2]) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(o.sawAng);
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const r = i % 2 === 0 ? 18 : 12;
          ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawPickup(p: Pickup) {
    const ctx = this.ctx;
    const bob = Math.sin(p.t * 4) * 4;
    if (p.kind === "coin") {
      const sq = Math.abs(Math.cos(p.t * 3));
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.ellipse(0, 0, 11 * (0.25 + sq * 0.75), 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * (0.25 + sq * 0.75), 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b45309";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (sq > 0.55) ctx.fillText("$", 0, 0.5);
      ctx.restore();
      ctx.textBaseline = "alphabetic";
      return;
    }
    const info = POWER_INFO[p.kind as PowerKind];
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(Math.sin(p.t * 2) * 0.16);
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(15,23,42,.85)";
    roundRect(ctx, -16, -16, 32, 32, 9);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2.5;
    roundRect(ctx, -16, -16, 32, 32, 9);
    ctx.stroke();
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(info.icon, 0, 1);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }

  private drawGround() {
    const ctx = this.ctx;
    const m = this.map;
    const y = H - GROUND;
    const g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, m.ground);
    g.addColorStop(1, m.groundDark);
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, GROUND);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(0, y, W, 6);
    const off = this.scroll % 48;
    ctx.fillStyle = "rgba(255,255,255,.12)";
    for (let x = -off; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x + 24, y + 6);
      ctx.lineTo(x + 16, H);
      ctx.lineTo(x - 8, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawHud() {
    const ctx = this.ctx;
    const big = this.opts.settings.bigHud;
    ctx.textAlign = "center";
    if (this.birds.length === 1) {
      const b = this.birds[0];
      ctx.font = `bold ${big ? 76 : 62}px system-ui, sans-serif`;
      ctx.lineWidth = 8;
      ctx.strokeStyle = "rgba(0,0,0,.5)";
      ctx.strokeText(String(b.score), W / 2, 96);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(b.score), W / 2, 96);
    } else {
      this.birds.forEach((b, i) => {
        const x = i === 0 ? W * 0.24 : W * 0.76;
        ctx.font = "bold 40px system-ui, sans-serif";
        ctx.lineWidth = 6;
        ctx.strokeStyle = "rgba(0,0,0,.5)";
        ctx.strokeText(String(b.score), x, 74);
        ctx.fillStyle = b.alive ? b.cfg.color : "rgba(255,255,255,.4)";
        ctx.fillText(String(b.score), x, 74);
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,.8)";
        ctx.fillText(b.cfg.name + (b.alive ? "" : " 💀"), x, 94);
      });
    }

    if (this.opts.mode === "time") {
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.fillStyle = this.timeLeft < 10 ? "#f87171" : "#fff";
      ctx.strokeStyle = "rgba(0,0,0,.5)";
      ctx.lineWidth = 5;
      const txt = `⏱ ${this.timeLeft.toFixed(1)}s`;
      ctx.strokeText(txt, W / 2, 130);
      ctx.fillText(txt, W / 2, 130);
    }

    if (this.phase === "ready") {
      ctx.font = "bold 26px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.strokeStyle = "rgba(0,0,0,.45)";
      ctx.lineWidth = 6;
      const y = H * 0.62 + Math.sin(this.time * 4) * 5;
      ctx.strokeText("TAPE POUR VOLER", W / 2, y);
      ctx.fillText("TAPE POUR VOLER", W / 2, y);
      ctx.font = "15px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.fillText("Espace / Clic / Tap", W / 2, y + 28);
    }

    if (this.phase === "countdown" && this.countdown > 0) {
      const n = Math.ceil(this.countdown - 0.2);
      const frac = 1 - ((this.countdown - 0.2) % 1);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * (1 - frac);
      ctx.font = `bold ${90 + frac * 30}px system-ui, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "rgba(0,0,0,.5)";
      ctx.lineWidth = 9;
      const txt = n > 0 ? String(n) : "GO !";
      ctx.strokeText(txt, W / 2, H / 2);
      ctx.fillText(txt, W / 2, H / 2);
      ctx.restore();
    }

    // power indicators
    this.birds.forEach((b, i) => {
      let px = this.birds.length === 1 ? 14 : i === 0 ? 14 : W - 14 - 0;
      const py = H - GROUND - 40;
      const list = [...b.powers.entries()];
      if (b.shield) list.unshift(["shield", 1]);
      list.forEach(([k, v], j) => {
        const info = POWER_INFO[k];
        const x = this.birds.length === 1 || i === 0 ? px + j * 40 : px - 34 - j * 40;
        ctx.fillStyle = "rgba(15,23,42,.65)";
        roundRect(ctx, x, py, 34, 34, 8);
        ctx.fill();
        ctx.strokeStyle = info.color;
        ctx.lineWidth = 2;
        roundRect(ctx, x, py, 34, 34, 8);
        ctx.stroke();
        ctx.font = "15px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(info.icon, x + 17, py + 16);
        if (k !== "shield") {
          ctx.fillStyle = info.color;
          ctx.fillRect(x + 3, py + 29, Math.max(0, (v / info.dur)) * 28, 3);
        }
      });
      px += 0;
    });
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";

    // coins
    if (this.opts.settings.coinsOn) {
      const total = this.birds.reduce((a, b) => a + b.coins, 0);
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#fcd34d";
      ctx.strokeStyle = "rgba(0,0,0,.45)";
      ctx.lineWidth = 4;
      ctx.strokeText(`🪙 ${total}`, W - 14, 32);
      ctx.fillText(`🪙 ${total}`, W - 14, 32);
      ctx.textAlign = "center";
    }

    if (this.opts.settings.showFps) {
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText(`${this.fps.toFixed(0)} fps`, 12, 22);
      ctx.textAlign = "center";
    }
    if (this.opts.mode === "chaos" && this.chaosLabel) {
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.strokeStyle = "rgba(0,0,0,.5)";
      ctx.lineWidth = 4;
      ctx.strokeText(this.chaosLabel, W / 2, H - GROUND - 12);
      ctx.fillText(this.chaosLabel, W / 2, H - GROUND - 12);
    }
  }

  // ------------------------------------------------------------ loop
  private loop(t: number) {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.lastT) this.lastT = t;
    let dt = (t - this.lastT) / 1000;
    this.lastT = t;
    if (dt > 0.1) dt = 0.1;
    this.fpsAcc += dt;
    this.fpsN++;
    if (this.fpsAcc > 0.5) {
      this.fps = this.fpsN / this.fpsAcc;
      this.fpsAcc = 0;
      this.fpsN = 0;
    }

    if (this.phase !== "paused" && this.phase !== "over") {
      this.acc += dt;
      const fixed = 1 / 120;
      let guard = 0;
      while (this.acc >= fixed && guard++ < 12) {
        this.step(fixed);
        this.acc -= fixed;
      }
    }
    this.draw();

    this.tickAcc += dt;
    if (this.tickAcc > 0.1) {
      this.tickAcc = 0;
      this.opts.onTick({
        phase: this.phase,
        countdown: this.countdown,
        timeLeft: this.timeLeft,
        chaosLabel: this.chaosLabel,
        fps: this.fps,
        players: this.birds.map((b) => ({
          score: b.score,
          coins: b.coins,
          alive: b.alive,
          combo: b.combo,
          powers: [...b.powers.entries()].map(([kind, left]) => ({ kind, left })),
        })),
      });
    }
  }
}
