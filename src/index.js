import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./db.js";
import { attachChatServer } from "./chatSocket.js";

const port = Number(process.env.PORT) || 3000;

async function main() {
  await connectDb();

  const app = createApp();
  const host = "0.0.0.0";
  const server = app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });

  attachChatServer(server);
  console.log("WebSocket chat at /ws");

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
