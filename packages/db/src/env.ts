import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .url({ message: 'DATABASE_URL must be a valid URL' })
    .refine((u) => u.startsWith('postgres://') || u.startsWith('postgresql://'), {
      message: 'DATABASE_URL must use postgres:// or postgresql:// protocol',
    }),
});

export type DbEnv = z.infer<typeof EnvSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): DbEnv {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid DB env: ${issues}`);
  }
  return parsed.data;
}
