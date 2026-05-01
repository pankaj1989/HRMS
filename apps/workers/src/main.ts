import 'reflect-metadata';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

async function start(): Promise<void> {
  // Phase 1.3 will wire BullMQ workers here.
  // For Phase 1.0, this is a long-running process that simply waits for shutdown.
  console.warn('[workers] HRMS workers process started — awaiting Phase 1.3 wiring.');

  await new Promise<void>((resolve) => {
    SHUTDOWN_SIGNALS.forEach((signal) => {
      process.once(signal, () => {
        console.warn(`[workers] received ${signal} — shutting down.`);
        resolve();
      });
    });
  });

  console.warn('[workers] graceful shutdown complete.');
  process.exit(0);
}

void start();
