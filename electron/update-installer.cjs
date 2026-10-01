const { spawn } = require('node:child_process');

function buildWaitForExitCommand(installer, parentPid) {
  if (typeof installer !== 'string' || !installer.trim()) {
    throw new TypeError('A verified installer path is required');
  }
  if (!Number.isSafeInteger(parentPid) || parentPid < 1) {
    throw new TypeError('A valid parent process ID is required');
  }

  const escapeLiteral = value => value.replaceAll("'", "''");
  return [
    "$ErrorActionPreference = 'Stop'",
    `$parentPid = ${parentPid}`,
    `$installerPath = '${escapeLiteral(installer)}'`,
    "function Show-UpdateError($message) { try { Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($message, 'براكه', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null } catch {} }",
    'try { Wait-Process -Id $parentPid -Timeout 180 -ErrorAction SilentlyContinue } catch {}',
    "if (Get-Process -Id $parentPid -ErrorAction SilentlyContinue) { Show-UpdateError 'لم يُغلق براكه خلال المهلة. أغلقه ثم أعد تشغيل التحديث.'; exit 2 }",
    "if (-not (Test-Path -LiteralPath $installerPath -PathType Leaf)) { Show-UpdateError 'تعذر العثور على ملف التحديث المحقَّق. أعد تنزيل التحديث.'; exit 3 }",
    "try { Start-Process -FilePath $installerPath } catch { Show-UpdateError 'تعذر تشغيل مثبت التحديث. أعد تنزيل التحديث وحاول مرة أخرى.'; exit 4 }",
  ].join('; ');
}

/**
 * Starts a detached Windows helper which waits for this app to exit gracefully,
 * then opens the already-verified installer. It never terminates the app itself.
 * @param {string} installer
 * @param {number} parentPid
 * @param {(file: string, args: string[], options: { detached: boolean, stdio: 'ignore', windowsHide: boolean }) => import('node:events').EventEmitter & { unref(): void }} spawnProcess
 */
async function launchInstallerAfterAppExit(installer, parentPid, spawnProcess = spawn) {
  const command = buildWaitForExitCommand(installer, parentPid);
  const encodedCommand = Buffer.from(command, 'utf16le').toString('base64');
  const child = spawnProcess('powershell.exe', [
    '-NoLogo', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden',
    '-EncodedCommand', encodedCommand,
  ], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', reject);
  });
  child.unref();
}

module.exports = { buildWaitForExitCommand, launchInstallerAfterAppExit };
