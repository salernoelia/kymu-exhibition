import { app, BrowserWindow, session, protocol } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const filePath = request.url.replace('file:///', '');
    
    try {
      return callback(filePath);
    } catch (error) {
      console.error('ERROR: ', error);
      return callback({ error: -2 });
    }
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === 'media') {
      callback(true) 
    } else {

      callback(true)
    }
  })

  const mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    kiosk: false,
    // kiosk: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false
    }
  })

  
  
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:* file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://media.giphy.com http://localhost:* file:; connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://api.iconify.design ws: wss: http: https: http://localhost:*; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self'; media-src 'self' blob:; object-src 'none';"
        ],
        'X-Content-Type-Options': ['nosniff']
      }
    })
  })

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({})
  })

  if (app.isPackaged) {
    const baseDir = path.join(__dirname, '..')
    console.log('Base directory:', baseDir)

    fs.readdirSync(baseDir, { withFileTypes: true }).forEach(dirent => {
      console.log(`- ${dirent.name}`, dirent.isDirectory() ? '(dir)' : '(file)')
    })

    const outputDir = path.join(baseDir, '.output')
    console.log('.output exists?', fs.existsSync(outputDir))

    const distDir = path.join(outputDir, 'dist')
    console.log('dist exists?', fs.existsSync(distDir))

    const indexFile = path.join(distDir, 'index.html')
    console.log('index.html exists?', fs.existsSync(indexFile))

    if (fs.existsSync(indexFile)) {
      mainWindow.loadFile(indexFile)
    } else {
      console.error('Cannot find index.html, check your build output')
    }
  } else {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000')
  }
})

app.on('window-all-closed', () => {
  app.quit()
})