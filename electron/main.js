'use strict';

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const isWin = process.platform === 'win32';

let mainWindow = null;
let pyProc = null;
let serverReady = false;
let backendExited = false;
let logStream = null;
const logTail = [];

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

// In a packaged build the Python files are copied to resources/backend.
// In dev (`npm start`) the backend is the parent folder of electron/.
function getBackendDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend');
  }
  return path.join(__dirname, '..');
}

function readConfig(backendDir) {
  const candidates = [
    path.join(app.getPath('userData'), 'config.json'),
    path.join(backendDir, 'config.json'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        return JSON.parse(fs.readFileSync(c, 'utf-8'));
      }
    } catch (_) {
      /* ignore malformed config, fall through to defaults */
    }
  }
  return {};
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function getLogPath() {
  return path.join(app.getPath('userData'), 'backend.log');
}

function logLine(line) {
  const text = String(line).replace(/\s+$/, '');
  logTail.push(text);
  if (logTail.length > 200) logTail.shift();
  try {
    if (logStream) logStream.write(text + '\n');
  } catch (_) {}
  // eslint-disable-next-line no-console
  console.log('[backend]', text);
}

// ---------------------------------------------------------------------------
// Python resolution + backend spawn
// ---------------------------------------------------------------------------

function pythonCandidates(backendDir) {
  const list = [];
  if (process.env.SAM3_PYTHON) list.push({ cmd: process.env.SAM3_PYTHON, base: [] });
  if (isWin) {
    list.push({ cmd: path.join(backendDir, '.venv', 'Scripts', 'python.exe'), base: [] });
    list.push({ cmd: path.join(backendDir, 'python-embed', 'python.exe'), base: [] });
    list.push({ cmd: path.join(process.resourcesPath || '', 'python-embed', 'python.exe'), base: [] });
    list.push({ cmd: 'python', base: [] });
    list.push({ cmd: 'py', base: ['-3'] });
  } else {
    list.push({ cmd: path.join(backendDir, '.venv', 'bin', 'python'), base: [] });
    list.push({ cmd: path.join(backendDir, 'python-embed', 'bin', 'python3'), base: [] });
    list.push({ cmd: 'python3', base: [] });
    list.push({ cmd: 'python', base: [] });
  }
  return list;
}

function buildEnv(backendDir) {
  return Object.assign({}, process.env, {
    ELECTRON_RUN: '1',
    PYTHONUNBUFFERED: '1',
    PYTHONIOENCODING: 'utf-8',
    SAM3_CONFIG_DIR: app.getPath('userData'),
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    HF_DATASETS_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
  });
}

function trySpawn(candidate, appPy, env, cwd) {
  return new Promise((resolve, reject) => {
    // Skip absolute paths that clearly do not exist (fast path).
    if (path.isAbsolute(candidate.cmd) && !fs.existsSync(candidate.cmd)) {
      reject(new Error('introuvable: ' + candidate.cmd));
      return;
    }
    const args = [...candidate.base, appPy];
    let settled = false;
    let proc;
    try {
      proc = spawn(candidate.cmd, args, {
        cwd,
        env,
        detached: !isWin, // own process group on POSIX so we can kill the tree
        windowsHide: true,
      });
    } catch (err) {
      reject(err);
      return;
    }
    proc.once('spawn', () => {
      settled = true;
      resolve(proc);
    });
    proc.once('error', (err) => {
      if (!settled) reject(err);
    });
  });
}

async function startBackend(backendDir) {
  const appPy = path.join(backendDir, 'app.py');
  if (!fs.existsSync(appPy)) {
    throw new Error('app.py introuvable dans: ' + backendDir);
  }
  const env = buildEnv(backendDir);
  const candidates = pythonCandidates(backendDir);
  const tried = [];

  for (const candidate of candidates) {
    try {
      const proc = await trySpawn(candidate, appPy, env, backendDir);
      logLine('Python lancé via: ' + candidate.cmd + ' ' + candidate.base.join(' '));
      return proc;
    } catch (err) {
      tried.push(candidate.cmd + ' (' + err.message + ')');
    }
  }
  throw new Error(
    'Aucun interpréteur Python utilisable.\nTentatives:\n - ' + tried.join('\n - ')
  );
}

