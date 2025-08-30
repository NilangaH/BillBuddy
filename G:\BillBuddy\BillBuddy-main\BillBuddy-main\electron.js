
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Use Electron's built-in property to check for development mode.
// This is more reliable and removes the need for the 'electron-is-dev' package.
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  console.log('Creating main window...');
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      title: 'Bill Buddy'
    });

    console.log(`Running in ${isDev ? 'development' : 'production'} mode.`);

    const webContents = mainWindow.webContents;

    // --- Enhanced Logging ---
    webContents.on('did-start-loading', () => {
      console.log('Event: did-start-loading - Window has started loading content.');
    });

    webContents.on('did-finish-load', () => {
      console.log('Event: did-finish-load - Window has finished loading content.');
    });

    webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`Event: did-fail-load - Failed to load content. Code: ${errorCode}, Description: ${errorDescription}`);
    });
    
    webContents.on('crashed', (event, killed) => {
        console.error(`Event: crashed - The renderer process has crashed. Was it killed? ${killed}`);
    });
    // --- End Enhanced Logging ---


    if (isDev) {
      const devUrl = 'http://localhost:9002/login';
      console.log(`Loading URL for development: ${devUrl}`);
      mainWindow.loadURL(devUrl);
      // Open DevTools automatically in development
      webContents.openDevTools();
    } else {
      // In production, load the static HTML file from the 'build' directory.
      const prodPath = path.join(__dirname, 'build', 'login.html');
      console.log(`Loading file for production: ${prodPath}`);
      mainWindow.loadFile(prodPath);
    }

    mainWindow.on('closed', () => {
        console.log('Main window closed.');
        mainWindow = null
    });

  } catch (error) {
    console.error('Error creating window:', error);
  }
}

// Log uncaught exceptions in the main process
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception in Main Process:', error);
});

app.on('ready', () => {
    console.log('App is ready, calling createWindow...');
    createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated.');
  if (mainWindow === null) {
    console.log('Main window is null, creating a new one.');
    createWindow();
  }
});
