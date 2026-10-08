/**
 * Some tests take about 3 minutes. This script seeds the Jest cache with time
 * estimations to ensure the progress bar displays properly the first time Jest
 * executes the tests (otherwise it gives the impression of being stuck).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Exit if not run manually or during `npm install`.
const cmd = process.env.npm_command ?? 'node';
const allowed = {
  ci: true,
  install: true,
  node: true,
  'run-script': process.env.npm_lifecycle_event === 'prepare'
};

if (!(allowed[cmd])) {
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const durations = {
  [path.resolve(__dirname, '../test/fractions.test.ts')]: 200_000,
  [path.resolve(__dirname, '../test/random.test.ts')]: 20_000,
  [path.resolve(__dirname, '../test/big.test.ts')]: 200_000,
};

async function seedCache() {
  try {
    await import('jest-config');
    await import('@jest/test-sequencer');
  } catch (err) {
    process.exit(0);
  }

  const { readConfigs } = await import('jest-config');
  const TestSequencerModule = await import('@jest/test-sequencer');
  const TestSequencer = TestSequencerModule.default || TestSequencerModule;

  const { globalConfig, configs } = await readConfigs(
    { $0: 'jest', _: [] },
    [path.resolve(__dirname, '..')]
  );

  const projectConfig = configs[0];

  // TestContext matching Jest internal runner
  const mockContext = {
    config: projectConfig,
    hasteFS: {
      exists: () => true,
    },
  };

  const SequencerClass = TestSequencer.default || TestSequencer;
  const sequencer = new SequencerClass({
    contexts: [mockContext],
    globalConfig,
  });

  // Hashed cache path that Jest uses for this machine/config
  const cachePath = sequencer._getCachePath(mockContext);

  if (fs.existsSync(cachePath)) {
    process.exit(0);
  }

  const cacheData = {}; // { [filePath]: [status, durationMs] }
  for (const [filePath, durationMs] of Object.entries(durations)) {
    cacheData[filePath] = [1, durationMs];
  }

  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(cacheData), 'utf8');
}

seedCache().catch(console.error);
