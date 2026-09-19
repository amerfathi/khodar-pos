const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: 'براكه - كاشير ومحاسبة',
    icon: path.join(__dirname, 'icon.png'),
    frame: false, // Seamless frameless window (no white Windows titlebar)
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Window control IPC events from custom titlebar
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // Keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
    if (input.key === 'F5' && input.type === 'keyDown') {
      mainWindow.reload();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------------
// In-App Desktop Auto-Update Engine (Direct Download & Install)
// -------------------------------------------------------------
const fs = require('fs');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

let activeDownloadRequest = null;
let downloadedInstallerPath = null;

function downloadFileWithRedirects(url, destPath, onProgress, onDone, onError) {
  const protocol = url.startsWith('https') ? https : http;
  
  const req = protocol.get(url, { headers: { 'User-Agent': 'KhodarPOS-Desktop-Updater' } }, (res) => {
    // Handle HTTP Redirects (e.g. 301, 302, 307 from GitHub Releases to S3)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return downloadFileWithRedirects(res.headers.location, destPath, onProgress, onDone, onError);
    }

    if (res.statusCode !== 200) {
      return onError(new Error(`Download failed with HTTP status: ${res.statusCode}`));
    }

    const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
    let receivedBytes = 0;
    let startTime = Date.now();
    let lastEmitTime = 0;

    const fileStream = fs.createWriteStream(destPath);

    res.on('data', (chunk) => {
      receivedBytes += chunk.length;
      const now = Date.now();
      // Throttle IPC emissions to every 100ms
      if (now - lastEmitTime > 100 || receivedBytes === totalBytes) {
        lastEmitTime = now;
        const elapsedSec = Math.max((now - startTime) / 1000, 0.1);
        const speedBytesPerSec = Math.round(receivedBytes / elapsedSec);
        const percent = totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : 0;
        onProgress({
          receivedBytes,
          totalBytes,
          percent,
          speedBytesPerSec
        });
      }
    });

    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close(() => onDone(destPath));
    });

    fileStream.on('error', (err) => {
      fs.unlink(destPath, () => {});
      onError(err);
    });
  });

  req.on('error', (err) => {
    fs.unlink(destPath, () => {});
    onError(err);
  });

  activeDownloadRequest = req;
}

ipcMain.handle('download-update', async (event, downloadUrl) => {
  if (!downloadUrl) return { success: false, error: 'رابط التحميل غير متوفر' };

  try {
    const tempDir = app.getPath('temp');
    const destFile = path.join(tempDir, `KhodarPOS-Update-${Date.now()}.exe`);

    return new Promise((resolve) => {
      downloadFileWithRedirects(
        downloadUrl,
        destFile,
        (progress) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download-progress', progress);
          }
        },
        (savedPath) => {
          activeDownloadRequest = null;
          downloadedInstallerPath = savedPath;
          resolve({ success: true, filePath: savedPath });
        },
        (err) => {
          activeDownloadRequest = null;
          resolve({ success: false, error: err.message });
        }
      );
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('cancel-download-update', () => {
  if (activeDownloadRequest) {
    activeDownloadRequest.abort();
    activeDownloadRequest = null;
  }
});

ipcMain.handle('install-update', async (event, installerPath) => {
  const targetPath = installerPath || downloadedInstallerPath;
  if (!targetPath || !fs.existsSync(targetPath)) {
    return { success: false, error: 'ملف التحديث غير موجود' };
  }

  try {
    const tempDir = app.getPath('temp');

    // Clean any previous updater bat files
    try {
      const existingBats = fs.readdirSync(tempDir).filter(f => f.startsWith('khodar-updater-') && f.endsWith('.bat'));
      existingBats.forEach(f => {
        try { fs.unlinkSync(path.join(tempDir, f)); } catch (e) {}
      });
    } catch (e) {}

    const updaterBat = path.join(tempDir, `khodar-updater-${Date.now()}.bat`);
    const batContent = `@echo off
chcp 65001 >nul
timeout /t 1 /nobreak >nul
taskkill /F /T /IM "براكه.exe" >nul 2>&1
taskkill /F /T /IM "KhodarPOS.exe" >nul 2>&1
taskkill /F /T /IM "electron.exe" >nul 2>&1
timeout /t 1 /nobreak >nul

:WAIT_PROCESS
tasklist /FI "IMAGENAME eq براكه.exe" 2>NUL | find /I /N "براكه.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /T /IM "براكه.exe" >nul 2>&1
    timeout /t 1 /nobreak >nul
    goto WAIT_PROCESS
)

rem Launch interactive visual installer wizard with full Brraka branding
start "" "${targetPath}"
exit
`;
    fs.writeFileSync(updaterBat, batContent, 'utf-8');

    const child = spawn('cmd.exe', ['/c', updaterBat], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Immediately exit Electron cleanly to release all file locks
    setTimeout(() => {
      app.exit(0);
    }, 100);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
