import { useCallback, useEffect, useRef, useState } from "react";
import { healthUrl, wsUrl } from "./apiConfig.js";

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function App() {
  const wsRef = useRef(null);
  const listRef = useRef(null);
  const [apiOk, setApiOk] = useState(null);
  const [wsState, setWsState] = useState("connecting");
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [roster, setRoster] = useState([]);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(healthUrl())
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setApiOk(!!j?.ok))
      .catch(() => setApiOk(false));
  }, []);

  const append = useCallback((item) => {
    setEntries((prev) => [...prev, { ...item, key: `${item.at}-${Math.random()}` }]);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setWsState("open");
      setError("");
    };

    ws.onclose = () => {
      setWsState("closed");
      wsRef.current = null;
      setJoined(false);
    };

    ws.onerror = () => {
      setError(
        "WebSocket error — run the API locally or set VITE_API_BASE on the static build.",
      );
    };

    ws.onmessage = (ev) => {
      let data;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!data?.type) return;

      if (data.type === "roster" && Array.isArray(data.names)) {
        setRoster(data.names);
        return;
      }
      if (data.type === "system" && data.text) {
        append({ kind: "system", text: data.text, at: data.at });
        return;
      }
      if (
        data.type === "message" &&
        data.text &&
        data.name
      ) {
        append({
          kind: "chat",
          name: data.name,
          text: data.text,
          at: data.at,
        });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [append]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  function sendJoin(e) {
    e.preventDefault();
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "join", name: name.trim() || undefined }));
    setJoined(true);
    setDraft("");
  }

  function sendMessage(e) {
    e.preventDefault();
    const ws = wsRef.current;
    const text = draft.trim();
    if (!ws || ws.readyState !== WebSocket.OPEN || !text) return;
    ws.send(JSON.stringify({ type: "message", text }));
    setDraft("");
  }

  const canChat = joined && wsState === "open";

  return (
    <div className="app">
      <header className="header">
        <h1>Room</h1>
        <div className="badge" title="REST API health">
          <span
            className={`badge-dot ${apiOk === true ? "ok" : apiOk === false ? "bad" : "warn"}`}
          />
          API {apiOk === true ? "up" : apiOk === false ? "down" : "…"}
        </div>
        <div className="badge" title="WebSocket (API host when using VITE_API_BASE)">
          <span
            className={`badge-dot ${wsState === "open" ? "ok" : wsState === "connecting" ? "warn" : "bad"}`}
          />
          WS {wsState === "open" ? "live" : wsState === "connecting" ? "…" : "off"}
        </div>
      </header>

      <section className="panel">
        <h2>People here</h2>
        <div className="roster">
          {roster.length === 0 ? (
            <span style={{ color: "var(--muted)", border: "none", background: "none", padding: 0 }}>
              No one has joined yet
            </span>
          ) : (
            roster.map((n, i) => (
              <span key={`${n}-${i}`}>{n}</span>
            ))
          )}
        </div>
      </section>

      <section className="panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <h2>Messages</h2>
        <div className="messages" ref={listRef}>
          {entries.length === 0 ? (
            <p className="empty">Join with a name, then say hello.</p>
          ) : (
            entries.map((m) =>
              m.kind === "system" ? (
                <div key={m.key} className="msg system">
                  {m.text} · {formatTime(m.at)}
                </div>
              ) : (
                <div key={m.key} className="msg chat">
                  <div className="meta">
                    {m.name} · {formatTime(m.at)}
                  </div>
                  <div className="body">{m.text}</div>
                </div>
              ),
            )
          )}
        </div>

        {!joined ? (
          <form className="composer" onSubmit={sendJoin}>
            <p className="hint">
              Pick a display name to enter the room. Static deploys use your API URL via
              VITE_API_BASE.
            </p>
            <div className="form-row">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                disabled={wsState !== "open"}
                autoFocus
              />
              <button type="submit" disabled={wsState !== "open"}>
                Join
              </button>
            </div>
          </form>
        ) : (
          <form className="composer" onSubmit={sendMessage}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Message the room…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                disabled={!canChat}
                autoFocus
              />
              <button type="submit" disabled={!canChat || !draft.trim()}>
                Send
              </button>
            </div>
          </form>
        )}
        {error ? <p className="error">{error}</p> : null}
      </section>
    </div>
  );
}
