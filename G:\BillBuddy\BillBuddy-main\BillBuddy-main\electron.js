
const { app, BrowserWindow, dialog } = require('electron');
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
      // Enable developer tools in the packaged app for debugging.
      // We can remove this later.
      devTools: true,
    },
    title: 'Bill Buddy'
  });

  // Open DevTools automatically to see console errors.
  mainWindow.webContents.openDevTools();

  if (isDev) {
    // In development, load the Next.js development server.
    // Ensure the port matches the one in your `npm run dev` script.
    mainWindow.loadURL('http://localhost:9002/login');
  } else {
    // In production, load the static HTML file from the 'build' directory.
    // The path should point to the entry point of your app, which is login.
    const prodPath = path.join(__dirname, 'build', 'login', 'index.html');
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Catch any unhandled errors in the main process
process.on('uncaughtException', (error) => {
  const messageBoxOptions = {
    type: 'error',
    title: 'Unhandled Error in Main Process',
    message: 'An unexpected error occurred. Please report this.',
    detail: error.stack,
  };
  dialog.showErrorBox(messageBoxOptions.title, messageBoxOptions.detail);
  app.quit();
});


app.on('ready', () => {
  try {
    createWindow();
  } catch (error) {
     dialog.showErrorBox('Error During Startup', error.stack);
     app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    try {
      createWindow();
    } catch (error) {
       dialog.showErrorBox('Error During Activation', error.stack);
       app.quit();
    }
  }
});
