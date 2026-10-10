import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const players = new Map();

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on("connection", (ws) => {
  const playerId = Math.random().toString(16).slice(2);
  players.set(playerId, { x: 0, y: 0 });

  ws.send(JSON.stringify({ type: "welcome", playerId }));

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === "input") {
      const p = players.get(playerId);
      if (!p) return;

      p.x += Number(msg.dx || 0);
      p.y += Number(msg.dy || 0);

      players.set(playerId, p);
      broadcast({ type: "state", playerId, players: Object.fromEntries(players) });
    }
  });

  ws.on("close", () => {
    players.delete(playerId);
    broadcast({ type: "state", players: Object.fromEntries(players) });
  });
});

console.log(`WS server listening on port ${PORT}`);
