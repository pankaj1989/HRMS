import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env';

describe('loadEnv', () => {
  it('parses a valid DATABASE_URL', () => {
    const env = loadEnv({ DATABASE_URL: 'postgres://hrms:pw@localhost:5433/hrms' });
    expect(env.DATABASE_URL).toBe('postgres://hrms:pw@localhost:5433/hrms');
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a malformed DATABASE_URL', () => {
    expect(() => loadEnv({ DATABASE_URL: 'not a url' })).toThrow(/DATABASE_URL/);
  });

  it('rejects non-postgres protocols', () => {
    expect(() => loadEnv({ DATABASE_URL: 'mysql://x:y@h:3306/d' })).toThrow(/postgres/);
  });
});
