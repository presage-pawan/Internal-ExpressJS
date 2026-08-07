import app from "./app.js";
import { SERVER_DETAILS } from "./configDB.js";
import { initDbConnections } from './_db/index.js';
import { disconnectAllMongoConnections } from './_db/db.connection.js';

const server = app.listen(SERVER_DETAILS.port, async () => {
  await initDbConnections();
  console.log(`🚀 Server running on ${SERVER_DETAILS.protocol}://${SERVER_DETAILS.host}:${SERVER_DETAILS.port}`);
});

const shutdown = async () => {
  console.log("\nGracefully shutting down...");
  await disconnectAllMongoConnections();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);