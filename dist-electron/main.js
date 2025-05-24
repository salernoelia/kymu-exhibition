import { app as r, protocol as d, session as c, BrowserWindow as f } from "electron";
import * as i from "path";
import * as n from "fs";
r.whenReady().then(() => {
  d.registerFileProtocol("file", (s, e) => {
    const t = s.url.replace("file:///", "");
    try {
      return e(t);
    } catch (o) {
      return console.error("ERROR: ", o), e({ error: -2 });
    }
  }), c.defaultSession.setPermissionRequestHandler((s, e, t, o) => {
    t(!0);
  });
  const l = new f({
    fullscreen: !0,
    frame: !1,
    kiosk: !1,
    // kiosk: true,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0,
      webSecurity: !0,
      webviewTag: !1
    }
  });
  if (l.webContents.openDevTools({ mode: "detach" }), c.defaultSession.webRequest.onHeadersReceived((s, e) => {
    e({
      responseHeaders: {
        ...s.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' http://localhost:* file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://media.giphy.com http://localhost:* file:; connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://api.iconify.design ws: wss: http: https: http://localhost:*; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self'; media-src 'self' blob:; object-src 'none';"
        ],
        "X-Content-Type-Options": ["nosniff"]
      }
    });
  }), c.defaultSession.webRequest.onBeforeRequest((s, e) => {
    e({});
  }), r.isPackaged) {
    const s = i.join(__dirname, "..");
    console.log("Base directory:", s), n.readdirSync(s, { withFileTypes: !0 }).forEach((a) => {
      console.log(`- ${a.name}`, a.isDirectory() ? "(dir)" : "(file)");
    });
    const e = i.join(s, ".output");
    console.log(".output exists?", n.existsSync(e));
    const t = i.join(e, "dist");
    console.log("dist exists?", n.existsSync(t));
    const o = i.join(t, "index.html");
    console.log("index.html exists?", n.existsSync(o)), n.existsSync(o) ? l.loadFile(o) : console.error("Cannot find index.html, check your build output");
  } else
    l.loadURL(process.env.VITE_DEV_SERVER_URL || "http://localhost:3000");
});
r.on("window-all-closed", () => {
  r.quit();
});
