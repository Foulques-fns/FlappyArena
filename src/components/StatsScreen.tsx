import { ACHIEVEMENTS, LEVELS, MAPS, SKINS } from "../game/data";
import { useProfile } from "../game/store";
import { Btn, Panel } from "./UI";
import { cn } from "../utils/cn";

const MODE_LABEL: Record<string, string> = {
  classic: "Classique",
  level: "Campagne",
  duel: "Duel",
  time: "Chrono",
  chaos: "Chaos",
};

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3 text-center ring-1 ring-white/10">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn("text-2xl font-black", color ?? "text-white")}>{value}</p>
    </div>
  );
}

export default function StatsScreen({ onBack }: { onBack: () => void }) {
  const [p] = useProfile();
  const stars = Object.values(p.levels).reduce((a, b) => a + b.stars, 0);
  const done = Object.values(p.levels).filter((l) => l.done).length;
  const unlocked = ACHIEVEMENTS.filter((a) => p.achievements.includes(a.id));
  const pct = Math.round(
    ((p.ownedSkins.length / SKINS.length) * 0.25 +
      (p.ownedMaps.length / MAPS.length) * 0.15 +
      (stars / (LEVELS.length * 3)) * 0.35 +
      (unlocked.length / ACHIEVEMENTS.length) * 0.25) * 100,
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col gap-3 p-4 pb-10">
      <header className="flex items-center justify-between">
        <Btn variant="ghost" size="sm" onClick={onBack}>← Menu</Btn>
        <h1 className="text-xl font-black text-white sm:text-2xl">📊 Profil</h1>
        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-black text-violet-300 ring-1 ring-violet-400/30">{pct}% complété</span>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Record Classique" value={p.bestClassic} color="text-sky-300" />
        <Stat label="Record Chrono" value={p.bestTimeAttack} color="text-emerald-300" />
        <Stat label="Record Chaos" value={p.bestChaos} color="text-fuchsia-300" />
        <Stat label="Duels gagnés" value={`${p.duelWins}/${p.duelPlayed}`} color="text-rose-300" />
        <Stat label="Parties jouées" value={p.games} />
        <Stat label="Pièces totales" value={p.totalCoins} color="text-amber-300" />
        <Stat label="Passages parfaits" value={p.perfects} color="text-lime-300" />
        <Stat label="Étoiles" value={`${stars}/${LEVELS.length * 3}`} color="text-amber-300" />
      </div>

      <Panel>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Succès</h2>
          <span className="text-xs font-black text-slate-300">{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = p.achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl p-2.5 ring-1 transition",
                  got ? "bg-amber-400/10 ring-amber-400/30" : "bg-white/5 ring-white/10",
                )}
              >
                <span className={cn("text-2xl", !got && "opacity-30 grayscale")}>{a.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-black", got ? "text-amber-200" : "text-slate-300")}>{a.name}</p>
                  <p className="truncate text-[10px] text-slate-400">{a.desc}</p>
                </div>
                <span className={cn("shrink-0 text-[10px] font-black", got ? "text-emerald-400" : "text-slate-500")}>{got ? "✓" : `🪙${a.reward}`}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Derniers scores</h2>
        {p.scores.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Aucune partie pour l'instant. Va voler !</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900/90 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-1.5">#</th>
                  <th>Mode</th>
                  <th className="text-right">Score</th>
                  <th className="text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...p.scores]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 20)
                  .map((sc, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1.5 font-black text-slate-500">{i + 1}</td>
                      <td className="font-bold text-slate-200">{MODE_LABEL[sc.mode] ?? sc.mode}</td>
                      <td className="text-right font-black text-sky-300">{sc.score}</td>
                      <td className="text-right text-[11px] text-slate-500">
                        {new Date(sc.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Progression campagne</h2>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all" style={{ width: `${(done / LEVELS.length) * 100}%` }} />
        </div>
        <p className="mt-1 text-[11px] font-bold text-slate-400">{done} / {LEVELS.length} niveaux terminés</p>
      </Panel>
    </div>
  );
}
