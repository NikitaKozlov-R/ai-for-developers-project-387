import { createServer } from "node:http";

import { PORT } from "./config.ts";
import { createRequestListener } from "./router.ts";
import { adminRoutes } from "./routes/admin.ts";
import { internalRoutes } from "./routes/internal.ts";
import { publicRoutes } from "./routes/public.ts";

const server = createServer(
  createRequestListener([...adminRoutes, ...publicRoutes, ...internalRoutes]),
);

server.listen(PORT, () => {
  console.log(`Simple Cal.com API: http://localhost:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
