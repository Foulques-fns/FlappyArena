// ---------------------------------------------------------------------------
// FLAPPY ARENA — Game data: skins, trails, maps, levels, achievements
// ---------------------------------------------------------------------------

export type Shape =
  | "bird"
  | "round"
  | "rocket"
  | "ghost"
  | "ufo"
  | "dragon"
  | "cube"
  | "star"
  | "fish"
  | "plane"
  | "skull"
  | "heart";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Skin {
  id: string;
  name: string;
  shape: Shape;
  price: number;
  rarity: Rarity;
  body: string;
  body2: string;
  wing: string;
  belly: string;
  beak: string;
  eye: string;
  desc: string;
  secret?: string; // unlock condition text (price = -1)
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#94a3b8",
  rare: "#38bdf8",
  epic: "#c084fc",
  legendary: "#fbbf24",
};

export const SKINS: Skin[] = [
  { id: "classic", name: "Classique", shape: "bird", price: 0, rarity: "common", body: "#fbbf24", body2: "#f59e0b", wing: "#fde68a", belly: "#fef3c7", beak: "#f97316", eye: "#0f172a", desc: "L'original. Jaune, rond, courageux." },
  { id: "robin", name: "Rouge-gorge", shape: "bird", price: 60, rarity: "common", body: "#ef4444", body2: "#b91c1c", wing: "#fca5a5", belly: "#fee2e2", beak: "#fbbf24", eye: "#0f172a", desc: "Petit mais féroce." },
  { id: "bluejay", name: "Geai Bleu", shape: "bird", price: 60, rarity: "common", body: "#3b82f6", body2: "#1d4ed8", wing: "#93c5fd", belly: "#dbeafe", beak: "#f8fafc", eye: "#0f172a", desc: "Vole comme un ciel d'été." },
  { id: "mint", name: "Menthe", shape: "bird", price: 80, rarity: "common", body: "#34d399", body2: "#059669", wing: "#a7f3d0", belly: "#ecfdf5", beak: "#fb7185", eye: "#0f172a", desc: "Fraîcheur garantie." },
  { id: "panda", name: "Panda", shape: "round", price: 120, rarity: "common", body: "#f8fafc", body2: "#cbd5e1", wing: "#0f172a", belly: "#ffffff", beak: "#1f2937", eye: "#0f172a", desc: "Rond, doux, imperturbable." },
  { id: "bubble", name: "Bulle", shape: "round", price: 140, rarity: "rare", body: "#67e8f9", body2: "#0891b2", wing: "#cffafe", belly: "#ecfeff", beak: "#22d3ee", eye: "#083344", desc: "Ne pas percer." },
  { id: "blob", name: "Slime", shape: "round", price: 160, rarity: "rare", body: "#a3e635", body2: "#4d7c0f", wing: "#d9f99d", belly: "#ecfccb", beak: "#65a30d", eye: "#1a2e05", desc: "Gluant et rebondissant." },
  { id: "paper", name: "Avion Papier", shape: "plane", price: 180, rarity: "rare", body: "#f1f5f9", body2: "#cbd5e1", wing: "#e2e8f0", belly: "#ffffff", beak: "#94a3b8", eye: "#334155", desc: "Plié avec amour." },
  { id: "jet", name: "Jet Furtif", shape: "plane", price: 260, rarity: "rare", body: "#334155", body2: "#0f172a", wing: "#475569", belly: "#1e293b", beak: "#f43f5e", eye: "#f8fafc", desc: "Indétectable... presque." },
  { id: "rocket", name: "Fusée", shape: "rocket", price: 240, rarity: "rare", body: "#e2e8f0", body2: "#94a3b8", wing: "#ef4444", belly: "#f8fafc", beak: "#38bdf8", eye: "#0f172a", desc: "Décollage immédiat." },
  { id: "retro", name: "Pixel", shape: "cube", price: 200, rarity: "rare", body: "#facc15", body2: "#ca8a04", wing: "#fde047", belly: "#fef08a", beak: "#f97316", eye: "#0f172a", desc: "8 bits de pure nostalgie." },
  { id: "toast", name: "Toast", shape: "cube", price: 220, rarity: "rare", body: "#fcd34d", body2: "#b45309", wing: "#fbbf24", belly: "#fef3c7", beak: "#92400e", eye: "#451a03", desc: "Croustillant à l'extérieur." },
  { id: "ghost", name: "Fantôme", shape: "ghost", price: 320, rarity: "epic", body: "#e0e7ff", body2: "#a5b4fc", wing: "#c7d2fe", belly: "#f5f3ff", beak: "#818cf8", eye: "#1e1b4b", desc: "Traverse les murs (non)." },
  { id: "spirit", name: "Esprit Noir", shape: "ghost", price: 380, rarity: "epic", body: "#4c1d95", body2: "#2e1065", wing: "#7c3aed", belly: "#6d28d9", beak: "#a78bfa", eye: "#f0abfc", desc: "Né dans l'ombre." },
  { id: "ufo", name: "OVNI", shape: "ufo", price: 420, rarity: "epic", body: "#94a3b8", body2: "#475569", wing: "#22d3ee", belly: "#cbd5e1", beak: "#a3e635", eye: "#052e16", desc: "Venu d'ailleurs." },
  { id: "starfish", name: "Étoile", shape: "star", price: 360, rarity: "epic", body: "#fde047", body2: "#f59e0b", wing: "#fef9c3", belly: "#fffbeb", beak: "#f97316", eye: "#0f172a", desc: "Brille dans la nuit." },
  { id: "koi", name: "Koï", shape: "fish", price: 300, rarity: "epic", body: "#fb923c", body2: "#ea580c", wing: "#fed7aa", belly: "#fff7ed", beak: "#f43f5e", eye: "#0f172a", desc: "Nage dans les airs." },
  { id: "shark", name: "Requin", shape: "fish", price: 460, rarity: "epic", body: "#64748b", body2: "#334155", wing: "#94a3b8", belly: "#f1f5f9", beak: "#f8fafc", eye: "#0f172a", desc: "Ne s'arrête jamais." },
  { id: "dragon", name: "Dragonnet", shape: "dragon", price: 560, rarity: "legendary", body: "#16a34a", body2: "#14532d", wing: "#86efac", belly: "#bbf7d0", beak: "#fbbf24", eye: "#fef08a", desc: "Crache du feu... symboliquement." },
  { id: "inferno", name: "Infernal", shape: "dragon", price: 700, rarity: "legendary", body: "#dc2626", body2: "#7f1d1d", wing: "#fb923c", belly: "#fed7aa", beak: "#fde047", eye: "#fff7ed", desc: "Chaud devant." },
  { id: "skull", name: "Crâne", shape: "skull", price: 520, rarity: "epic", body: "#f8fafc", body2: "#cbd5e1", wing: "#e2e8f0", belly: "#ffffff", beak: "#94a3b8", eye: "#0f172a", desc: "Mort de rire." },
  { id: "love", name: "Cœur", shape: "heart", price: 340, rarity: "epic", body: "#fb7185", body2: "#e11d48", wing: "#fecdd3", belly: "#fff1f2", beak: "#f43f5e", eye: "#4c0519", desc: "Bat très vite." },
  { id: "gold", name: "Oiseau d'Or", shape: "bird", price: 900, rarity: "legendary", body: "#fcd34d", body2: "#b45309", wing: "#fef3c7", belly: "#fffbeb", beak: "#fff7ed", eye: "#451a03", desc: "24 carats de style." },
  { id: "neon", name: "Néon", shape: "bird", price: 800, rarity: "legendary", body: "#22d3ee", body2: "#a21caf", wing: "#f0abfc", belly: "#e0f2fe", beak: "#f472b6", eye: "#020617", desc: "Illumine la nuit cyber." },
  { id: "void", name: "Néant", shape: "round", price: -1, rarity: "legendary", body: "#0f172a", body2: "#020617", wing: "#4338ca", belly: "#1e1b4b", beak: "#6366f1", eye: "#c7d2fe", desc: "Fait d'obscurité pure.", secret: "Atteindre 100 en Classique" },
  { id: "phoenix", name: "Phénix", shape: "dragon", price: -1, rarity: "legendary", body: "#f59e0b", body2: "#dc2626", wing: "#fde047", belly: "#fed7aa", beak: "#fff7ed", eye: "#7c2d12", desc: "Renaît de ses cendres.", secret: "Gagner 10 duels" },
  { id: "champion", name: "Champion", shape: "bird", price: -1, rarity: "legendary", body: "#a855f7", body2: "#6b21a8", wing: "#f0abfc", belly: "#fae8ff", beak: "#fbbf24", eye: "#1e1b4b", desc: "Réservé aux légendes.", secret: "3 étoiles sur 15 niveaux" },
];

