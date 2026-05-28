import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

let serverProcess = null;

function startExpressServer() {
  // Dalam development, backend ada di root project. Dalam production, ada di resources/backend.
  const backendPath = is.dev
    ? join(__dirname, '../../../backend/index.js')
    : join(process.resourcesPath, 'backend', 'index.js');
  
  // Karena kita ingin menjalankan node, kita set ELECTRON_RUN_AS_NODE
  serverProcess = require('child_process').fork(backendPath, [], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start Express server:', err);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`Express server exited with code ${code}`);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  
  // Start the Express backend
  startExpressServer();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Handle SPA routing request
  ipcMain.handle('get-page-content', async (event, pagePath) => {
    try {
      let filePath;
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        // Saat development (vite), file ada di src/renderer
        filePath = join(__dirname, `../../src/renderer/${pagePath}.html`);
      } else {
        // Saat production, file ada di folder out/renderer
        filePath = join(__dirname, `../renderer/${pagePath}.html`);
      }
      
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      } else {
        throw new Error('File tidak ditemukan: ' + filePath);
      }
    } catch (error) {
      console.error('Error reading page:', error);
      throw error;
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
