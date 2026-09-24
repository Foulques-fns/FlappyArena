import { useCallback, useEffect, useRef, useState } from "react";
import { FlappyEngine, H, W, type Mode, type PlayerCfg, type Result, type Snapshot } from "../game/engine";
import { LEVELS, POWER_INFO, type Level } from "../game/data";
import { checkUnlocks, setProfile, useProfile, type Settings } from "../game/store";
import { setVolumes, sfx, startMusic, stopMusic } from "../game/audio";
import { Btn, Coin, Panel, Stars } from "./UI";
import { cn } from "../utils/cn";

interface Props {
  mode: Mode;
  mapId: string;
  settings: Settings;
  players: PlayerCfg[];
  level?: Level;
  duelRounds?: number;
  onExit: () => void;
  onLevel: (lvl: Level) => void;
}

const MODE_LABEL: Record<Mode, string> = {
  classic: "Classique",
  level: "Campagne",
  duel: "Duel",
  time: "Contre-la-montre",
  chaos: "Chaos",
};

export default function GameScreen({ mode, mapId, settings, players, level, duelRounds = 3, onExit, onLevel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FlappyEngine | null>(null);
  const [profile, updateProfile] = useProfile();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [paused, setPaused] = useState(false);
  const [rounds, setRounds] = useState<[number, number]>([0, 0]);
  const [roundNo, setRoundNo] = useState(1);
  const [unlocks, setUnlocks] = useState<{ newAch: string[]; newSkins: string[] } | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [earned, setEarned] = useState(0);
  const [starsGot, setStarsGot] = useState(0);

  const needed = Math.ceil(duelRounds / 2);

  const handleEnd = useCallback(
    (r: Result) => {
      const best = r.best;
      let isBest = false;
      const coinsGain = r.coins.reduce((a, b) => a + b, 0) + Math.floor(best / 2);
      setEarned(coinsGain);

      if (mode === "duel") {
        setRounds((prev) => {
          const next: [number, number] = [...prev] as [number, number];
          if (r.winner === 0) next[0]++;
          else if (r.winner === 1) next[1]++;
          return next;
        });
      }

      setProfile((prof) => {
        const np = { ...prof };
        np.coins += coinsGain;
        np.totalCoins += coinsGain;
        np.games += 1;
        np.perfects += r.perfects;
        np.powerUsed += r.powerUsed;
        if (mode === "classic" && best > np.bestClassic) { np.bestClassic = best; isBest = true; }
        if (mode === "time" && best > np.bestTimeAttack) { np.bestTimeAttack = best; isBest = true; }
        if (mode === "chaos" && best > np.bestChaos) { np.bestChaos = best; isBest = true; }
        if (mode === "level" && level) {
          const prevL = np.levels[level.id] ?? { best: 0, stars: 0, done: false };
          const sc = r.scores[0];
          let st = 0;
          if (sc >= level.stars[2]) st = 3;
          else if (sc >= level.stars[1]) st = 2;
          else if (sc >= level.stars[0]) st = 1;
          setStarsGot(st);
          np.levels = {
            ...np.levels,
            [level.id]: { best: Math.max(prevL.best, sc), stars: Math.max(prevL.stars, st), done: prevL.done || sc >= level.target },
          };
        }
        if (mode === "duel") {
          np.duelPlayed += 1;
          const humanWon = r.winner === 0;
          if (humanWon) np.duelWins += 1;
        }
        np.scores = [{ mode, score: best, date: Date.now() }, ...np.scores].slice(0, 40);
        return np;
      });
      setNewBest(isBest);
      setUnlocks(checkUnlocks());
      setResult(r);
      if (mode === "duel") {
        if (r.winner === 0) sfx.win();
        else sfx.lose();
      } else if (mode === "level" && r.scores[0] >= level!.target) sfx.win();
      else sfx.lose();
    },
    [mode, level],
  );

  // mount engine
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const eng = new FlappyEngine(cv, {
      mode,
      mapId,
      settings,
      players,
      mods: level?.mods,
      goldTarget: level ? level.stars[2] : undefined,
      duration: mode === "time" ? 60 : undefined,
      onTick: setSnap,
      onEnd: handleEnd,
    });
    engineRef.current = eng;
    const onResize = () => eng.resize();
    window.addEventListener("resize", onResize);
    if (settings.music > 0) startMusic(false);
    return () => {
      window.removeEventListener("resize", onResize);
      eng.destroy();
      stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mapId, level?.id]);

  // input
  useEffect(() => {
    const flap = (i: number) => engineRef.current?.flap(i);
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Escape") {
        e.preventDefault();
        togglePause();
        return;
      }
      if (result) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          if (mode === "duel" && rounds[0] < needed && rounds[1] < needed) nextRound();
          else retry();
        }
        return;
      }
      if (["Space", "ArrowUp", "KeyW", "KeyZ"].includes(e.code)) {
        e.preventDefault();
        flap(0);
      }
      if (players.length > 1 && ["ArrowDown", "KeyL", "ShiftRight", "Numpad0", "KeyM"].includes(e.code)) {
        e.preventDefault();
        flap(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length, result, paused, rounds, mode]);

  // live-apply settings changed from the pause menu
  useEffect(() => {
    engineRef.current?.setSettings(profile.settings);
    setVolumes(profile.settings.sfx, profile.settings.music);
    if (profile.settings.music <= 0) stopMusic();
    else if (engineRef.current) startMusic(false);
  }, [profile.settings]);

  const togglePause = () => {
    const eng = engineRef.current;
    if (!eng || result) return;
    if (eng.phase === "paused") {
      eng.resume();
      setPaused(false);
    } else {
      eng.pause();
      setPaused(true);
    }
  };

  const retry = () => {
    setResult(null);
    setUnlocks(null);
    setNewBest(false);
    setStarsGot(0);
    engineRef.current?.restart();
  };

  const nextRound = () => {
    setRoundNo((r) => r + 1);
    retry();
  };

  const onPointer = (e: React.PointerEvent) => {
    if (result || paused) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    const humans = players.filter((p) => !p.ai).length;
    if (players.length > 1 && humans > 1) engineRef.current?.flap(rel < 0.5 ? 0 : 1);
    else engineRef.current?.flap(0);
  };

  const p0 = snap?.players[0];
  const matchOver = mode === "duel" && (rounds[0] >= needed || rounds[1] >= needed);
  const levelPassed = mode === "level" && level && result && result.scores[0] >= level.target;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-950 p-2 sm:p-4">
      {/* top bar */}
      <div className="mb-2 flex w-full max-w-[520px] items-center justify-between gap-2">
        <Btn variant="ghost" size="sm" onClick={onExit}>
          ← Menu
        </Btn>
        <div className="flex items-center gap-2 text-center">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-sky-300">
            {MODE_LABEL[mode]}
            {level ? ` · N°${level.id} ${level.name}` : ""}
            {mode === "duel" ? ` · Manche ${roundNo}` : ""}
          </span>
        </div>
        <Btn variant="ghost" size="sm" onClick={togglePause}>
          {paused ? "▶" : "⏸"}
        </Btn>
      </div>

      {mode === "duel" && (
        <div className="mb-2 flex w-full max-w-[520px] items-center justify-center gap-3 text-xs font-black">
          <span style={{ color: players[0].color }}>{players[0].name} {rounds[0]}</span>
          <span className="text-slate-500">— BO{duelRounds} —</span>
          <span style={{ color: players[1].color }}>{rounds[1]} {players[1].name}</span>
        </div>
      )}

      {mode === "level" && level && (
        <div className="mb-2 flex w-full max-w-[520px] items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
          <span>🎯 {level.target}</span>
          <span className="text-amber-300">★ {level.stars[0]}</span>
          <span className="text-amber-300">★★ {level.stars[1]}</span>
          <span className="text-amber-300">★★★ {level.stars[2]}</span>
          <span className="hidden sm:inline">· {level.hint}</span>
        </div>
      )}

      <div
        className="relative touch-none overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10"
        style={{
          aspectRatio: `${W}/${H}`,
          width: "min(520px, calc(100vw - 16px), calc((100dvh - 170px) * 0.6667))",
        }}
        onPointerDown={onPointer}
      >
        <canvas ref={canvasRef} className="h-full w-full" style={{ display: "block" }} />

        {/* pause overlay */}
        {paused && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 p-4 backdrop-blur-sm">
            <h2 className="text-3xl font-black text-white">PAUSE</h2>
            <div className="flex flex-col gap-2">
              <Btn onClick={togglePause} size="lg">
                ▶ Reprendre
              </Btn>
              <Btn variant="ghost" onClick={retry}>
                ↻ Recommencer
              </Btn>
              <Btn variant="ghost" onClick={onExit}>
                ⌂ Menu principal
              </Btn>
            </div>
            <div className="mt-2 w-full max-w-[260px] rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
              <p className="mb-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Options rapides</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { k: "sfx" as const, on: profile.settings.sfx > 0, label: "🔊 Sons" },
                  { k: "music" as const, on: profile.settings.music > 0, label: "🎵 Musique" },
                  { k: "particles" as const, on: profile.settings.particles, label: "✨ Particules" },
                  { k: "showHitbox" as const, on: profile.settings.showHitbox, label: "🎯 Hitbox" },
                ].map((o) => (
                  <button
                    key={o.k}
                    onClick={() =>
                      updateProfile((pr) => ({
                        ...pr,
                        settings: {
                          ...pr.settings,
                          [o.k]: o.k === "sfx" ? (o.on ? 0 : 0.7) : o.k === "music" ? (o.on ? 0 : 0.35) : !o.on,
                        },
                      }))
                    }
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-[11px] font-black ring-1 transition",
                      o.on ? "bg-sky-500/25 text-sky-200 ring-sky-400/40" : "bg-white/5 text-slate-400 ring-white/10",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* game over */}
        {result && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
            <Panel className="w-full max-w-sm animate-[pop_.28s_ease-out]">
              {mode === "duel" ? (
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {matchOver ? "Fin du match" : `Manche ${roundNo}`}
                  </p>
                  <h2 className="mt-1 text-3xl font-black text-white">
                    {result.winner === -1 ? "Égalité !" : `${players[result.winner].name} gagne !`}
                  </h2>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {players.map((pl, i) => (
                      <div key={i} className={cn("rounded-2xl p-3 ring-1", result.winner === i ? "bg-amber-400/15 ring-amber-400/40" : "bg-white/5 ring-white/10")}>
                        <p className="text-xs font-bold" style={{ color: pl.color }}>{pl.name}</p>
                        <p className="text-3xl font-black text-white">{result.scores[i]}</p>
                        <p className="text-[11px] text-slate-400">🪙 {result.coins[i]}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-300">
                    Score du match : {rounds[0]} — {rounds[1]}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {matchOver ? (
                      <>
                        <Btn variant="gold" size="lg" onClick={() => { setRounds([0, 0]); setRoundNo(1); retry(); }}>
                          🔁 Revanche
                        </Btn>
                        <Btn variant="ghost" onClick={onExit}>⌂ Menu</Btn>
                      </>
                    ) : (
                      <>
                        <Btn size="lg" onClick={nextRound}>Manche suivante →</Btn>
                        <Btn variant="ghost" onClick={onExit}>⌂ Abandonner</Btn>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {mode === "level" && (
                    <>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Niveau {level!.id}</p>
                      <h2 className={cn("mt-1 text-3xl font-black", levelPassed ? "text-emerald-400" : "text-rose-400")}>
                        {levelPassed ? "RÉUSSI !" : "RATÉ"}
                      </h2>
                      <div className="mt-2 flex justify-center">
                        <Stars n={starsGot} size={34} />
                      </div>
                    </>
                  )}
                  {mode !== "level" && (
                    <>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{MODE_LABEL[mode]}</p>
                      <h2 className="mt-1 text-3xl font-black text-white">{newBest ? "NOUVEAU RECORD !" : "Partie terminée"}</h2>
                    </>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Score</p>
                      <p className="text-2xl font-black text-white">{result.scores[0]}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Pièces</p>
                      <p className="text-2xl font-black text-amber-300">+{earned}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Parfaits</p>
                      <p className="text-2xl font-black text-sky-300">{result.perfects}</p>
                    </div>
                  </div>

                  {unlocks && (unlocks.newAch.length > 0 || unlocks.newSkins.length > 0) && (
                    <div className="mt-3 rounded-2xl bg-amber-400/10 p-2 text-xs font-bold text-amber-200 ring-1 ring-amber-400/30">
                      🎉 {unlocks.newAch.length > 0 && `${unlocks.newAch.length} succès débloqué(s)`}
                      {unlocks.newAch.length > 0 && unlocks.newSkins.length > 0 && " · "}
                      {unlocks.newSkins.length > 0 && `${unlocks.newSkins.length} skin secret !`}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2">
                    <Btn size="lg" onClick={retry}>↻ Rejouer</Btn>
                    {mode === "level" && levelPassed && level!.id < LEVELS.length && (
                      <Btn variant="gold" onClick={() => onLevel(LEVELS[level!.id])}>Niveau suivant →</Btn>
                    )}
                    <Btn variant="ghost" onClick={onExit}>⌂ Menu</Btn>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>

      {/* bottom info */}
      <div className="mt-2 flex w-full max-w-[520px] flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Coin amount={profile.coins} />
          {p0 && p0.powers.length > 0 && (
            <span className="flex gap-1">
              {p0.powers.map((pw) => (
                <span key={pw.kind} className="rounded-md bg-white/10 px-1.5 py-0.5" style={{ color: POWER_INFO[pw.kind].color }}>
                  {POWER_INFO[pw.kind].icon} {pw.left.toFixed(1)}s
                </span>
              ))}
            </span>
          )}
        </div>
        <span className="font-bold">
          {players.length > 1 ? "J1 : Espace / gauche · J2 : ↓ ou M / droite" : "Espace · Clic · Tap  |  Échap : pause"}
        </span>
      </div>
    </div>
  );
}
