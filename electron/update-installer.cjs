const { spawn } = require('node:child_process');

/**
 * @param {string} installer
 * @param {(file: string, args: string[], options: { detached: boolean, stdio: 'ignore', windowsHide: boolean }) => import('node:events').EventEmitter & { unref(): void }} spawnProcess
 */
async function launchVisibleInstaller(installer, spawnProcess = spawn) {
  const child = spawnProcess(installer, [], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', reject);
  });
  child.unref();
}

module.exports = { launchVisibleInstaller };
