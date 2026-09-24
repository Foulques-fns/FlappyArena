import { DEFAULT_SETTINGS, PRESETS, resetProfile, useProfile, type DifficultyPreset, type Settings } from "../game/store";
import { setVolumes, sfx } from "../game/audio";
import { Btn, Panel, Slider, Toggle } from "./UI";
import { cn } from "../utils/cn";

const PRESET_INFO: { id: DifficultyPreset; label: string; emoji: string; desc: string }[] = [
  { id: "chill", label: "Tranquille", emoji: "🌱", desc: "Large, lent, indulgent" },
  { id: "normal", label: "Normal", emoji: "🐤", desc: "L'expérience classique" },
  { id: "hard", label: "Difficile", emoji: "🔥", desc: "Serré et rapide" },
  { id: "insane", label: "Démentiel", emoji: "💀", desc: "Bonne chance..." },
  { id: "custom", label: "Perso", emoji: "🎛️", desc: "Tes propres règles" },
];

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [p, update] = useProfile();
  const s = p.settings;

  const set = (patch: Partial<Settings>) => {
    update((prof) => {
      const next = { ...prof.settings, ...patch };
      setVolumes(next.sfx, next.music);
      return { ...prof, settings: next };
    });
  };

  const applyPreset = (id: DifficultyPreset) => {
    sfx.click();
    if (id === "custom") return set({ preset: "custom" });
    set({ ...PRESETS[id], preset: id });
  };

  const onCustom = (patch: Partial<Settings>) => set({ ...patch, preset: "custom" });

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-3 p-4 pb-10">
      <header className="flex items-center justify-between">
        <Btn variant="ghost" size="sm" onClick={onBack}>← Menu</Btn>
        <h1 className="text-xl font-black text-white sm:text-2xl">⚙️ Paramètres</h1>
        <Btn variant="ghost" size="sm" onClick={() => set({ ...DEFAULT_SETTINGS })}>Défaut</Btn>
      </header>

      <Panel>
        <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Difficulté</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PRESET_INFO.map((pr) => (
            <button
              key={pr.id}
              onClick={() => applyPreset(pr.id)}
              className={cn(
                "rounded-2xl p-2 text-center ring-1 transition",
                s.preset === pr.id ? "bg-sky-500/20 ring-sky-400" : "bg-white/5 ring-white/10 hover:bg-white/10",
              )}
            >
              <div className="text-2xl">{pr.emoji}</div>
              <div className="text-xs font-black text-white">{pr.label}</div>
              <div className="text-[9px] leading-tight text-slate-400">{pr.desc}</div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Physique & Gameplay</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Gravité" value={s.gravity} min={0.5} max={1.8} step={0.05} onChange={(v) => onCustom({ gravity: v })} fmt={(v) => `×${v.toFixed(2)}`} />
          <Slider label="Vitesse de défilement" value={s.speed} min={0.6} max={2} step={0.05} onChange={(v) => onCustom({ speed: v })} fmt={(v) => `×${v.toFixed(2)}`} />
          <Slider label="Taille des passages" value={s.gap} min={0.65} max={1.7} step={0.05} onChange={(v) => onCustom({ gap: v })} fmt={(v) => `×${v.toFixed(2)}`} />
          <Slider label="Puissance du saut" value={s.flap} min={0.7} max={1.4} step={0.05} onChange={(v) => onCustom({ flap: v })} fmt={(v) => `×${v.toFixed(2)}`} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Toggle label="Power-ups" hint="Bouclier, ralenti, aimant, ×2, mini" value={s.powerups} onChange={(v) => set({ powerups: v })} />
          <Toggle label="Pièces à collecter" hint="Monnaie pour la boutique" value={s.coinsOn} onChange={(v) => set({ coinsOn: v })} />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Duel & IA</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Niveau de l'IA" value={s.aiLevel} min={0} max={3} step={1} onChange={(v) => set({ aiLevel: v })} fmt={(v) => ["Débutant", "Normal", "Expert", "Machine"][v]} />
          <Slider label="Manches par duel" value={s.duelRounds} min={1} max={7} step={2} onChange={(v) => set({ duelRounds: v })} fmt={(v) => `BO${v}`} />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Audio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Effets sonores" value={s.sfx} min={0} max={1} step={0.05} onChange={(v) => set({ sfx: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Musique" value={s.music} min={0} max={1} step={0.05} onChange={(v) => set({ music: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Affichage</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Particules" hint="Traînées, explosions, météo" value={s.particles} onChange={(v) => set({ particles: v })} />
          <Toggle label="Parallaxe" hint="Décors en profondeur" value={s.parallax} onChange={(v) => set({ parallax: v })} />
          <Toggle label="Secousses d'écran" value={s.shake} onChange={(v) => set({ shake: v })} />
          <Toggle label="Gros score" hint="HUD agrandi" value={s.bigHud} onChange={(v) => set({ bigHud: v })} />
          <Toggle label="Afficher les FPS" value={s.showFps} onChange={(v) => set({ showFps: v })} />
          <Toggle label="Afficher les hitbox" hint="Mode entraînement" value={s.showHitbox} onChange={(v) => set({ showHitbox: v })} />
        </div>
      </Panel>

      <Panel className="!bg-rose-950/40 ring-rose-500/30">
        <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-rose-300">Zone dangereuse</h2>
        <p className="mb-2 text-xs text-slate-300">Efface les pièces, skins, records et la progression de campagne.</p>
        <Btn
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("Vraiment tout réinitialiser ?")) {
              resetProfile();
              onBack();
            }
          }}
        >
          🗑️ Réinitialiser la progression
        </Btn>
      </Panel>
    </div>
  );
}
