import { useState } from "react";
import { MAPS, SKINS } from "../game/data";
import { useProfile } from "../game/store";
import { Btn, MapPreview, Panel, SkinPreview, Slider } from "./UI";
import { cn } from "../utils/cn";

export interface DuelConfig {
  p2Ai: boolean;
  aiLevel: number;
  rounds: number;
  mapId: string;
  skin1: string;
  skin2: string;
  name1: string;
  name2: string;
}

export default function DuelSetup({ onBack, onStart }: { onBack: () => void; onStart: (c: DuelConfig) => void }) {
  const [p, update] = useProfile();
  const [cfg, setCfg] = useState<DuelConfig>({
    p2Ai: true,
    aiLevel: p.settings.aiLevel,
    rounds: p.settings.duelRounds,
    mapId: p.map,
    skin1: p.skin,
    skin2: p.skinP2,
    name1: "Joueur 1",
    name2: "Joueur 2",
  });

  const owned = SKINS.filter((s) => p.ownedSkins.includes(s.id));
  const ownedMaps = MAPS.filter((m) => p.ownedMaps.includes(m.id));
  const set = (patch: Partial<DuelConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const start = () => {
    update((pr) => ({ ...pr, skinP2: cfg.skin2, settings: { ...pr.settings, aiLevel: cfg.aiLevel, duelRounds: cfg.rounds } }));
    onStart({ ...cfg, name2: cfg.p2Ai ? ["Bot Débutant", "Bot Normal", "Bot Expert", "BOT ULTRA"][cfg.aiLevel] : cfg.name2 });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-3 p-4 pb-10">
      <header className="flex items-center justify-between">
        <Btn variant="ghost" size="sm" onClick={onBack}>← Menu</Btn>
        <h1 className="text-xl font-black text-white sm:text-2xl">⚔️ Duel</h1>
        <span className="w-16" />
      </header>

      <Panel>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => set({ p2Ai: false })}
            className={cn("rounded-2xl p-3 text-center ring-1 transition", !cfg.p2Ai ? "bg-sky-500/20 ring-sky-400" : "bg-white/5 ring-white/10 hover:bg-white/10")}
          >
            <div className="text-2xl">👥</div>
            <div className="text-sm font-black text-white">2 Joueurs</div>
            <div className="text-[10px] text-slate-400">Même écran, même clavier</div>
          </button>
          <button
            onClick={() => set({ p2Ai: true })}
            className={cn("rounded-2xl p-3 text-center ring-1 transition", cfg.p2Ai ? "bg-violet-500/20 ring-violet-400" : "bg-white/5 ring-white/10 hover:bg-white/10")}
          >
            <div className="text-2xl">🤖</div>
            <div className="text-sm font-black text-white">Contre l'IA</div>
            <div className="text-[10px] text-slate-400">Un bot impitoyable</div>
          </button>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1] as const).map((i) => {
          const sk = i === 0 ? cfg.skin1 : cfg.skin2;
          const color = i === 0 ? "#38bdf8" : "#fb7185";
          return (
            <Panel key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black" style={{ color }}>
                  {i === 0 ? "Joueur 1" : cfg.p2Ai ? "IA" : "Joueur 2"}
                </p>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  {i === 0 ? "Espace / moitié gauche" : cfg.p2Ai ? "Automatique" : "↓ ou M / moitié droite"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950/50 p-1 ring-1 ring-white/10">
                  <SkinPreview skin={SKINS.find((s) => s.id === sk)!} size={64} />
                </div>
                <div className="flex max-h-24 flex-1 flex-wrap gap-1 overflow-y-auto">
                  {owned.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => set(i === 0 ? { skin1: s.id } : { skin2: s.id })}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[10px] font-bold ring-1 transition",
                        sk === s.id ? "bg-white/20 text-white ring-white/40" : "bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10",
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel className="grid gap-4 sm:grid-cols-2">
        <Slider label="Manches (premier à en gagner la majorité)" value={cfg.rounds} min={1} max={7} step={2} onChange={(v) => set({ rounds: v })} fmt={(v) => `BO${v}`} />
        {cfg.p2Ai && (
          <Slider label="Difficulté de l'IA" value={cfg.aiLevel} min={0} max={3} step={1} onChange={(v) => set({ aiLevel: v })} fmt={(v) => ["Débutant", "Normal", "Expert", "Machine"][v]} />
        )}
      </Panel>

      <Panel>
        <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Arène</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ownedMaps.map((m) => (
            <button key={m.id} onClick={() => set({ mapId: m.id })} className={cn("rounded-xl p-1 ring-1 transition", cfg.mapId === m.id ? "ring-sky-400" : "ring-white/10 hover:ring-white/30")}>
              <MapPreview map={m} className="h-14 w-full" />
              <p className="mt-1 text-[10px] font-bold text-slate-200">{m.name}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Btn size="lg" variant="danger" onClick={start} className="w-full">
        ⚔️ COMBATTRE
      </Btn>
    </div>
  );
}
