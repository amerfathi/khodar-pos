const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { launchInstallerAfterAppExit, buildWaitForExitCommand } = require('../electron/update-installer.cjs');

test('update helper waits for the current app to exit before showing the installer', async () => {
  const child = Object.assign(new EventEmitter(), { unref: () => { unrefCount += 1; } });
  let unrefCount = 0;
  const started = launchInstallerAfterAppExit('C:\\test\\KhodarPOS-Setup.exe', 4321, (file, args, options) => {
    assert.equal(file, 'powershell.exe');
    assert.equal(args[0], '-NoLogo');
    assert.equal(args[1], '-NoProfile');
    assert.equal(args[2], '-NonInteractive');
    assert.equal(args[3], '-WindowStyle');
    assert.equal(args[4], 'Hidden');
    assert.equal(args[5], '-EncodedCommand');
    const command = Buffer.from(args[6], 'base64').toString('utf16le');
    assert.match(command, /Wait-Process -Id \$parentPid/);
    assert.match(command, /\$installerPath =/);
    assert.match(command, /Start-Process -FilePath \$installerPath/);
    assert.deepEqual(options, { detached: true, stdio: 'ignore', windowsHide: true });
    queueMicrotask(() => child.emit('spawn'));
    return child;
  });
  await started;
  assert.equal(unrefCount, 1);
});

test('handoff launch failure is returned without claiming success', async () => {
  const child = Object.assign(new EventEmitter(), { unref: () => assert.fail('failed helper must not be detached') });
  const started = launchInstallerAfterAppExit('installer.exe', 55, () => {
    queueMicrotask(() => child.emit('error', new Error('launch denied')));
    return child;
  });
  await assert.rejects(started, /launch denied/);
});

test('PowerShell handoff quotes installer paths and never terminates the running app', () => {
  const command = buildWaitForExitCommand("C:\\Users\\Owner\\App's\\KhodarPOS-Setup.exe", 9876);
  assert.match(command, /\$parentPid = 9876/);
  assert.match(command, /App''s/);
  assert.match(command, /Start-Process -FilePath/);
  assert.doesNotMatch(command, /Stop-Process|taskkill/i);
});

test('update handoff closes gracefully only after a wait helper has launched', () => {
  const main = fs.readFileSync(path.join(__dirname, '../electron/main.cjs'), 'utf8');
  const installHandler = main.slice(main.indexOf("ipcMain.handle('install-update'"), main.indexOf("app.whenReady()"));
  assert.match(installHandler, /await launchInstallerAfterAppExit\(verifiedUpdate\.installer, process\.pid\)/);
  assert.doesNotMatch(installHandler, /app\.quit\(\)/);
  const nsis = fs.readFileSync(path.join(__dirname, '../electron/installer.nsh'), 'utf8');
  assert.match(nsis, /nsProcess::_FindProcess \/NOUNLOAD "\$\{APP_EXECUTABLE_FILENAME\}"/);
  assert.doesNotMatch(nsis, /taskkill|nsExec::Exec/i);
});
