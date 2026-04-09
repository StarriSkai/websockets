import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 32;

export function attachChatServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Map();

  function getRoster() {
    const names = [];
    for (const ws of wss.clients) {
      const m = clients.get(ws);
      if (m?.name) names.push(m.name);
    }
    return names;
  }

  function broadcast(payload) {
    const data = JSON.stringify(payload);
    for (const ws of wss.clients) {
      if (ws.readyState === 1) ws.send(data);
    }
  }

  wss.on("connection", (ws) => {
    const id = randomUUID();
    clients.set(ws, { id, name: null });

    ws.send(JSON.stringify({ type: "connected", clientId: id }));
    ws.send(JSON.stringify({ type: "roster", names: getRoster() }));

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;

      const meta = clients.get(ws);
      if (!meta) return;

      if (msg.type === "join") {
        const trimmed =
          typeof msg.name === "string"
            ? msg.name.trim().slice(0, MAX_NAME_LENGTH)
            : "";
        const name = trimmed || `Guest-${id.slice(0, 8)}`;
        meta.name = name;
        broadcast({
          type: "system",
          text: `${name} joined the room`,
          at: Date.now(),
        });
        broadcast({ type: "roster", names: getRoster() });
        return;
      }

      if (msg.type === "message") {
        if (!meta.name) return;
        const text =
          typeof msg.text === "string"
            ? msg.text.trim().slice(0, MAX_MESSAGE_LENGTH)
            : "";
        if (!text) return;
        broadcast({
          type: "message",
          id: meta.id,
          name: meta.name,
          text,
          at: Date.now(),
        });
      }
    });

    ws.on("close", () => {
      const meta = clients.get(ws);
      clients.delete(ws);
      if (meta?.name) {
        broadcast({
          type: "system",
          text: `${meta.name} left`,
          at: Date.now(),
        });
        broadcast({ type: "roster", names: getRoster() });
      }
    });
  });

  return wss;
}
