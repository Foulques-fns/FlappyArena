import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENTS, LEVELS, MAPS, SKINS, TRAILS, type TrailKind } from "./data";

export type DifficultyPreset = "chill" | "normal" | "hard" | "insane" | "custom";

export interface Settings {
  preset: DifficultyPreset;
  gravity: number;   // multiplier 0.5 - 1.8
  speed: number;     // multiplier 0.6 - 2
  gap: number;       // multiplier 0.7 - 1.6
  flap: number;      // multiplier 0.7 - 1.4
  powerups: boolean;
  coinsOn: boolean;
  particles: boolean;
  shake: boolean;
  parallax: boolean;
  sfx: number;       // 0..1
  music: number;     // 0..1
  showFps: boolean;
  showHitbox: boolean;
  bigHud: boolean;
  colorblind: boolean;
  aiLevel: number;   // 0..3
  duelRounds: number;
}

export const DEFAULT_SETTINGS: Settings = {
  preset: "normal",
  gravity: 1,
  speed: 1,
  gap: 1,
  flap: 1,
  powerups: true,
  coinsOn: true,
  particles: true,
  shake: true,
  parallax: true,
  sfx: 0.7,
  music: 0.35,
  showFps: false,
  showHitbox: false,
  bigHud: false,
  colorblind: false,
  aiLevel: 1,
  duelRounds: 3,
};

export const PRESETS: Record<Exclude<DifficultyPreset, "custom">, Partial<Settings>> = {
  chill: { gravity: 0.8, speed: 0.8, gap: 1.35, flap: 0.95 },
  normal: { gravity: 1, speed: 1, gap: 1, flap: 1 },
  hard: { gravity: 1.15, speed: 1.2, gap: 0.86, flap: 1.05 },
  insane: { gravity: 1.35, speed: 1.5, gap: 0.72, flap: 1.12 },
};

export interface LevelProgress {
  best: number;
  stars: number;
  done: boolean;
}

export interface Profile {
  coins: number;
  totalCoins: number;
  bestClassic: number;
  bestTimeAttack: number;
  bestChaos: number;
  games: number;
  duelWins: number;
  duelPlayed: number;
  powerUsed: number;
  perfects: number;
  skin: string;
  skinP2: string;
  trail: TrailKind;
  map: string;
  ownedSkins: string[];
  ownedTrails: string[];
  ownedMaps: string[];
  levels: Record<number, LevelProgress>;
  achievements: string[];
  settings: Settings;
  scores: { mode: string; score: number; date: number }[];
}

export const DEFAULT_PROFILE: Profile = {
  coins: 100,
  totalCoins: 0,
  bestClassic: 0,
  bestTimeAttack: 0,
  bestChaos: 0,
  games: 0,
  duelWins: 0,
  duelPlayed: 0,
  powerUsed: 0,
  perfects: 0,
  skin: "classic",
  skinP2: "robin",
  trail: "none",
  map: "day",
  ownedSkins: ["classic"],
  ownedTrails: ["none"],
  ownedMaps: ["day"],
  levels: {},
  achievements: [],
  settings: DEFAULT_SETTINGS,
  scores: [],
};

const KEY = "flappy-arena-v1";

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      levels: parsed.levels ?? {},
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

let memory: Profile = typeof localStorage !== "undefined" ? load() : { ...DEFAULT_PROFILE };
const listeners = new Set<(p: Profile) => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* ignore */
  }
}

export function setProfile(updater: (p: Profile) => Profile) {
  memory = updater(memory);
  persist();
  listeners.forEach((l) => l(memory));
}

export function getProfile() {
  return memory;
}

export function useProfile() {
  const [p, setP] = useState(memory);
  useEffect(() => {
    listeners.add(setP);
    return () => {
      listeners.delete(setP);
    };
  }, []);
  const update = useCallback((fn: (p: Profile) => Profile) => setProfile(fn), []);
  return [p, update] as const;
}

export function resetProfile() {
  memory = { ...DEFAULT_PROFILE, levels: {}, ownedSkins: ["classic"], ownedTrails: ["none"], ownedMaps: ["day"], achievements: [], scores: [] };
  persist();
  listeners.forEach((l) => l(memory));
}

// ------------------------- secret unlocks / achievements -------------------
export function checkUnlocks(): { newAch: string[]; newSkins: string[] } {
  const p = memory;
  const newAch: string[] = [];
  const newSkins: string[] = [];
  const starsTotal = Object.values(p.levels).reduce((a, b) => a + b.stars, 0);
  const levelsDone = Object.values(p.levels).filter((l) => l.done).length;
  const perfLvls = Object.values(p.levels).filter((l) => l.stars === 3).length;
  const bestAny = Math.max(p.bestClassic, p.bestTimeAttack, p.bestChaos);

  const cond: Record<string, boolean> = {
    first: bestAny >= 1,
    score10: bestAny >= 10,
    score25: bestAny >= 25,
    score50: bestAny >= 50,
    score100: bestAny >= 100,
    coins100: p.totalCoins >= 100,
    coins1000: p.totalCoins >= 1000,
    duel1: p.duelWins >= 1,
    duel10: p.duelWins >= 10,
    lvl5: levelsDone >= 5,
    lvl15: levelsDone >= 15,
    lvl30: levelsDone >= LEVELS.length,
    stars45: starsTotal >= 45,
    skins5: p.ownedSkins.length >= 5,
    maps5: p.ownedMaps.length >= 5,
    power20: p.powerUsed >= 20,
    perfect10: p.perfects >= 10,
    games50: p.games >= 50,
  };

  let coins = 0;
  for (const a of ACHIEVEMENTS) {
    if (cond[a.id] && !p.achievements.includes(a.id)) {
      newAch.push(a.id);
      coins += a.reward;
    }
  }
  const secrets: Record<string, boolean> = {
    void: p.bestClassic >= 100,
    phoenix: p.duelWins >= 10,
    champion: perfLvls >= 15,
  };
  for (const [id, ok] of Object.entries(secrets)) {
    if (ok && !p.ownedSkins.includes(id)) newSkins.push(id);
  }
  if (newAch.length || newSkins.length) {
    setProfile((prev) => ({
      ...prev,
      achievements: [...prev.achievements, ...newAch],
      ownedSkins: [...prev.ownedSkins, ...newSkins],
      coins: prev.coins + coins,
    }));
  }
  return { newAch, newSkins };
}

export const skinById = (id: string) => SKINS.find((s) => s.id === id) ?? SKINS[0];
export const mapById = (id: string) => MAPS.find((m) => m.id === id) ?? MAPS[0];
export const trailById = (id: TrailKind) => TRAILS.find((t) => t.id === id) ?? TRAILS[0];
