import "dotenv/config";
import { defineConfig } from "prisma/config";

// CLI migrations need the direct Postgres URL. App queries use DATABASE_URL
// (the pooler on Supabase) via the driver adapter in src/lib/prisma.ts.
const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
