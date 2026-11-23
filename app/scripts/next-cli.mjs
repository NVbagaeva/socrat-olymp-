import { constants, accessSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { delimiter, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

const codexNode = resolve(
  homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node',
);
const runningEmbeddedNode = process.execPath.includes('/Contents/Resources/cua_node/');
const candidates = [
  process.env.NEXT_NODE_BIN,
  ...(runningEmbeddedNode ? [codexNode] : []),
  process.execPath,
].filter((candidate) => candidate !== undefined);

const node = candidates.find((candidate) => {
  try {
    accessSync(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
});

if (node === undefined) {
  throw new Error('Не найден исполняемый Node.js для запуска Next.js.');
}

const nextCli = resolve('node_modules/next/dist/bin/next');
const env = {
  ...process.env,
  PATH: `${dirname(node)}${delimiter}${process.env.PATH ?? ''}`,
};
const child = spawn(node, [nextCli, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === null ? 1 : 128);
});
