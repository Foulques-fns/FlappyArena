import { useCallback, useEffect, useRef, useState } from "react";
import { NetSession, randomCode, type NetMsg, type NetState } from "../game/net";
import { SKINS } from "../game/data";
import { useProfile } from "../game/store";
import { Btn, Panel, SkinPreview } from "./UI";
import { sfx } from "../game/audio";

export interface OnlineMatch {
  session: NetSession;
  me: number; // my bird index in the world: host=0, guest=1
  my: { name: string; skin: string; color: string };
  foe: { name: string; skin: string; trail: string; color: string };
  seed: number;
}

export default function OnlineDuel({ onBack, onStart }: { onBack: () => void; onStart: (m: OnlineMatch) => void }) {
  const [p] = useProfile();
  const [mode, setMode] = useState<"menu" | "host" | "join">("menu");
  const [code, setCode] = useState(randomCode());
  const [joinCode, setJoinCode] = useState("");
  const [state, setState] = useState<NetState>("idle");
  const [detail, setDetail] = useState("");
  const [foe, setFoe] = useState<{ name: string; skin: string; trail: string } | null>(null);
  const [myName, setMyName] = useState("Joueur");
  const sessionRef = useRef<NetSession | null>(null);
  const foeRef = useRef<typeof foe>(null);
  foeRef.current = foe;

  useEffect(() => () => sessionRef.current?.destroy(), []);

  const cleanup = useCallback(() => {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setFoe(null);
    setState("idle");
    setDetail("");
  }, []);

  const buildMatch = useCallback(
    (session: NetSession, f: { name: string; skin: string; trail: string }): OnlineMatch => ({
      session,
      me: session.isHost ? 0 : 1,
      my: { name: myName, skin: p.skin, color: session.isHost ? "#38bdf8" : "#fb7185" },
      foe: { name: f.name, skin: f.skin, trail: f.trail, color: session.isHost ? "#fb7185" : "#38bdf8" },
      seed: Date.now(),
    }),
    [myName, p.skin],
  );

  const makeSession = useCallback(
    (isHost: boolean, c: string) => {
      cleanup();
      let started = false;
      const session = new NetSession({
        onState: (s, d) => {
          setState(s);
          setDetail(d ?? "");
          if (s === "closed") setFoe(null);
        },
        onPeerInfo: (name, skin, trail) => {
          setFoe({ name, skin, trail });
          sfx.power();
        },
        onMsg: (m: NetMsg) => {
          // guest side: host launched the fight
          if (m.t === "join_world" && !session.isHost && !started) {
            started = true;
            const f = foeRef.current;
            if (f) onStart(buildMatch(session, f));
          }
          // host side: guest also pings its presence — handled by accept flow
        },
      });
      sessionRef.current = session;
      if (isHost) session.host(c, myName, p.skin, p.trail, p.map);
      else session.join(c, myName, p.skin, p.trail);
    },
    [cleanup, myName, p.skin, p.trail, p.map, onStart, buildMatch],
  );

  const beginAsHost = () => {
    const s = sessionRef.current;
    const f = foeRef.current;
    if (!s || !f) return;
    s.send({ t: "join_world" });
    onStart(buildMatch(s, f));
  };

  const stateLabel: Partial<Record<NetState, string>> = {
    hosting: "Connexion au serveur de jumelage…",
    waiting: "En attente d'un challenger…",
    connecting: "Recherche de la partie…",
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-3 p-4 pb-10">
      <header className="flex items-center justify-between">
        <Btn variant="ghost" size="sm" onClick={() => { cleanup(); onBack(); }}>← Duel</Btn>
        <h1 className="text-xl font-black text-white sm:text-2xl">🌐 Duel en ligne</h1>
        <span className="w-16" />
      </header>

      {mode === "menu" && (
        <>
          <Panel className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Ton pseudo</label>
            <input
              value={myName}
              maxLength={14}
              onChange={(e) => setMyName(e.target.value || "Joueur")}
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-sky-400"
            />
          </Panel>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => { setCode(randomCode()); setMode("host"); }}
              className="group rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-5 text-left ring-1 ring-white/15 transition hover:scale-[1.02]"
            >
              <div className="text-4xl">🎪</div>
              <p className="mt-1 text-xl font-black text-white">Créer une partie</p>
              <p className="text-xs font-bold text-white/80">Tu génères un code à envoyer à ton ami.</p>
            </button>
            <button
              onClick={() => setMode("join")}
              className="group rounded-3xl bg-gradient-to-br from-sky-400 to-sky-600 p-5 text-left ring-1 ring-white/15 transition hover:scale-[1.02]"
            >
              <div className="text-4xl">🎟️</div>
              <p className="mt-1 text-xl font-black text-white">Rejoindre</p>
              <p className="text-xs font-bold text-white/80">Tu as un code ? Entre dans l'arène.</p>
            </button>
          </div>
          <Panel className="text-center text-xs leading-relaxed text-slate-400">
            <ConnTips />
          </Panel>
        </>
      )}

      {mode === "host" && state !== "lobby" && (
        <Panel className="flex flex-col items-center gap-4 py-8">
          {state === "idle" && (
            <>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Ton code de partie</p>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-slate-950/70 px-6 py-4 font-mono text-4xl font-black tracking-[0.3em] text-amber-300 ring-1 ring-amber-400/40">
                  {code}
                </span>
                <Btn variant="ghost" onClick={() => setCode(randomCode())}>↻</Btn>
              </div>
              <Btn size="lg" onClick={() => makeSession(true, code)}>🚀 Ouvrir la partie</Btn>
              <p className="max-w-xs text-center text-xs text-slate-500">Envoie ce code à ton ami — il choisit « Rejoindre » dans son jeu.</p>
            </>
          )}
          {(state === "hosting" || state === "waiting") && (
            <>
              <span className="animate-pulse text-4xl">📡</span>
              <p className="rounded-2xl bg-slate-950/70 px-6 py-4 font-mono text-4xl font-black tracking-[0.3em] text-amber-300 ring-1 ring-amber-400/40">{code}</p>
              <button
                onClick={() => { void navigator.clipboard?.writeText(code); }}
                className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-slate-300 ring-1 ring-white/15 hover:bg-white/20"
              >
                📋 Copier le code
              </button>
              <p className="animate-pulse text-sm font-bold text-slate-300">{stateLabel[state]}</p>
              <Btn variant="ghost" onClick={() => { cleanup(); }}>Annuler</Btn>
            </>
          )}
          {state === "error" && (
            <>
              <span className="text-4xl">😵</span>
              <p className="text-center text-sm font-bold text-rose-300">{detail}</p>
              <Btn onClick={() => makeSession(true, code)}>↻ Réessayer</Btn>
              <Btn variant="ghost" onClick={() => setState("idle")}>← Retour</Btn>
            </>
          )}
          {state === "closed" && (
            <>
              <span className="text-4xl">💔</span>
              <p className="text-sm font-bold text-slate-300">{detail}</p>
              <Btn onClick={() => makeSession(true, code)}>↻ Réouvrir la partie</Btn>
            </>
          )}
        </Panel>
      )}

      {mode === "join" && state !== "lobby" && (
        <Panel className="flex flex-col items-center gap-4 py-8">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Code de la partie</p>
          <input
            value={joinCode}
            maxLength={5}
            placeholder="XXXXX"
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter" && joinCode.length >= 5) makeSession(false, joinCode); }}
            className="w-56 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.3em] text-sky-300 outline-none focus:border-sky-400"
          />
          {state === "connecting" ? (
            <p className="animate-pulse text-sm font-bold text-slate-300">{stateLabel[state]}</p>
          ) : (
            <Btn size="lg" disabled={joinCode.length < 5} onClick={() => makeSession(false, joinCode)}>
              ⚔️ Rejoindre le combat
            </Btn>
          )}
          {state === "error" && <p className="text-center text-sm font-bold text-rose-300">{detail}</p>}
          <Btn variant="ghost" onClick={() => { cleanup(); setMode("menu"); }}>← Retour</Btn>
        </Panel>
      )}

      {state === "lobby" && foe && (
        <Panel className="flex flex-col items-center gap-4 py-6">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-300">✅ Liaison établie</p>
          <div className="grid w-full grid-cols-2 gap-3">
            {[
              { n: myName, sk: p.skin, col: sessionRef.current?.isHost ? "#38bdf8" : "#fb7185", tag: "TOI" },
              { n: foe.name, sk: foe.skin, col: sessionRef.current?.isHost ? "#fb7185" : "#38bdf8", tag: mode === "host" ? "INVITÉ" : "HÔTE" },
            ].map((pl, i) => (
              <div key={i} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: `${pl.col}22`, color: pl.col }}>{pl.tag}</span>
                <SkinPreview skin={SKINS.find((s) => s.id === pl.sk) ?? SKINS[0]} size={62} />
                <p className="text-sm font-black text-white">{pl.n}</p>
                <p className="text-[10px] text-slate-500">{SKINS.find((s) => s.id === pl.sk)?.name}</p>
              </div>
            ))}
          </div>
          {mode === "host" ? (
            <>
              <Btn size="lg" variant="danger" onClick={beginAsHost} className="w-full">⚔️ LANCER LE COMBAT</Btn>
              <p className="max-w-xs text-center text-[11px] text-slate-400">
                Même monde, deux oiseaux, un seul survivant par manche. Première chute = manche perdue.
              </p>
            </>
          ) : (
            <p className="animate-pulse text-sm font-bold text-slate-300">En attente que l'hôte lance le combat…</p>
          )}
          <Btn variant="ghost" size="sm" onClick={() => { cleanup(); setMode("menu"); }}>Quitter le salon</Btn>
        </Panel>
      )}

      <Panel className="text-[11px] leading-relaxed text-slate-500">
        <p className="mb-1 font-black text-slate-400">RÈGLES DU DUEL EN LIGNE</p>
        Les deux oiseaux volent sur le même monde synchronisé en temps réel. Dès qu'un joueur meurt, la manche se termine — le survivant gagne le point. En cas de déconnexion, la manche est offerte à l'adversaire. Rejoindre en retard compense le score.
      </Panel>
    </div>
  );
}

function ConnTips() {
  return (
    <>
      <p>Connexion directe navigateur-à-navigateur (<span className="font-bold text-slate-300">WebRTC P2P</span>), sans serveur de jeu.</p>
      <p className="mt-1">⚡ Le monde est hébergé par le créateur de la partie — mêmes tuyaux, mêmes pièces, en direct.</p>
    </>
  );
}