// --------------------------- TRAILS ---------------------------------------
export type TrailKind =
  | "none" | "sparkle" | "fire" | "bubbles" | "rainbow" | "stars" | "smoke"
  | "hearts" | "ice" | "plasma" | "neon" | "lightning" | "galaxy" | "leaves"
  | "runes" | "data";

export interface Trail {
  id: TrailKind;
  name: string;
  price: number;
  colors: string[];
  glow?: boolean;
  desc: string;
}

export const TRAILS: Trail[] = [
  { id: "none", name: "Aucune", price: 0, colors: ["#94a3b8"], desc: "Discrétion totale." },
  { id: "sparkle", name: "Étincelles", price: 80, colors: ["#fef08a", "#fde047", "#ffffff"], desc: "Un peu de magie." },
  { id: "smoke", name: "Fumée", price: 100, colors: ["#94a3b8", "#cbd5e1", "#e2e8f0"], desc: "Sortie dramatique." },
  { id: "bubbles", name: "Bulles", price: 120, colors: ["#67e8f9", "#a5f3fc", "#ffffff"], desc: "Glou glou." },
  { id: "fire", name: "Flammes", price: 150, colors: ["#fbbf24", "#f97316", "#dc2626"], glow: true, desc: "Ça chauffe !" },
  { id: "leaves", name: "Feuilles", price: 160, colors: ["#4ade80", "#a3e635", "#fbbf24"], desc: "Tourbillon d'automne." },
  { id: "hearts", name: "Cœurs", price: 180, colors: ["#fb7185", "#f472b6", "#fecdd3"], desc: "Amour en vol." },
  { id: "ice", name: "Givre", price: 200, colors: ["#bae6fd", "#7dd3fc", "#ffffff"], desc: "Froid glacial." },
  { id: "stars", name: "Étoiles", price: 220, colors: ["#fde047", "#f0abfc", "#93c5fd"], glow: true, desc: "Poussière d'étoiles." },
  { id: "plasma", name: "Plasma", price: 260, colors: ["#22d3ee", "#a78bfa", "#f0abfc"], glow: true, desc: "Énergie instable." },
  { id: "rainbow", name: "Arc-en-ciel", price: 300, colors: ["#f43f5e", "#f97316", "#facc15", "#4ade80", "#38bdf8", "#a78bfa"], desc: "Toutes les couleurs." },
  { id: "neon", name: "Néon", price: 320, colors: ["#39ff14", "#00fff2", "#ff00ea"], glow: true, desc: "Lumière synthétique pure." },
  { id: "lightning", name: "Foudre", price: 380, colors: ["#fef08a", "#ffffff", "#93c5fd"], glow: true, desc: "Laisse un éclair derrière toi." },
  { id: "data", name: "Données", price: 420, colors: ["#22d3ee", "#4ade80", "#0ea5e9"], glow: true, desc: "Fragments binaires." },
  { id: "galaxy", name: "Galaxie", price: 520, colors: ["#818cf8", "#e879f9", "#fbbf24", "#ffffff"], glow: true, desc: "Une nébuleuse en miniature." },
  { id: "runes", name: "Runes", price: 700, colors: ["#c084fc", "#f0abfc", "#e9d5ff"], glow: true, desc: "Des glyphes anciens flottent." },
];

