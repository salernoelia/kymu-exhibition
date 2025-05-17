import { app, BrowserWindow, session } from 'electron'
import * as path from 'path'

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    kiosk: false,
    // kiosk: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  })
  
  // Set relaxed Content-Security-Policy for local exhibition
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:* file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://media.giphy.com http://localhost:* file:; connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://api.iconify.design http://localhost:*; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self'; media-src 'self' blob:; object-src 'none';"
        ]
      }
    })
  })

  // In production, load the built files
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    // In development, load from the dev server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000')
  }
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})