import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./db.js";
import { attachChatServer } from "./chatSocket.js";

const port = Number(process.env.PORT) || 3000;

async function main() {
  await connectDb();
  console.log("Connected to MongoDB");

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
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
