import { LEVELS, MAPS, WORLD_NAMES, type Level } from "../game/data";
import { useProfile } from "../game/store";
import { Btn, MapPreview, Panel, Stars } from "./UI";
import { cn } from "../utils/cn";

export default function LevelsScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (l: Level) => void }) {
  const [p] = useProfile();
  const totalStars = Object.values(p.levels).reduce((a, b) => a + b.stars, 0);
  const done = Object.values(p.levels).filter((l) => l.done).length;

  const isUnlocked = (l: Level) => l.id === 1 || (p.levels[l.id - 1]?.done ?? false);

  const worlds = [1, 2, 3, 4, 5, 6];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col gap-4 p-4 pb-10">
      <header className="flex items-center justify-between gap-2">
        <Btn variant="ghost" size="sm" onClick={onBack}>← Menu</Btn>
        <h1 className="text-xl font-black text-white sm:text-2xl">🗺️ Campagne</h1>
        <div className="flex gap-2 text-xs font-black">
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-300 ring-1 ring-amber-400/30">★ {totalStars}/90</span>
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-300 ring-1 ring-emerald-400/30">✓ {done}/30</span>
        </div>
      </header>

      {worlds.map((w) => {
        const levels = LEVELS.filter((l) => l.world === w);
        const wOpen = levels.some(isUnlocked);
        const map = MAPS.find((m) => m.id === levels[0].map)!;
        return (
          <Panel key={w} className={cn(!wOpen && "opacity-60")}>
            <div className="mb-3 flex items-center gap-3">
              <MapPreview map={map} className="h-12 w-20 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monde {w}</p>
                <h2 className="text-lg font-black text-white">{WORLD_NAMES[w - 1]}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {levels.map((l) => {
                const prog = p.levels[l.id];
                const open = isUnlocked(l);
                const boss = l.name.startsWith("Boss");
                return (
                  <button
                    key={l.id}
                    disabled={!open}
                    onClick={() => onPlay(l)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition",
                      open ? "bg-white/5 ring-white/10 hover:bg-white/15 hover:ring-sky-400/60" : "cursor-not-allowed bg-slate-950/50 ring-white/5",
                      boss && open && "bg-rose-500/10 ring-rose-400/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black",
                        prog?.done ? "bg-emerald-500 text-white" : open ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-500",
                      )}
                    >
                      {open ? (boss ? "👑" : l.id) : "🔒"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">{l.name}</p>
                      <p className="truncate text-[10px] text-slate-400">{open ? l.hint : "Termine le niveau précédent"}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Stars n={prog?.stars ?? 0} size={12} />
                        {prog && prog.best > 0 && <span className="text-[10px] font-bold text-slate-400">Record {prog.best}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-slate-500">🎯{l.target}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
