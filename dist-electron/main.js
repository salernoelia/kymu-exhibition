import { app as e, session as n, BrowserWindow as i } from "electron";
import * as r from "path";
e.whenReady().then(() => {
  n.defaultSession.setPermissionRequestHandler((o, t, l, a) => {
    t === "media" && l(!0);
  });
  const s = new i({
    fullscreen: !0,
    frame: !1,
    kiosk: !1,
    // kiosk: true,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0,
      webSecurity: !0
    }
  });
  s.webContents.openDevTools({ mode: "detach" }), n.defaultSession.webRequest.onHeadersReceived((o, t) => {
    t({
      responseHeaders: {
        ...o.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' http://localhost:* file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://media.giphy.com http://localhost:* file:; connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://api.iconify.design http://localhost:*; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self'; media-src 'self' blob:; object-src 'none';"
        ]
      }
    });
  }), e.isPackaged ? s.loadFile(r.join(__dirname, "../dist/index.html")) : s.loadURL(process.env.VITE_DEV_SERVER_URL || "http://localhost:3000");
});
e.on("window-all-closed", () => {
  e.quit();
});