// --------------------------- MAPS -----------------------------------------
export type WeatherKind = "none" | "rain" | "snow" | "stars" | "bubbles" | "embers" | "leaves" | "sand" | "matrix" | "meteors" | "cherry";
export type BackKind = "hills" | "city" | "mountains" | "space" | "reef" | "volcano" | "cyber" | "candy" | "clouds" | "ruins" | "aurora" | "japan" | "storm";

export interface GameMap {
  id: string;
  name: string;
  price: number;
  sky: string[];
  ground: string;
  groundDark: string;
  pipeA: string;
  pipeB: string;
  pipeEdge: string;
  accent: string;
  weather: WeatherKind;
  back: BackKind;
  dark: boolean;
  desc: string;
  gravityMul?: number;
  speedMul?: number;
  wind?: number;
}

export const MAPS: GameMap[] = [
  { id: "day", name: "Prairie", price: 0, sky: ["#7dd3fc", "#bae6fd", "#e0f2fe"], ground: "#84cc16", groundDark: "#4d7c0f", pipeA: "#22c55e", pipeB: "#15803d", pipeEdge: "#14532d", accent: "#fbbf24", weather: "none", back: "hills", dark: false, desc: "Le classique ensoleillé." },
  { id: "sunset", name: "Crépuscule", price: 150, sky: ["#f97316", "#fb7185", "#7c3aed"], ground: "#7c2d12", groundDark: "#431407", pipeA: "#f59e0b", pipeB: "#b45309", pipeEdge: "#78350f", accent: "#fde047", weather: "leaves", back: "mountains", dark: false, desc: "Le soleil se couche sur l'arène." },
  { id: "night", name: "Ville de Nuit", price: 200, sky: ["#0f172a", "#1e293b", "#334155"], ground: "#1e293b", groundDark: "#0f172a", pipeA: "#38bdf8", pipeB: "#0369a1", pipeEdge: "#0c4a6e", accent: "#f0abfc", weather: "stars", back: "city", dark: true, desc: "Néons et gratte-ciels." },
  { id: "space", name: "Orbite", price: 350, sky: ["#020617", "#1e1b4b", "#4c1d95"], ground: "#1e1b4b", groundDark: "#0f172a", pipeA: "#a78bfa", pipeB: "#6d28d9", pipeEdge: "#4c1d95", accent: "#67e8f9", weather: "stars", back: "space", dark: true, desc: "Gravité réduite, vertige garanti.", gravityMul: 0.72 },
  { id: "ocean", name: "Abysses", price: 300, sky: ["#0c4a6e", "#0369a1", "#0891b2"], ground: "#164e63", groundDark: "#083344", pipeA: "#06b6d4", pipeB: "#0e7490", pipeEdge: "#164e63", accent: "#a7f3d0", weather: "bubbles", back: "reef", dark: true, desc: "L'eau ralentit tout.", gravityMul: 0.82, speedMul: 0.92 },
  { id: "volcano", name: "Volcan", price: 400, sky: ["#450a0a", "#7f1d1d", "#b91c1c"], ground: "#450a0a", groundDark: "#1c0606", pipeA: "#f97316", pipeB: "#9a3412", pipeEdge: "#7c2d12", accent: "#fde047", weather: "embers", back: "volcano", dark: true, desc: "Courants ascendants brûlants.", speedMul: 1.12 },
  { id: "arctic", name: "Banquise", price: 320, sky: ["#e0f2fe", "#bae6fd", "#7dd3fc"], ground: "#e2e8f0", groundDark: "#94a3b8", pipeA: "#7dd3fc", pipeB: "#0284c7", pipeEdge: "#0369a1", accent: "#f0f9ff", weather: "snow", back: "mountains", dark: false, desc: "Glissant et venteux.", wind: 14 },
  { id: "cyber", name: "Cyber Grid", price: 500, sky: ["#0b0016", "#2e1065", "#701a75"], ground: "#1a032e", groundDark: "#0b0016", pipeA: "#f0abfc", pipeB: "#a21caf", pipeEdge: "#f472b6", accent: "#22d3ee", weather: "matrix", back: "cyber", dark: true, desc: "Synthwave et vitesse pure.", speedMul: 1.18 },
  { id: "candy", name: "Bonbonland", price: 380, sky: ["#fbcfe8", "#f5d0fe", "#e9d5ff"], ground: "#f9a8d4", groundDark: "#be185d", pipeA: "#f472b6", pipeB: "#be185d", pipeEdge: "#9d174d", accent: "#fef08a", weather: "none", back: "candy", dark: false, desc: "Sucré mais impitoyable." },
  { id: "desert", name: "Désert", price: 260, sky: ["#fcd34d", "#fdba74", "#fb923c"], ground: "#d97706", groundDark: "#92400e", pipeA: "#a16207", pipeB: "#713f12", pipeEdge: "#422006", accent: "#fef3c7", weather: "sand", back: "ruins", dark: false, desc: "Tempêtes de sable imprévisibles.", wind: -10 },
  { id: "sakura", name: "Cerisiers", price: 420, sky: ["#fecdd3", "#fda4af", "#fb7185"], ground: "#9f1239", groundDark: "#4c0519", pipeA: "#34d399", pipeB: "#065f46", pipeEdge: "#064e3b", accent: "#fff1f2", weather: "cherry", back: "japan", dark: false, desc: "Pétales et temple lointain." },
  { id: "aurora", name: "Aurores", price: 460, sky: ["#020617", "#0b1b2a", "#14532d"], ground: "#0b1b2a", groundDark: "#020617", pipeA: "#34d399", pipeB: "#0e7490", pipeEdge: "#134e4a", accent: "#a3e635", weather: "snow", back: "aurora", dark: true, desc: "Danse boréale au-dessus des cimes." },
  { id: "storm", name: "Orage", price: 450, sky: ["#1e293b", "#334155", "#475569"], ground: "#334155", groundDark: "#0f172a", pipeA: "#64748b", pipeB: "#334155", pipeEdge: "#1e293b", accent: "#fde047", weather: "rain", back: "storm", dark: true, desc: "Éclairs, pluie et rafales.", wind: 18, speedMul: 1.08 },
  { id: "comet", name: "Nuée de Comètes", price: 620, sky: ["#050518", "#1a1040", "#3b0764"], ground: "#160b33", groundDark: "#0a0518", pipeA: "#c084fc", pipeB: "#86198f", pipeEdge: "#701a75", accent: "#67e8f9", weather: "meteors", back: "space", dark: true, desc: "Traverse une pluie de météores.", gravityMul: 0.8, wind: -8 },
  { id: "void", name: "Le Néant", price: 800, sky: ["#000000", "#0a0a0a", "#171717"], ground: "#0a0a0a", groundDark: "#000000", pipeA: "#404040", pipeB: "#171717", pipeEdge: "#525252", accent: "#ef4444", weather: "none", back: "space", dark: true, desc: "Rien. Juste toi et le vide.", speedMul: 1.25, gravityMul: 1.1 },
];

