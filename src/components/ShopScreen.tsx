import { useState } from "react";
import { MAPS, RARITY_COLOR, SKINS, TRAILS, type TrailKind } from "../game/data";
import { useProfile } from "../game/store";
import { Btn, Coin, MapPreview, Panel, SkinPreview, Tabs } from "./UI";
import { cn } from "../utils/cn";
import { sfx } from "../game/audio";

export default function ShopScreen({ onBack }: { onBack: () => void }) {
  const [p, update] = useProfile();
  const [tab, setTab] = useState<"skins" | "trails" | "maps">("skins");
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1600);
  };

  const buy = (kind: "skin" | "trail" | "map", id: string, price: number, name: string) => {
    if (price < 0) {
      sfx.err();
      flash("🔒 Skin secret : remplis la condition !");
      return;
    }
    if (p.coins < price) {
      sfx.err();
      flash("Pas assez de pièces !");
      return;
    }
    sfx.buy();
    update((prof) => ({
      ...prof,
      coins: prof.coins - price,
      ownedSkins: kind === "skin" ? [...prof.ownedSkins, id] : prof.ownedSkins,
      ownedTrails: kind === "trail" ? [...prof.ownedTrails, id as TrailKind] : prof.ownedTrails,
      ownedMaps: kind === "map" ? [...prof.ownedMaps, id] : prof.ownedMaps,
      skin: kind === "skin" ? id : prof.skin,
      trail: kind === "trail" ? (id as TrailKind) : prof.trail,
      map: kind === "map" ? id : prof.map,
    }));
    flash(`✅ ${name} débloqué et équipé !`);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-3">
        <Btn variant="ghost" size="sm" onClick={onBack}>← Menu</Btn>
        <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">🛍️ Boutique</h1>
        <Coin amount={p.coins} />
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "skins", label: `🐤 Skins (${p.ownedSkins.length}/${SKINS.length})` },
          { id: "trails", label: `✨ Traînées (${p.ownedTrails.length}/${TRAILS.length})` },
          { id: "maps", label: `🗺️ Maps (${p.ownedMaps.length}/${MAPS.length})` },
        ]}
      />

      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-xl ring-1 ring-white/20">
          {toast}
        </div>
      )}

      {tab === "skins" && (
        <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 lg:grid-cols-4">
          {SKINS.map((s) => {
            const owned = p.ownedSkins.includes(s.id);
            const equipped = p.skin === s.id;
            return (
              <Panel key={s.id} className={cn("flex flex-col items-center gap-1 !p-3 transition", equipped && "ring-2 ring-sky-400")}>
                <span className="self-start rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                  style={{ background: `${RARITY_COLOR[s.rarity]}22`, color: RARITY_COLOR[s.rarity] }}>
                  {s.rarity}
                </span>
                <div className={cn("transition", !owned && "opacity-45 grayscale")}>
                  <SkinPreview skin={s} size={72} />
                </div>
                <p className="text-sm font-black text-white">{s.name}</p>
                <p className="min-h-[28px] text-center text-[10px] leading-tight text-slate-400">{owned ? s.desc : s.secret ?? s.desc}</p>
                {owned ? (
                  equipped ? (
                    <span className="w-full rounded-xl bg-sky-500/20 py-1.5 text-center text-xs font-black text-sky-300">Équipé</span>
                  ) : (
                    <Btn size="sm" className="w-full" onClick={() => update((pr) => ({ ...pr, skin: s.id }))}>Équiper</Btn>
                  )
                ) : (
                  <Btn size="sm" variant={s.price < 0 ? "ghost" : "gold"} className="w-full" onClick={() => buy("skin", s.id, s.price, s.name)}>
                    {s.price < 0 ? "🔒 Secret" : `🪙 ${s.price}`}
                  </Btn>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      {tab === "trails" && (
        <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3">
          {TRAILS.map((t) => {
            const owned = p.ownedTrails.includes(t.id);
            const equipped = p.trail === t.id;
            return (
              <Panel key={t.id} className={cn("flex flex-col gap-2 !p-3", equipped && "ring-2 ring-sky-400")}>
                <div className="flex h-10 items-center gap-1 overflow-hidden rounded-xl bg-slate-950/60 px-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 4 + i * 1.2,
                        height: 4 + i * 1.2,
                        background: t.colors[i % t.colors.length],
                        opacity: 0.25 + (i / 12) * 0.75,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm font-black text-white">{t.name}</p>
                <p className="text-[10px] text-slate-400">{t.desc}</p>
                {owned ? (
                  equipped ? (
                    <span className="rounded-xl bg-sky-500/20 py-1.5 text-center text-xs font-black text-sky-300">Équipé</span>
                  ) : (
                    <Btn size="sm" onClick={() => update((pr) => ({ ...pr, trail: t.id }))}>Équiper</Btn>
                  )
                ) : (
                  <Btn size="sm" variant="gold" onClick={() => buy("trail", t.id, t.price, t.name)}>🪙 {t.price}</Btn>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      {tab === "maps" && (
        <div className="grid grid-cols-1 gap-3 pb-6 sm:grid-cols-2 lg:grid-cols-3">
          {MAPS.map((m) => {
            const owned = p.ownedMaps.includes(m.id);
            const equipped = p.map === m.id;
            return (
              <Panel key={m.id} className={cn("flex flex-col gap-2 !p-3", equipped && "ring-2 ring-sky-400")}>
                <MapPreview map={m} className="h-24 w-full" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">{m.name}</p>
                  <div className="flex gap-1 text-[9px] font-bold">
                    {m.gravityMul && <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-violet-300">G×{m.gravityMul}</span>}
                    {m.speedMul && <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">V×{m.speedMul}</span>}
                    {m.wind ? <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-sky-300">🌬️{m.wind}</span> : null}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">{m.desc}</p>
                {owned ? (
                  equipped ? (
                    <span className="rounded-xl bg-sky-500/20 py-1.5 text-center text-xs font-black text-sky-300">Sélectionnée</span>
                  ) : (
                    <Btn size="sm" onClick={() => update((pr) => ({ ...pr, map: m.id }))}>Choisir</Btn>
                  )
                ) : (
                  <Btn size="sm" variant="gold" onClick={() => buy("map", m.id, m.price, m.name)}>🪙 {m.price}</Btn>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
