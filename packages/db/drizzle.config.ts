import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schemas/index.ts',
  out: './src/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://hrms:hrms_dev_password@localhost:5433/hrms',
  },
  verbose: true,
  strict: true,
});