// --------------------------- POWER-UPS -------------------------------------
export type PowerKind = "shield" | "slow" | "magnet" | "double" | "shrink";

export const POWER_INFO: Record<PowerKind, { name: string; icon: string; color: string; dur: number }> = {
  shield: { name: "Bouclier", icon: "🛡️", color: "#38bdf8", dur: 0 },
  slow: { name: "Ralenti", icon: "⏳", color: "#a78bfa", dur: 5 },
  magnet: { name: "Aimant", icon: "🧲", color: "#f43f5e", dur: 7 },
  double: { name: "Double", icon: "✖️2", color: "#fbbf24", dur: 9 },
  shrink: { name: "Mini", icon: "🔻", color: "#4ade80", dur: 7 },
};

// --------------------------- LEVELS ----------------------------------------
export interface LevelMods {
  speed: number;
  gap: number;
  gravity: number;
  moving?: number;   // 0..1 ratio of moving pipes
  saws?: number;     // 0..1 ratio of pipes with saw
  lasers?: number;   // 0..1 ratio of laser gates
  narrow?: boolean;  // gap shrinks with progress
  wind?: number;
  invisible?: number; // pipes fade out
  flip?: boolean;     // gravity flips on each pass
}

export interface Level {
  id: number;
  world: number;
  name: string;
  map: string;
  target: number;      // score to complete (bronze)
  stars: [number, number, number];
  mods: LevelMods;
  hint: string;
}

