import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { drawCreature } from "../game/render";
import { MAPS, SKINS, type GameMap, type Skin } from "../game/data";
import { sfx } from "../game/audio";

export function Btn({
  children, onClick, variant = "primary", className, disabled, size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "gold" | "sub";
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "relative select-none rounded-2xl font-extrabold tracking-wide transition-all active:translate-y-[2px] disabled:opacity-40 disabled:pointer-events-none";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-7 py-4 text-lg" };
  const variants = {
    primary: "bg-gradient-to-b from-sky-400 to-sky-600 text-white shadow-[0_5px_0_#0369a1] hover:brightness-110",
    gold: "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[0_5px_0_#b45309] hover:brightness-110",
    danger: "bg-gradient-to-b from-rose-400 to-rose-600 text-white shadow-[0_5px_0_#9f1239] hover:brightness-110",
    ghost: "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20",
    sub: "bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_5px_0_#5b21b6] hover:brightness-110",
  };
  return (
    <button
      disabled={disabled}
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl bg-slate-900/70 p-4 ring-1 ring-white/10 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

export function Slider({
  label, value, min, max, step, onChange, fmt,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-300">{label}</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-sky-300">
          {fmt ? fmt(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400
        [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400
        [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(56,189,248,.25)]"
      />
    </label>
  );
}

export function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <button
      onClick={() => {
        sfx.click();
        onChange(!value);
      }}
      className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-left ring-1 ring-white/10 transition hover:bg-white/10"
    >
      <span>
        <span className="block text-sm font-bold text-slate-100">{label}</span>
        {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
      </span>
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition", value ? "bg-sky-500" : "bg-slate-600")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", value ? "left-[22px]" : "left-0.5")} />
      </span>
    </button>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-950/50 p-1 ring-1 ring-white/10">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            sfx.click();
            onChange(t.id);
          }}
          className={cn(
            "flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-extrabold transition",
            value === t.id ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Animated canvas preview of a skin. */
export function SkinPreview({ skin, size = 64, spin = false }: { skin: Skin; size?: number; spin?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = size * dpr;
    cv.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 0.05;
      ctx.clearRect(0, 0, size, size);
      drawCreature(ctx, skin, size / 2, size / 2 + Math.sin(t) * size * 0.05, size * 0.26, spin ? Math.sin(t * 0.7) * 0.3 : Math.sin(t) * 0.16, t * 2.2, false, t / 0.05);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [skin, size, spin]);
  return <canvas ref={ref} style={{ width: size, height: size }} />;
}

export function MapPreview({ map, className }: { map: GameMap; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl ring-1 ring-white/15", className)}
      style={{ background: `linear-gradient(${map.sky[0]}, ${map.sky[1]} 55%, ${map.sky[2]})` }}
    >
      <div className="absolute inset-x-0 bottom-0 h-1/4" style={{ background: `linear-gradient(${map.ground}, ${map.groundDark})` }} />
      <div className="absolute bottom-[25%] left-[22%] h-[45%] w-3 rounded-t" style={{ background: map.pipeA }} />
      <div className="absolute top-0 left-[22%] h-[28%] w-3 rounded-b" style={{ background: map.pipeA }} />
      <div className="absolute bottom-[25%] left-[62%] h-[30%] w-3 rounded-t" style={{ background: map.pipeB }} />
      <div className="absolute top-0 left-[62%] h-[42%] w-3 rounded-b" style={{ background: map.pipeB }} />
      <div className="absolute left-[42%] top-[38%] h-2.5 w-2.5 rounded-full" style={{ background: map.accent }} />
    </div>
  );
}

export function Coin({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-black text-amber-300 ring-1 ring-amber-400/30", className)}>
      🪙 {amount.toLocaleString("fr-FR")}
    </span>
  );
}

export function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" style={{ fontSize: size }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? "text-amber-300" : "text-slate-600"}>
          ★
        </span>
      ))}
    </span>
  );
}

export const skinOf = (id: string) => SKINS.find((s) => s.id === id) ?? SKINS[0];
export const mapOf = (id: string) => MAPS.find((m) => m.id === id) ?? MAPS[0];
