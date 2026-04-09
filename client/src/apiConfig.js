/** Empty in dev (Vite proxy). Set VITE_API_BASE on the static host (e.g. https://your-api.onrender.com). */
export function getApiBase() {
  const v = import.meta.env.VITE_API_BASE;
  return typeof v === "string" && v.trim() ? v.trim().replace(/\/$/, "") : "";
}

export function healthUrl() {
  const base = getApiBase();
  return base ? `${base}/api/health` : "/api/health";
}

export function wsUrl() {
  const explicit = import.meta.env.VITE_WS_URL;
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }
  const base = getApiBase();
  if (!base) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  }
  try {
    const u = new URL(base);
    const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${u.host}/ws`;
  } catch {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  }
}