const L = (
  id: number, world: number, name: string, map: string, target: number,
  stars: [number, number, number], mods: LevelMods, hint: string,
): Level => ({ id, world, name, map, target, stars, mods, hint });

export const WORLD_NAMES = ["Prairie", "Crépuscule", "Profondeurs", "Cosmos", "Enfer", "Le Néant"];

export const LEVELS: Level[] = [
  // World 1 — Prairie
  L(1, 1, "Premier Envol", "day", 5, [5, 10, 15], { speed: 0.85, gap: 1.35, gravity: 0.9 }, "Tapote doucement pour planer."),
  L(2, 1, "Rythme", "day", 8, [8, 14, 20], { speed: 0.95, gap: 1.2, gravity: 0.95 }, "Trouve le tempo régulier."),
  L(3, 1, "Serré", "day", 10, [10, 16, 24], { speed: 1, gap: 1.0, gravity: 1 }, "Les tuyaux se rapprochent."),
  L(4, 1, "Ça bouge", "day", 10, [10, 18, 26], { speed: 1, gap: 1.15, gravity: 1, moving: 0.45 }, "Anticipe le mouvement vertical."),
  L(5, 1, "Boss: Le Mur Vert", "day", 14, [14, 22, 30], { speed: 1.1, gap: 1.0, gravity: 1, moving: 0.6, narrow: true }, "Le passage rétrécit !"),
  // World 2 — Sunset
  L(6, 2, "Vent d'Ouest", "sunset", 10, [10, 18, 26], { speed: 1.05, gap: 1.15, gravity: 1, wind: 16 }, "Le vent te pousse."),
  L(7, 2, "Scies Rouillées", "sunset", 12, [12, 20, 28], { speed: 1.05, gap: 1.2, gravity: 1, saws: 0.4 }, "Évite les lames."),
  L(8, 2, "Sable & Ruines", "desert", 12, [12, 20, 30], { speed: 1.1, gap: 1.1, gravity: 1, wind: -14, moving: 0.3 }, "Rafales contraires."),
  L(9, 2, "Tempête", "storm", 14, [14, 22, 32], { speed: 1.15, gap: 1.1, gravity: 1.05, wind: 20, saws: 0.25 }, "Reste concentré dans l'orage."),
  L(10, 2, "Boss: Rafale Finale", "storm", 18, [18, 26, 36], { speed: 1.2, gap: 1.05, gravity: 1.05, wind: 24, moving: 0.5, saws: 0.3 }, "Tout à la fois."),
  // World 3 — Deep
  L(11, 3, "Plongée", "ocean", 12, [12, 20, 30], { speed: 0.95, gap: 1.25, gravity: 0.8 }, "Flotte, ne tombe pas."),
  L(12, 3, "Récif", "ocean", 14, [14, 22, 32], { speed: 1, gap: 1.1, gravity: 0.8, moving: 0.5 }, "Les coraux dansent."),
  L(13, 3, "Courant Froid", "arctic", 14, [14, 24, 34], { speed: 1.05, gap: 1.15, gravity: 0.95, wind: 18 }, "Glissant !"),
  L(14, 3, "Lasers Sous-Marins", "ocean", 16, [16, 24, 34], { speed: 1.05, gap: 1.2, gravity: 0.85, lasers: 0.45 }, "Les portails clignotent."),
  L(15, 3, "Boss: Le Kraken", "ocean", 20, [20, 30, 42], { speed: 1.1, gap: 1.05, gravity: 0.85, moving: 0.7, saws: 0.3, lasers: 0.3 }, "Chaos aquatique."),
  // World 4 — Space
  L(16, 4, "Zéro G", "space", 14, [14, 24, 34], { speed: 1.05, gap: 1.25, gravity: 0.65 }, "Impulsions courtes."),
  L(17, 4, "Ceinture d'Astéroïdes", "space", 16, [16, 26, 36], { speed: 1.15, gap: 1.1, gravity: 0.7, saws: 0.5 }, "Les rochers tournent."),
  L(18, 4, "Grille Cyber", "cyber", 18, [18, 28, 38], { speed: 1.25, gap: 1.1, gravity: 1, lasers: 0.5 }, "Vitesse néon."),
  L(19, 4, "Furtif", "cyber", 18, [18, 28, 40], { speed: 1.2, gap: 1.15, gravity: 1, invisible: 0.6 }, "Les murs disparaissent."),
  L(20, 4, "Boss: IA Rebelle", "cyber", 22, [22, 32, 44], { speed: 1.3, gap: 1.05, gravity: 1, lasers: 0.4, moving: 0.5, invisible: 0.3 }, "Elle apprend de toi."),
  // World 5 — Volcano
  L(21, 5, "Cendres", "volcano", 16, [16, 26, 36], { speed: 1.15, gap: 1.15, gravity: 1.05 }, "Chaud devant."),
  L(22, 5, "Lames de Magma", "volcano", 18, [18, 28, 40], { speed: 1.2, gap: 1.1, gravity: 1.05, saws: 0.55 }, "Rien que des scies."),
  L(23, 5, "Gravité Inversée", "volcano", 18, [18, 28, 40], { speed: 1.15, gap: 1.25, gravity: 1, flip: true }, "Haut = bas."),
  L(24, 5, "Éruption", "volcano", 20, [20, 30, 42], { speed: 1.3, gap: 1.05, gravity: 1.1, moving: 0.6, saws: 0.4 }, "Ça explose."),
  L(25, 5, "Boss: Cœur de Lave", "volcano", 25, [25, 36, 50], { speed: 1.35, gap: 1.0, gravity: 1.1, moving: 0.6, saws: 0.5, narrow: true }, "Survis à la fournaise."),
  // World 6 — Void
  L(26, 6, "Silence", "void", 18, [18, 28, 40], { speed: 1.25, gap: 1.1, gravity: 1.05 }, "Rien pour t'aider."),
  L(27, 6, "Illusions", "void", 20, [20, 30, 42], { speed: 1.3, gap: 1.1, gravity: 1.05, invisible: 0.8 }, "Fie-toi à ta mémoire."),
  L(28, 6, "Inversion Totale", "void", 22, [22, 32, 46], { speed: 1.3, gap: 1.15, gravity: 1.05, flip: true, moving: 0.4 }, "Ton cerveau va fondre."),
  L(29, 6, "Tout à la Fois", "void", 24, [24, 36, 50], { speed: 1.35, gap: 1.05, gravity: 1.1, moving: 0.6, saws: 0.4, lasers: 0.4, invisible: 0.4 }, "Bonne chance."),
  L(30, 6, "Boss: L'Infini", "void", 30, [30, 45, 60], { speed: 1.45, gap: 1.0, gravity: 1.12, moving: 0.7, saws: 0.5, lasers: 0.5, narrow: true, invisible: 0.3 }, "Le dernier test."),
];

