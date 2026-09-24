import { useEffect, useState } from "react";
import MenuScreen from "./components/MenuScreen";
import GameScreen from "./components/GameScreen";
import ShopScreen from "./components/ShopScreen";
import SettingsScreen from "./components/SettingsScreen";
import LevelsScreen from "./components/LevelsScreen";
import DuelSetup, { type DuelConfig } from "./components/DuelSetup";
import StatsScreen from "./components/StatsScreen";
import { useProfile } from "./game/store";
import { setVolumes, unlockAudio } from "./game/audio";
import type { Mode, PlayerCfg } from "./game/engine";
import type { Level } from "./game/data";

type Screen = "menu" | "game" | "shop" | "settings" | "levels" | "duel" | "stats";

export default function App() {
  const [p] = useProfile();
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<Mode>("classic");
  const [level, setLevel] = useState<Level | undefined>();
  const [duel, setDuel] = useState<DuelConfig | null>(null);

  useEffect(() => {
    setVolumes(p.settings.sfx, p.settings.music);
  }, [p.settings.sfx, p.settings.music]);

  useEffect(() => {
    const on = () => unlockAudio();
    window.addEventListener("pointerdown", on, { once: true });
    window.addEventListener("keydown", on, { once: true });
    return () => {
      window.removeEventListener("pointerdown", on);
      window.removeEventListener("keydown", on);
    };
  }, []);

  const startMode = (m: Mode) => {
    setMode(m);
    setLevel(undefined);
    setDuel(null);
    setScreen("game");
  };

  const startLevel = (l: Level) => {
    setMode("level");
    setLevel(l);
    setDuel(null);
    setScreen("game");
  };

  const startDuel = (c: DuelConfig) => {
    setMode("duel");
    setLevel(undefined);
    setDuel(c);
    setScreen("game");
  };

  const solo: PlayerCfg[] = [{ skinId: p.skin, trailId: p.trail, name: "Toi", color: "#38bdf8" }];
  const duelPlayers: PlayerCfg[] = duel
    ? [
        { skinId: duel.skin1, trailId: p.trail, name: duel.name1, color: "#38bdf8" },
        { skinId: duel.skin2, trailId: "none", name: duel.name2, color: "#fb7185", ai: duel.p2Ai, aiLevel: duel.aiLevel },
      ]
    : solo;

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 antialiased [font-family:system-ui,-apple-system,'Segoe_UI',sans-serif]">
      {screen === "menu" && (
        <MenuScreen
          onPlay={startMode}
          onShop={() => setScreen("shop")}
          onSettings={() => setScreen("settings")}
          onStats={() => setScreen("stats")}
          onLevels={() => setScreen("levels")}
          onDuel={() => setScreen("duel")}
        />
      )}
      {screen === "shop" && <ShopScreen onBack={() => setScreen("menu")} />}
      {screen === "settings" && <SettingsScreen onBack={() => setScreen("menu")} />}
      {screen === "stats" && <StatsScreen onBack={() => setScreen("menu")} />}
      {screen === "levels" && <LevelsScreen onBack={() => setScreen("menu")} onPlay={startLevel} />}
      {screen === "duel" && <DuelSetup onBack={() => setScreen("menu")} onStart={startDuel} />}
      {screen === "game" && (
        <GameScreen
          key={`${mode}-${level?.id ?? "x"}-${duel ? duel.mapId + duel.skin2 : ""}`}
          mode={mode}
          mapId={mode === "level" && level ? level.map : duel ? duel.mapId : p.map}
          settings={p.settings}
          players={mode === "duel" ? duelPlayers : solo}
          level={level}
          duelRounds={duel?.rounds ?? p.settings.duelRounds}
          onExit={() => setScreen(mode === "level" ? "levels" : "menu")}
          onLevel={startLevel}
        />
      )}
    </div>
  );
}
