import { useEffect, useRef } from "react";
import { FlappyEngine, H, W } from "../game/engine";
import { LEVELS, MAPS, SKINS, TRAILS } from "../game/data";
import { useProfile, type Settings } from "../game/store";
import { Btn, Coin, Panel, SkinPreview } from "./UI";
import { cn } from "../utils/cn";
import type { Mode } from "../game/engine";

interface Props {
  onPlay: (m: Mode) => void;
  onShop: () => void;
  onSettings: () => void;
  onStats: () => void;
  onLevels: () => void;
  onDuel: () => void;
}

const MODES: { id: Mode; label: string; emoji: string; desc: string; color: string }[] = [
  { id: "classic", label: "Classique", emoji: "🐤", desc: "Infini. Bat ton record.", color: "from-sky-400 to-sky-600" },
  { id: "level", label: "Campagne", emoji: "🗺️", desc: "30 niveaux, 6 mondes, 90 étoiles.", color: "from-emerald-400 to-emerald-600" },
  { id: "duel", label: "Duel", emoji: "⚔️", desc: "2 joueurs ou contre l'IA.", color: "from-rose-400 to-rose-600" },
  { id: "time", label: "Chrono", emoji: "⏱️", desc: "60 secondes. Marque un max.", color: "from-amber-400 to-amber-600" },
  { id: "chaos", label: "Chaos", emoji: "🌀", desc: "Les règles changent sans arrêt.", color: "from-fuchsia-400 to-violet-600" },
];

function AttractBackground({ mapId, settings }: { mapId: string; settings: Settings }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const quiet: Settings = { ...settings, sfx: 0, music: 0, showFps: false, showHitbox: false, coinsOn: false, powerups: false };
    let eng: FlappyEngine | null = null;
    const make = () => {
      eng?.destroy();
      eng = new FlappyEngine(cv, {
        mode: "classic",
        mapId,
        settings: quiet,
        silent: true,
        auto: true,
        players: [{ skinId: SKINS[Math.floor(Math.random() * SKINS.length)].id, trailId: "sparkle", name: "", ai: true, aiLevel: 2, color: "#fff" }],
        onTick: () => {},
        onEnd: () => {
          setTimeout(() => eng?.restart(), 900);
        },
      });
    };
    make();
    return () => eng?.destroy();
  }, [mapId, settings]);
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 blur-[1px]"
    />
  );
}

export default function MenuScreen({ onPlay, onShop, onSettings, onStats, onLevels, onDuel }: Props) {
  const [p] = useProfile();
  const skin = SKINS.find((s) => s.id === p.skin) ?? SKINS[0];
  const map = MAPS.find((m) => m.id === p.map) ?? MAPS[0];
  const trail = TRAILS.find((t) => t.id === p.trail) ?? TRAILS[0];
  const done = Object.values(p.levels).filter((l) => l.done).length;

  const go = (m: Mode) => {
    if (m === "level") return onLevels();
    if (m === "duel") return onDuel();
    onPlay(m);
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-slate-950">
      <AttractBackground mapId={p.map} settings={p.settings} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/90" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-4 p-4 pb-10">
        <div className="flex items-center justify-between pt-2">
          <Coin amount={p.coins} />
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" onClick={onStats}>📊</Btn>
            <Btn variant="ghost" size="sm" onClick={onSettings}>⚙️</Btn>
          </div>
        </div>

        <div className="mt-2 text-center">
          <h1 className="text-5xl font-black tracking-tighter text-transparent drop-shadow-[0_4px_0_rgba(0,0,0,.35)] sm:text-7xl"
            style={{ backgroundImage: "linear-gradient(180deg,#fde047,#f59e0b 55%,#ea580c)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
            FLAPPY
          </h1>
          <h2 className="-mt-2 text-3xl font-black tracking-[0.35em] text-sky-300 sm:text-4xl">ARENA</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
            {SKINS.length} skins · {TRAILS.length} traînées · {MAPS.length} maps · {LEVELS.length} niveaux
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map((m, i) => (
            <button
              key={m.id}
              onClick={() => go(m.id)}
              className={cn(
                "group relative overflow-hidden rounded-3xl p-4 text-left ring-1 ring-white/15 transition-all hover:scale-[1.02] active:scale-[0.99]",
                "bg-gradient-to-br",
                m.color,
                i === 0 && "sm:col-span-2",
              )}
            >
              <div className="absolute -right-4 -top-4 text-7xl opacity-25 transition-transform group-hover:scale-125">{m.emoji}</div>
              <p className="text-xl font-black text-white drop-shadow">{m.label}</p>
              <p className="text-xs font-bold text-white/80">{m.desc}</p>
              {m.id === "classic" && <p className="mt-1 text-[11px] font-black text-white/90">🏆 Record : {p.bestClassic}</p>}
              {m.id === "level" && <p className="mt-1 text-[11px] font-black text-white/90">✓ {done}/{LEVELS.length} niveaux</p>}
              {m.id === "duel" && <p className="mt-1 text-[11px] font-black text-white/90">⚔️ {p.duelWins} victoires</p>}
              {m.id === "time" && <p className="mt-1 text-[11px] font-black text-white/90">🏆 Record : {p.bestTimeAttack}</p>}
              {m.id === "chaos" && <p className="mt-1 text-[11px] font-black text-white/90">🏆 Record : {p.bestChaos}</p>}
            </button>
          ))}
        </div>

        <button
          onClick={onDuel}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 p-4 text-left ring-1 ring-white/20 transition hover:scale-[1.01]"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl transition-transform group-hover:scale-125">🌐</div>
          <p className="text-lg font-black text-white drop-shadow">DUEL EN LIGNE</p>
          <p className="text-xs font-bold text-white/85">Affronte un ami en direct avec un code — même monde, un seul survivant. ⚡ WebRTC P2P</p>
        </button>

        <Panel className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950/60 p-1 ring-1 ring-white/10">
            <SkinPreview skin={skin} size={58} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{skin.name}</p>
            <p className="truncate text-[11px] text-slate-400">
              Traînée : {trail.name} · Map : {map.name}
            </p>
            <div className="mt-1 flex gap-1">
              {trail.colors.slice(0, 5).map((c, i) => (
                <span key={i} className="h-2 w-2 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </div>
          <Btn variant="gold" onClick={onShop}>🛍️ Boutique</Btn>
        </Panel>

        <p className="mt-auto text-center text-[11px] text-slate-500">
          Espace / Clic / Tap pour voler · Échap pour mettre en pause
        </p>
      </div>
    </div>
  );
}
