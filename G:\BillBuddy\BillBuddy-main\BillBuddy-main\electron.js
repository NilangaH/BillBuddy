
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Use Electron's built-in property to check for development mode.
// This is more reliable and removes the need for the 'electron-is-dev' package.
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // The preload script is not needed for this simple navigation.
      // preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Bill Buddy'
  });

  if (isDev) {
    // In development, load the Next.js development server.
    // Ensure the port matches the one in your `npm run dev` script.
    mainWindow.loadURL('http://localhost:9002/login');
    // Open DevTools automatically in development.
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the static HTML file from the 'build' directory.
    // The path should point to the entry point of your app, which is login.
    const prodPath = path.join(__dirname, 'build', 'login/index.html');
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
