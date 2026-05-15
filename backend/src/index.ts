import http from "node:http";
import { createExpressApplication } from "./app.js";
import { connectDB } from "./db/index.js";
import { initIO } from "./realtime/io.js";
import { env } from "./utils/env.js";

async function main() {
  try {
    const server = http.createServer(createExpressApplication());
    initIO(server);

    server.listen(env.PORT, () => {
      console.log(`Server is running on PORT: ${env.PORT}`);
    });
    await connectDB();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error Occured While creating server: ${message}`);
  }
}

main();
