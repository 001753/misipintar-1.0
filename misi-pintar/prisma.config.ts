import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  datasources: {
    db: {
      adapter: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error("DATABASE_URL is not set");
        return new PrismaPg({ connectionString });
      },
    },
  },
  migrate: {
    async beforeApply() {},
  },
});