// --------------------------- ACHIEVEMENTS ----------------------------------
export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  reward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "Premier Vol", desc: "Marquer 1 point", icon: "🐣", reward: 20 },
  { id: "score10", name: "Débutant", desc: "Marquer 10 points", icon: "🪶", reward: 40 },
  { id: "score25", name: "Habitué", desc: "Marquer 25 points", icon: "🕊️", reward: 80 },
  { id: "score50", name: "Vétéran", desc: "Marquer 50 points", icon: "🦅", reward: 160 },
  { id: "score100", name: "Légende", desc: "Marquer 100 points", icon: "👑", reward: 400 },
  { id: "coins100", name: "Collectionneur", desc: "Ramasser 100 pièces", icon: "🪙", reward: 50 },
  { id: "coins1000", name: "Riche", desc: "Ramasser 1000 pièces", icon: "💰", reward: 250 },
  { id: "duel1", name: "Duelliste", desc: "Gagner un duel", icon: "⚔️", reward: 50 },
  { id: "duel10", name: "Gladiateur", desc: "Gagner 10 duels", icon: "🏆", reward: 300 },
  { id: "online1", name: "Voyageur du Web", desc: "Jouer un duel en ligne", icon: "🌐", reward: 100 },
  { id: "lvl5", name: "Explorateur", desc: "Finir 5 niveaux", icon: "🗺️", reward: 60 },
  { id: "lvl15", name: "Aventurier", desc: "Finir 15 niveaux", icon: "🧭", reward: 200 },
  { id: "lvl30", name: "Conquérant", desc: "Finir les 30 niveaux", icon: "🌟", reward: 800 },
  { id: "stars45", name: "Perfectionniste", desc: "Obtenir 45 étoiles", icon: "✨", reward: 400 },
  { id: "skins5", name: "Styliste", desc: "Posséder 5 skins", icon: "🎨", reward: 100 },
  { id: "maps5", name: "Globe-trotteur", desc: "Débloquer 5 maps", icon: "🌍", reward: 150 },
  { id: "power20", name: "Chimiste", desc: "Utiliser 20 power-ups", icon: "⚡", reward: 120 },
  { id: "perfect10", name: "Chirurgien", desc: "10 passages parfaits", icon: "🎯", reward: 150 },
  { id: "games50", name: "Accro", desc: "Jouer 50 parties", icon: "🎮", reward: 150 },
];
