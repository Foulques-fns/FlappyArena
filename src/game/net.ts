import Peer, { type DataConnection } from "peerjs";

export type NetMsg =
  | { t: "hello"; name: string; skin: string; trail: string; map: string }
  | { t: "accept"; name: string; skin: string; trail: string; map: string }
  | { t: "deny"; reason: string }
  | { t: "join_world" }
  | { t: "world"; w: unknown; me: unknown; scores: [number, number] }
  | { t: "flap" }
  | { t: "pos"; y: number; vy: number; flapPhase: number }
  | { t: "end"; winner: number; scores: [number, number] }
  | { t: "next"; startScore: number }
  | { t: "leave" }
  | { t: "ping"; n: number }
  | { t: "pong"; n: number }
  | { t: "rematch" };

const PREFIX = "flappy-arena-duel-";
const LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomCode(): string {
  let c = "";
  for (let i = 0; i < 5; i++) c += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return c;
}

export type NetState =
  | "idle" | "hosting" | "waiting" | "connecting" | "lobby" | "playing" | "closed" | "error";

export interface NetCallbacks {
  onState: (s: NetState, detail?: string) => void;
  onMsg: (m: NetMsg) => void;
  onPeerInfo: (name: string, skin: string, trail: string) => void;
}

export class NetSession {
  private peer: Peer | null = null;
  conn: DataConnection | null = null;
  code = "";
  isHost = false;
  lastRtt = 0;
  private pingTimer: number | null = null;
  private cb: NetCallbacks;

  constructor(cb: NetCallbacks) {
    this.cb = cb;
  }

  host(code: string, name: string, skin: string, trail: string, map: string) {
    this.isHost = true;
    this.code = code;
    this.cb.onState("hosting");
    try {
      this.peer = new Peer(PREFIX + code.toUpperCase(), { debug: 0 });
    } catch {
      this.cb.onState("error", "Connexion impossible");
      return;
    }
    this.peer.on("open", () => this.cb.onState("waiting"));
    this.peer.on("error", (err) => {
      const msg = String(err.type ?? err);
      if (msg.includes("taken") || msg.includes("unavailable-id")) this.cb.onState("error", "Code déjà utilisé, régénère-en un autre.");
      else if (msg.includes("network") || msg.includes("lost")) this.cb.onState("error", "Réseau indisponible — le serveur de jumelage est injoignable.");
      else this.cb.onState("error", `Erreur : ${msg.split(":")[0]}`);
    });
    this.peer.on("connection", (conn) => {
      if (this.conn) {
        conn.on("open", () => conn.close());
        return;
      }
      this.conn = conn;
      this.attach(conn);
      conn.on("open", () => {
        // guest will send hello; host answers with accept
        conn.send({ t: "accept", name, skin, trail, map } as never);
        this.cb.onState("lobby");
        this.startPing();
      });
    });
  }

  join(code: string, name: string, skin: string, trail: string) {
    this.isHost = false;
    this.code = code.toUpperCase();
    this.cb.onState("connecting");
    try {
      this.peer = new Peer({ debug: 0 });
    } catch {
      this.cb.onState("error", "Connexion impossible");
      return;
    }
    let opened = false;
    this.peer.on("open", () => {
      opened = true;
      const conn = this.peer!.connect(PREFIX + this.code, { reliable: true });
      const to = setTimeout(() => {
        if (!conn.open) {
          conn.close();
          this.cb.onState("error", "Partie introuvable. Vérifie le code.");
        }
      }, 8000);
      conn.on("open", () => {
        clearTimeout(to);
        this.conn = conn;
        this.attach(conn);
        conn.send({ t: "hello", name, skin, trail, map: "" });
        this.cb.onState("lobby");
        this.startPing();
      });
      conn.on("error", () => {
        clearTimeout(to);
        this.cb.onState("error", "Partie introuvable. Vérifie le code.");
      });
    });
    this.peer.on("error", (err) => {
      if (!opened) {
        const msg = String(err.type ?? err);
        this.cb.onState("error", msg.includes("peer-unavailable") ? "Partie introuvable. Vérifie le code." : "Réseau indisponible — le serveur de jumelage est injoignable.");
      } else {
        this.cb.onState("closed", "Liaison perdue.");
      }
    });
  }

  private attach(conn: DataConnection) {
    conn.on("data", (d) => {
      const m = d as NetMsg;
      if (m.t === "hello") this.cb.onPeerInfo(m.name, m.skin, m.trail);
      else if (m.t === "accept") this.cb.onPeerInfo(m.name, m.skin, m.trail);
      else if (m.t === "pong") this.lastRtt = Math.max(1, Math.round(performance.now() - m.n));
      this.cb.onMsg(m);
    });
    conn.on("close", () => {
      this.stopPing();
      this.conn = null;
      this.cb.onState("closed", "Adversaire déconnecté");
    });
    conn.on("error", () => {
      this.cb.onState("closed", "Liaison perdue");
    });
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = window.setInterval(() => {
      this.send({ t: "ping", n: performance.now() });
    }, 1500);
  }

  private stopPing() {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  send(m: NetMsg) {
    try {
      if (this.conn?.open) this.conn.send(m);
    } catch {
      /* noop */
    }
  }

  destroy() {
    this.stopPing();
    try {
      this.conn?.close();
    } catch { /* noop */ }
    try {
      this.peer?.destroy();
    } catch { /* noop */ }
    this.conn = null;
    this.peer = null;
  }
}
