import { useCallback, useEffect, useRef, useState } from "react";
import { FlappyEngine, H, W, type PlayerCfg, type Snapshot } from "../game/engine";
import type { NetMsg } from "../game/net";
import type { OnlineMatch } from "./OnlineDuel";
import { checkUnlocks, setProfile, useProfile } from "../game/store";
import { sfx, startMusic, stopMusic } from "../game/audio";
import { Btn, Coin, Panel } from "./UI";
import { cn } from "../utils/cn";

interface Props {
  match: OnlineMatch;
  onExit: () => void;
}

/** Online duel screen. Host simulates the shared world; guest mirrors it. */
export default function OnlineGameScreen({ match, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FlappyEngine | null>(null);
  const [profile] = useProfile();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [result, setResult] = useState<{ winner: number; scores: [number, number]; reason: string } | null>(null);
  const [rounds, setRounds] = useState<[number, number]>([0, 0]);
  const [roundNo, setRoundNo] = useState(1);
  const [rtt, setRtt] = useState(0);
  const [foeGone, setFoeGone] = useState(false);
  const [started, setStarted] = useState(false);
  const netRef = useRef({
    send: 0,
    flapSync: 0,
    pos: 0,
    myStartScore: 0,
    waitingNext: false,
  });
  const roundsRef = useRef(rounds);
  roundsRef.current = rounds;

  const isHost = match.session.isHost;
  const myIdx: 0 | 1 = match.me === 0 ? 0 : 1;
  const needed = 3; // BO5

  const makePlayers = useCallback((): PlayerCfg[] => {
    const p0: PlayerCfg = { skinId: isHost ? match.my.skin : match.foe.skin, trailId: isHost ? profile.trail : match.foe.trail as never, name: isHost ? match.my.name : match.foe.name, color: isHost ? match.my.color : match.foe.color };
    const p1: PlayerCfg = { skinId: isHost ? match.foe.skin : match.my.skin, trailId: isHost ? match.foe.trail as never : profile.trail, name: isHost ? match.foe.name : match.my.name, color: isHost ? match.foe.color : match.my.color };
    return [p0, p1];
  }, [isHost, match, profile.trail]);

  // ---------------- engine lifecycle (once) ----------------
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const eng = new FlappyEngine(cv, {
      mode: "online",
      mapId: profile.map,
      settings: profile.settings,
      players: makePlayers(),
      startScore: netRef.current.myStartScore,
      onTick: setSnap,
      onEnd: () => {},
    });
    engineRef.current = eng;
    eng.netPuppet = !isHost;
    if (!isHost) {
      // attach a dummy ctrl to host's bird (index 0) so the engine skips its physics
      eng.setController(0, {
        setTarget: (y) => {
          const bird = (eng as unknown as { birds: { ctrlY: number }[] }).birds[0];
          if (bird) bird.ctrlY = y;
        },
        flap: () => {},
      });
    } else {
      // host drives guest bird (index 1) purely through net packets
      eng.setController(1, {
        setTarget: (y) => {
          const bird = (eng as unknown as { birds: { ctrlY: number }[] }).birds[1];
          if (bird) bird.ctrlY = y;
        },
        flap: () => {},
      });
    }
    const onResize = () => eng.resize();
    window.addEventListener("resize", onResize);
    if (profile.settings.music > 0) startMusic(false);
    eng.setCountdown(3.4);
    setStarted(true);

    // ---------------- network wiring ----------------
    const session = match.session;
    const origOnMsg = (session as unknown as { cb: { onMsg: (m: NetMsg) => void } }).cb?.onMsg;

    const stepNet = () => {
      const e = engineRef.current;
      if (!e || !session.conn?.open) return;
      if (isHost) {
        if (e.phase === "running" || e.phase === "countdown") {
          session.send({ t: "world", w: e.getNetWorld(), me: e.getPlayerState(0), scores: [e.getPlayerState(0)!.score, e.getPlayerState(1)!.score] });
        }
      } else {
        const me = e.getPlayerState(myIdx);
        if (me) session.send({ t: "pos", y: Math.round(me.y), vy: Math.round(me.vy), flapPhase: Math.round(me.flapPhase) });
      }
    };
    const netTimer = window.setInterval(stepNet, 66); // ~15 Hz

    // in-game message handler (adds to lobby handler via stored callback)
    const onMsg = (m: NetMsg) => {
      origOnMsg?.(m);
      const e = engineRef.current;
      switch (m.t) {
        case "world": {
          if (isHost || !e) break;
          e.applyNetWorld(m.w as never);
          const me = m.me as { x: number; y: number; vy: number; flapPhase: number; alive: boolean } | null;
          if (me) {
            const bird = (e as unknown as { birds: { x: number; y: number; ctrlY: number; flapPhase: number; alive: boolean; dyingT: number }[] }).birds[0];
            if (bird) {
              bird.ctrlY = me.y;
              bird.flapPhase = Math.max(bird.flapPhase, me.flapPhase);
              if (!me.alive && bird.alive) {
                bird.alive = false;
                bird.dyingT = 0;
              }
            }
          }
          const sc = m.scores;
          const myBird = e.getPlayerState(myIdx);
          if (myBird && sc[myIdx] > myBird.score) {
            // score correction from host authority
            (e as unknown as { birds: { score: number }[] }).birds[myIdx].score = sc[myIdx];
          }
          break;
        }
        case "flap": {
          if (isHost && e) e.flap(1);
          break;
        }
        case "pos": {
          if (isHost && e) {
            const bird = (e as unknown as { birds: { ctrlY: number; flapPhase: number }[] }).birds[1];
            if (bird) {
              bird.ctrlY = m.y;
              bird.flapPhase = Math.max(bird.flapPhase, m.flapPhase);
            }
          }
          break;
        }
        case "end": {
          if (!isHost) {
            netRef.current.waitingNext = true;
            applyEnd(m.winner, m.scores, "fin de manche");
          }
          break;
        }
        case "next": {
          if (!isHost) {
            netRef.current.myStartScore = m.startScore || 0;
            restartRound();
          }
          break;
        }
        case "rematch": {
          if (!isHost) {
            setRounds([0, 0]);
            setRoundNo(1);
            restartRound();
          }
          break;
        }
        case "leave": {
          setFoeGone(true);
          if (isHost) {
            // resolve current round for the host
            const e2 = engineRef.current;
            if (e2 && !netRef.current.waitingNext) {
              netRef.current.waitingNext = true;
              const sc: [number, number] = [e2.getPlayerState(0)?.score ?? 0, e2.getPlayerState(1)?.score ?? 0];
              applyEnd(0, sc, "adversaire parti");
              setRounds((r) => { const n: [number, number] = [...r] as [number, number]; n[0]++; return n; });
            }
          } else {
            applyEnd(1, [0, 0], "hôte parti");
            setRounds((r) => { const n: [number, number] = [...r] as [number, number]; n[1]++; return n; });
          }
          break;
        }
        case "ping":
        case "pong":
          setRtt(session.lastRtt);
          break;
        default:
          break;
      }
    };
    // attach: replace lobby onMsg with game onMsg
    (session as unknown as { cb: { onMsg: (m: NetMsg) => void } }).cb.onMsg = onMsg;

    // host: detect round end locally (both dead => resolve)
    const endTimer = window.setInterval(() => {
      if (!isHost) return;
      const e = engineRef.current;
      if (!e || e.phase === "over") return;
      const st = [e.getPlayerState(0)!, e.getPlayerState(1)!].filter(Boolean);
      if (st.length < 2) return;
      const [a, b] = st;
      const n = netRef.current;
      if (!a.alive || !b.alive) {
        // determine winner
        let winner: number;
        if (a.alive && !b.alive) winner = 0;
        else if (!a.alive && b.alive) winner = 1;
        else winner = a.score >= b.score ? 0 : 1;
        const scores: [number, number] = [a.score, b.score];
        if (!n.waitingNext) {
          n.waitingNext = true;
          session.send({ t: "end", winner, scores });
          applyEnd(winner, scores, "fin de manche");
          setRounds((r) => {
            const nx: [number, number] = [...r] as [number, number];
            nx[winner]++;
            return nx;
          });
        }
      }
    }, 150);

    const applyEnd = (winner: number, scores: [number, number], reason: string) => {
      setResult({ winner, scores, reason });
      const wonByMe = winner === myIdx;
      if (wonByMe) sfx.win(); else sfx.lose();
      setProfile((pr) => {
        const np = { ...pr };
        np.games += 1;
        np.duelPlayed += 1;
        if (wonByMe) np.duelWins += 1;
        np.scores = [{ mode: "online duel", score: scores[myIdx], date: Date.now() }, ...np.scores].slice(0, 40);
        return np;
      });
      checkUnlocks();
    };



    // guest flap goes over the wire too
    if (!isHost && engineRef.current) {
      const engine = engineRef.current;
      const origFlap = engine.flap.bind(engine);
      engine.flap = (i = 0) => {
        if (i === myIdx) session.send({ t: "flap" });
        origFlap(i);
      };
    }

    return () => {
      clearInterval(netTimer);
      clearInterval(endTimer);
      window.removeEventListener("resize", onResize);
      eng.destroy();
      stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restartRound = () => {
    const e = engineRef.current;
    if (!e) return;
    setResult(null);
    netRef.current.waitingNext = false;
    e.setSettings(profile.settings);
    (e as unknown as { opts: { startScore: number } }).opts.startScore = netRef.current.myStartScore;
    e.restart();
    e.netPuppet = !isHost;
    netRef.current.myStartScore = 0;
    e.setCountdown(3.2);
  };

  const nextRound = () => {
    if (isHost) {
      match.session.send({ t: "next", startScore: 0 });
      setRoundNo((r) => r + 1);
      restartRound();
    }
  };

  const rematch = () => {
    if (isHost) {
      match.session.send({ t: "rematch" });
      setRounds([0, 0]);
      setRoundNo(1);
      restartRound();
    }
  };

  const quit = () => {
    match.session.send({ t: "leave" });
    onExit();
  };

  // pause not supported in online play; Esc = hint
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (["Space", "ArrowUp", "KeyW", "KeyZ"].includes(e.code)) {
        e.preventDefault();
        if (result) {
          if (isHost) nextRound() ;
        } else engineRef.current?.flap(myIdx);
      }
      if (e.code === "Escape") quit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, isHost, myIdx]);

  const onPointer = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!result) engineRef.current?.flap(myIdx);
  };

  const matchOver = rounds[0] >= needed || rounds[1] >= needed;
  const myScore = snap?.players[myIdx]?.score ?? 0;

  if (!started) return null;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-950 p-2 sm:p-4">
      <div className="mb-2 flex w-full max-w-[520px] items-center justify-between gap-2">
        <Btn variant="ghost" size="sm" onClick={quit}>✕ Quitter</Btn>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-300">
          🌐 En ligne · Manche {roundNo} · BO5
        </span>
        <span className={cn("rounded-full px-2.5 py-1 font-mono text-[11px] font-black ring-1",
          rtt < 90 ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" : rtt < 200 ? "bg-amber-500/15 text-amber-300 ring-amber-400/30" : "bg-rose-500/15 text-rose-300 ring-rose-400/30")}>
          {rtt > 0 ? `${rtt}ms` : "…"}
        </span>
      </div>

      <div className="mb-2 flex w-full max-w-[520px] items-center justify-center gap-3 text-xs font-black">
        <span style={{ color: isHost ? match.my.color : match.foe.color }}>
          {isHost ? match.my.name : match.foe.name} {rounds[0]}
        </span>
        <span className="text-slate-500">—</span>
        <span style={{ color: isHost ? match.foe.color : match.my.color }}>
          {rounds[1]} {isHost ? match.foe.name : match.my.name}
        </span>
      </div>

      <div
        className="relative touch-none overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10"
        style={{ aspectRatio: `${W}/${H}`, width: "min(520px, calc(100vw - 16px), calc((100dvh - 160px) * 0.6667))" }}
        onPointerDown={onPointer}
      >
        <canvas ref={canvasRef} className="h-full w-full" style={{ display: "block" }} />

        {foeGone && !result && (
          <div className="absolute inset-x-0 top-16 mx-auto w-max rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-black text-rose-200 ring-1 ring-rose-400/40">
            Adversaire déconnecté
          </div>
        )}

        {result && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
            <Panel className="w-full max-w-sm animate-[pop_.28s_ease-out] text-center">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {matchOver ? "Fin du match" : `Manche ${roundNo}`}
              </p>
              <h2 className={cn("mt-1 text-3xl font-black",
                result.winner === myIdx ? "text-emerald-400" : "text-rose-400")}>
                {result.winner === myIdx ? "VICTOIRE !" : "DÉFAITE"}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[isHost ? match.my.name : match.foe.name, isHost ? match.foe.name : match.my.name].map((n, i) => (
                  <div key={i} className={cn("rounded-2xl p-3 ring-1",
                    result.winner === i ? "bg-amber-400/15 ring-amber-400/40" : "bg-white/5 ring-white/10",
                    (i === myIdx) && "outline outline-2 outline-sky-400/60")}>
                    <p className="truncate text-xs font-bold text-slate-300">{n}{(i === myIdx) ? " (toi)" : ""}</p>
                    <p className="text-3xl font-black text-white">{result.scores[i as 0 | 1]}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm font-bold text-slate-300">Score du match : {rounds[0]} — {rounds[1]}</p>
              <div className="mt-4 flex flex-col gap-2">
                {matchOver ? (
                  <>
                    {isHost ? (
                      <Btn variant="gold" size="lg" onClick={rematch}>🔁 Revanche</Btn>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 animate-pulse">L'hôte décide de la revanche…</p>
                    )}
                    <Btn variant="ghost" onClick={quit}>✕ Quitter</Btn>
                  </>
                ) : isHost ? (
                  <>
                    <Btn size="lg" onClick={nextRound}>Manche suivante →</Btn>
                    <Btn variant="ghost" onClick={quit}>✕ Quitter</Btn>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-400 animate-pulse">En attente de la manche suivante…</p>
                    <Btn variant="ghost" onClick={quit}>✕ Quitter</Btn>
                  </>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>

      <div className="mt-2 flex w-full max-w-[520px] flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <Coin amount={profile.coins} />
        <span className="font-bold">Ton score : <span className="text-sky-300">{myScore}</span> · Espace / clic / tap</span>
      </div>
    </div>
  );
}