// ---------------------------------------------------------------------------
// Server readiness polling
// ---------------------------------------------------------------------------

function pingOnce(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (backendExited) return false;
    // eslint-disable-next-line no-await-in-loop
    if (await pingOnce(url)) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

// ---------------------------------------------------------------------------
// Window + status helpers
// ---------------------------------------------------------------------------

function setStatus(msg) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const payload = JSON.stringify(String(msg));
  mainWindow.webContents
    .executeJavaScript(`window.setStatus && window.setStatus(${payload});`)
    .catch(() => {});
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 940,
    minHeight: 640,
    backgroundColor: '#0e1116',
    show: true,
    autoHideMenuBar: true,
    title: 'SAM3 Mask Creator',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  // Open external links (target=_blank) in the system browser, not the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showFatal(message) {
  const logPath = getLogPath();
  const detail =
    message +
    '\n\nDernières lignes du backend:\n' +
    logTail.slice(-12).join('\n');
  const choice = dialog.showMessageBoxSync({
    type: 'error',
    title: 'SAM3 Mask Creator — erreur de démarrage',
    message: 'Le moteur Python n\'a pas pu démarrer.',
    detail,
    buttons: ['Ouvrir le journal', 'Quitter'],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
  });
  if (choice === 0) {
    shell.openPath(logPath).catch(() => {});
  }
  app.quit();
}

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------

async function boot() {
  const backendDir = getBackendDir();
  const cfg = readConfig(backendDir);
  const host = cfg.host || '127.0.0.1';
  const port = parseInt(cfg.port, 10) || 7860;
  const url = `http://${host}:${port}`;

  try {
    logStream = fs.createWriteStream(getLogPath(), { flags: 'w' });
  } catch (_) {
    logStream = null;
  }

  createWindow();
  setStatus('Démarrage du moteur Python…');

  try {
    pyProc = await startBackend(backendDir);
  } catch (err) {
    showFatal(err.message);
    return;
  }

  pyProc.stdout.on('data', (d) => {
    d.toString().split(/\r?\n/).forEach((line) => {
      if (line.trim()) logLine(line);
    });
  });
  pyProc.stderr.on('data', (d) => {
    d.toString().split(/\r?\n/).forEach((line) => {
      if (line.trim()) logLine(line);
    });
  });
  pyProc.on('exit', (code, signal) => {
    backendExited = true;
    logLine(`Backend terminé (code=${code}, signal=${signal})`);
    if (!serverReady && mainWindow && !mainWindow.isDestroyed()) {
      showFatal(
        'Le processus Python s\'est arrêté avant que le serveur soit prêt ' +
          `(code ${code}). Vérifiez que PyTorch et les dépendances sont installés.`
      );
    }
  });

  setStatus('Initialisation du serveur (PyTorch, modèle SAM3)…');

  const ok = await waitForServer(url, 180000); // up to 3 min for first torch import
  if (!ok) {
    if (!backendExited) {
      showFatal('Le serveur n\'a pas répondu à temps sur ' + url + '.');
    }
    return;
  }

  serverReady = true;
  setStatus('Connexion à l\'interface…');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(url);
  }
}

// ---------------------------------------------------------------------------
// Lifecycle / cleanup
// ---------------------------------------------------------------------------

function killBackend() {
  if (!pyProc || pyProc.killed) return;
  const pid = pyProc.pid;
  try {
    if (isWin) {
      spawn('taskkill', ['/pid', String(pid), '/T', '/F']);
    } else {
      // Negative pid kills the whole process group (we spawned detached).
      process.kill(-pid, 'SIGTERM');
    }
  } catch (_) {
    try {
      pyProc.kill();
    } catch (__) {}
  }
  pyProc = null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    boot();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) boot();
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('before-quit', killBackend);
  app.on('will-quit', killBackend);
  process.on('exit', killBackend);
  process.on('SIGINT', () => app.quit());
  process.on('SIGTERM', () => app.quit());
}
