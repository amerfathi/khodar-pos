const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { launchVisibleInstaller } = require('../electron/update-installer.cjs');

test('installer launches visibly and detached without inheriting application streams', async () => {
  const child = Object.assign(new EventEmitter(), { unref: () => { unrefCount += 1; } });
  let unrefCount = 0;
  const started = launchVisibleInstaller('C:\\test\\KhodarPOS-Setup.exe', (file, args, options) => {
    assert.equal(file, 'C:\\test\\KhodarPOS-Setup.exe');
    assert.deepEqual(args, []);
    assert.deepEqual(options, { detached: true, stdio: 'ignore', windowsHide: false });
    queueMicrotask(() => child.emit('spawn'));
    return child;
  });
  await started;
  assert.equal(unrefCount, 1);
});

test('installer launch failure is returned without claiming success', async () => {
  const child = Object.assign(new EventEmitter(), { unref: () => assert.fail('failed installer must not be detached') });
  const started = launchVisibleInstaller('installer.exe', () => {
    queueMicrotask(() => child.emit('error', new Error('launch denied')));
    return child;
  });
  await assert.rejects(started, /launch denied/);
});

test('update handoff does not quit immediately or force-kill unrelated processes', () => {
  const main = fs.readFileSync(path.join(__dirname, '../electron/main.cjs'), 'utf8');
  const installHandler = main.slice(main.indexOf("ipcMain.handle('install-update'"), main.indexOf("app.whenReady()"));
  assert.match(installHandler, /await launchVisibleInstaller\(verifiedUpdate\.installer\)/);
  assert.doesNotMatch(installHandler, /app\.quit\(\)/);
  const nsis = fs.readFileSync(path.join(__dirname, '../electron/installer.nsh'), 'utf8');
  assert.match(nsis, /nsProcess::_FindProcess \/NOUNLOAD "\$\{APP_EXECUTABLE_FILENAME\}"/);
  assert.doesNotMatch(nsis, /taskkill|nsExec::Exec/i);
});
