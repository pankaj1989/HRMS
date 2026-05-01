import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export interface RunningPg {
  container: StartedPostgreSqlContainer;
  url: string;
  stop: () => Promise<void>;
}

export async function startPostgres(): Promise<RunningPg> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withUsername('hrms')
    .withPassword('hrms_test_password')
    .withDatabase('hrms_test')
    .withCommand([
      'postgres',
      '-c',
      'fsync=off',
      '-c',
      'synchronous_commit=off',
      '-c',
      'full_page_writes=off',
    ])
    .start();

  return {
    container,
    url: container.getConnectionUri(),
    stop: () => container.stop({ remove: true, removeVolumes: true }),
  };
}
